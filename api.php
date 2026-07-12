<?php
$DATA_DIR = __DIR__ . '/data';
$CONFIG_FILE = $DATA_DIR . '/config.json';

header('Content-Type: text/event-stream; charset=utf-8');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

while (ob_get_level() > 0) ob_end_flush();
ini_set('output_buffering','off');

function normalizeBaseUrlApi($url) {
    $url = trim($url);
    if (empty($url)) return 'http://127.0.0.1:31415/v1';
    $url = preg_replace('/\/chat\/completions\/?$/i', '', $url);
    $url = preg_replace('/\/models\/?$/i', '', $url);
    $url = rtrim($url, '/');
    if (stripos($url, 'dahl.global')!==false && stripos($url, '/v1')===false) $url .= '/v1';
    if (preg_match('/^https?:\/\/api\.openai\.com\/?$/i', $url)) $url .= '/v1';
    return $url;
}

if (!file_exists($CONFIG_FILE)) {
    echo "data: ".json_encode(["error"=>"کلید API تنظیم نشده است. لطفا به بخش تنظیمات بروید."], JSON_UNESCAPED_UNICODE)."\n\n";
    exit;
}

$config = json_decode(file_get_contents($CONFIG_FILE), true);
if (!$config) {
    echo "data: ".json_encode(["error"=>"خطا در خواندن تنظیمات"], JSON_UNESCAPED_UNICODE)."\n\n";
    exit;
}

$providers = $config['providers'] ?? [];
$activeId = $config['active_provider'] ?? 'freellmapi';
$provider = null;
foreach ($providers as $p) {
    if ($p['id']===$activeId) { $provider=$p; break; }
}
if (!$provider) $provider = $providers[0] ?? null;

if ($provider && empty($provider['api_key']) && !empty($config['api_key'])) {
    $provider['api_key'] = $config['api_key'];
}

$API_KEY = $provider['api_key'] ?? $config['api_key'] ?? '';
$BASE_URL_RAW = $provider['base_url'] ?? 'http://127.0.0.1:31415/v1';
$BASE_URL = normalizeBaseUrlApi($BASE_URL_RAW);

if (empty($API_KEY)) {
    echo "data: ".json_encode(["error"=>"کلید API تنظیم نشده است. Provider: ".($provider['name']??$activeId)." - لطفا در تنظیمات > مدیریت پرووایدرها کلید را وارد کنید."], JSON_UNESCAPED_UNICODE)."\n\n";
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$messages = $input['messages'] ?? [];
$model = $input['model'] ?? 'auto';
$temperature = floatval($input['temperature'] ?? ($config['settings']['temp'] ?? 0.7));

// --- Auto model fallback for non-FreeLLMAPI providers (like Dahl) ---
if (strtolower($model)==='auto') {
    $candidates = [];
    if (!empty($provider['custom_models']) && is_array($provider['custom_models'])) {
        $candidates = array_merge($candidates, $provider['custom_models']);
    }
    if (!empty($provider['models']) && is_array($provider['models'])) {
        foreach ($provider['models'] as $m) {
            if (strtolower($m)!=='auto') $candidates[] = $m;
        }
    }
    $candidates = array_values(array_filter(array_map('trim', $candidates)));
    if (!empty($candidates)) {
        // Pick first candidate that looks valid
        $model = $candidates[0];
    } else {
        // Keep auto for FreeLLMAPI, otherwise try to keep auto but Dahl may not understand auto -> keep auto and let server decide? We'll keep auto
        // For Dahl, if no candidates, keep auto
    }
}

if (empty($messages)) {
    echo "data: ".json_encode(["error"=>"هیچ پیامی ارسال نشده"], JSON_UNESCAPED_UNICODE)."\n\n";
    exit;
}

$payload = [
    'model'=>$model,
    'messages'=>$messages,
    'temperature'=>$temperature,
    'stream'=>true,
    'max_tokens'=>8192,
];

// Only send web_search for FreeLLMAPI (others may reject unknown param)
$isFreeLLM = ($provider && ($provider['id']==='freellmapi' || stripos($BASE_URL,'127.0.0.1')!==false || stripos($BASE_URL,'localhost')!==false));
if (isset($input['web_search']) && $isFreeLLM) {
    $payload['web_search'] = (bool)$input['web_search'];
}

$chatUrl = $BASE_URL . '/chat/completions';

// --- Try streaming, with fallback to non-streaming ---
$accumulated = '';
$isSSE = false;
$httpCode = 0;
$curlError = '';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL=> $chatUrl,
    CURLOPT_POST=> true,
    CURLOPT_POSTFIELDS=> json_encode($payload, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER=> [
        'Content-Type: application/json',
        'Authorization: Bearer '.$API_KEY,
        'Accept: text/event-stream',
        'User-Agent: AdvancedChat/2.2'
    ],
    CURLOPT_TIMEOUT=> 300,
    CURLOPT_CONNECTTIMEOUT=> 15,
    CURLOPT_FOLLOWLOCATION=> true,
    CURLOPT_SSL_VERIFYPEER=> false,
    CURLOPT_WRITEFUNCTION=> function($ch,$data) use (&$accumulated, &$isSSE) {
        $accumulated .= $data;
        if (!$isSSE && (strpos($data,'data:')!==false || strpos($data,'event:')!==false)) {
            $isSSE = true;
        }
        echo $data;
        @flush();
        return strlen($data);
    },
    CURLOPT_HEADER=> false,
]);

// We need to get http code after exec, but with WRITEFUNCTION we still get code via getinfo
$success = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// If HTTP error, try to output error as SSE
if ($httpCode>=400) {
    // $accumulated likely contains JSON error
    $errJson = json_decode($accumulated, true);
    $errMsg = $errJson['error']['message'] ?? $errJson['error'] ?? $errJson['message'] ?? $accumulated;
    if (empty($errMsg)) $errMsg = "HTTP $httpCode - $curlError";
    // If model was auto and failed, try fallback without streaming?
    echo "data: ".json_encode(["error"=>"خطا از سرور ($httpCode): $errMsg - مدل: $model - URL: $chatUrl - بررسی کنید مدل انتخابی درست باشد (برای Dahl مدل auto معتبر نیست، یک مدل خاص انتخاب کنید)."], JSON_UNESCAPED_UNICODE)."\n\n";
    echo "data: [DONE]\n\n";
    flush();
    exit;
}

// If we got 200 but response was NOT SSE (i.e., provider returned full JSON despite stream=true), convert JSON to SSE
if ($httpCode==200 && !$isSSE) {
    // Try to parse accumulated as JSON
    $json = json_decode($accumulated, true);
    if ($json && isset($json['choices'][0]['message']['content'])) {
        $content = $json['choices'][0]['message']['content'];
        // Simulate streaming by splitting into chunks
        $chunks = mb_str_split($content, 15); // 15 chars per chunk
        foreach ($chunks as $chunk) {
            $sse = ["choices"=>[["delta"=>["content"=>$chunk]]]];
            echo "data: ".json_encode($sse, JSON_UNESCAPED_UNICODE)."\n\n";
            @flush();
            usleep(15000); // 15ms delay to simulate typewriter
        }
    } elseif ($json && isset($json['choices'][0]['delta']['content'])) {
        // Already delta format but not SSE? Just re-output?
        // Do nothing, already echoed? Actually we echoed raw JSON which is not SSE, so we need to convert
        $content = $json['choices'][0]['delta']['content'] ?? '';
        if ($content) {
            $sse = ["choices"=>[["delta"=>["content"=>$content]]]];
            echo "data: ".json_encode($sse, JSON_UNESCAPED_UNICODE)."\n\n";
        }
    } else {
        // Unknown format, try to forward as content
        if (!empty($accumulated)) {
            // If accumulated is JSON with content field, try to extract
            if (is_string($accumulated)) {
                echo "data: ".json_encode(["choices"=>[["delta"=>["content"=>$accumulated]]]], JSON_UNESCAPED_UNICODE)."\n\n";
            }
        }
    }
}

echo "data: [DONE]\n\n";
flush();
