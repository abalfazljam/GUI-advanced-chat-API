<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$DATA_DIR = __DIR__ . '/data';
$CHATS_DIR = $DATA_DIR . '/chats';
$CONFIG_FILE = $DATA_DIR . '/config.json';
$TRASH_DIR = $DATA_DIR . '/trash';
$AVATARS_DIR = $DATA_DIR . '/avatars';
$UPLOADS_DIR = $DATA_DIR . '/uploads';

foreach ([$DATA_DIR, $CHATS_DIR, $TRASH_DIR, $AVATARS_DIR, $UPLOADS_DIR] as $d) {
    if (!is_dir($d)) mkdir($d, 0777, true);
}

function loadConfig() {
    global $CONFIG_FILE;
    if (!file_exists($CONFIG_FILE)) {
        $default = [
            "profile_name" => "کاربر",
            "avatar" => "",
            "ai_name" => "دستیار هوشمند",
            "ai_avatar" => "",
            "providers" => [
                [
                    "id" => "freellmapi",
                    "name" => "FreeLLMAPI",
                    "base_url" => "http://127.0.0.1:31415/v1",
                    "api_key" => "",
                    "models" => []
                ]
            ],
            "active_provider" => "freellmapi",
            "api_key" => "",
            "settings" => [
                "theme" => "dark-blue",
                "temp" => 0.7,
                "anim_type" => "typewriter", // none, typewriter, word, fade, smooth
                "anim_speed" => 25,
                "smart_scroll" => true,
                "prompts" => [
                    ["icon"=>"💻","label"=>"کدنویسی","prompt"=>"یک برنامه پایتون برای محاسبه فیبوناچی بنویس"],
                    ["icon"=>"✍️","label"=>"نوشتن متن","prompt"=>"یک متن خلاقانه درباره فصل بهار بنویس"],
                    ["icon"=>"🧠","label"=>"توضیح مفهوم","prompt"=>"مفهوم هوش مصنوعی را به زبان ساده توضیح بده"],
                    ["icon"=>"🌐","label"=>"ترجمه","prompt"=>"این متن را به انگلیسی ترجمه کن: "]
                ]
            ]
        ];
        file_put_contents($CONFIG_FILE, json_encode($default, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return $default;
    }
    $cfg = json_decode(file_get_contents($CONFIG_FILE), true);
    if (!$cfg) $cfg = [];
    // Migration: legacy api_key to providers
    if (!isset($cfg['providers']) || !is_array($cfg['providers']) || count($cfg['providers'])==0) {
        $legacyKey = $cfg['api_key'] ?? "";
        $cfg['providers'] = [
            [
                "id"=>"freellmapi",
                "name"=>"FreeLLMAPI",
                "base_url"=>"http://127.0.0.1:31415/v1",
                "api_key"=>$legacyKey,
                "models"=>[]
            ]
        ];
        $cfg['active_provider'] = $cfg['active_provider'] ?? "freellmapi";
    } else {
        // If provider has empty api_key but legacy api_key exists, sync it (for freellmapi)
        $legacyKey = $cfg['api_key'] ?? "";
        if (!empty($legacyKey)) {
            foreach ($cfg['providers'] as &$pr) {
                if (empty($pr['api_key']) && $pr['id']==='freellmapi') {
                    $pr['api_key'] = $legacyKey;
                }
            }
        }
    }
    if (!isset($cfg['settings']['anim_type'])) $cfg['settings']['anim_type'] = $cfg['settings']['typewriter'] ?? true ? "typewriter" : "none";
    if (!isset($cfg['settings']['anim_speed'])) $cfg['settings']['anim_speed'] = 25;
    if (!isset($cfg['settings']['smart_scroll'])) $cfg['settings']['smart_scroll'] = true;
    if (!isset($cfg['settings']['prompts']) || count($cfg['settings']['prompts'])==0) {
        $cfg['settings']['prompts'] = [
            ["icon"=>"💻","label"=>"کدنویسی","prompt"=>"یک برنامه پایتون برای محاسبه فیبوناچی بنویس"],
            ["icon"=>"✍️","label"=>"نوشتن متن","prompt"=>"یک متن خلاقانه درباره فصل بهار بنویس"],
        ];
    }
    // Ensure 4 slots
    while (count($cfg['settings']['prompts']) < 4) {
        $cfg['settings']['prompts'][] = ["icon"=>"✨","label"=>"سفارشی ".(count($cfg['settings']['prompts'])+1),"prompt"=>""];
    }
    if (!isset($cfg['settings']['theme'])) $cfg['settings']['theme'] = "dark-blue";
    if (!isset($cfg['settings']['temp'])) $cfg['settings']['temp'] = 0.7;

    return $cfg;
}

function saveConfigFile($cfg) {
    global $CONFIG_FILE;
    file_put_contents($CONFIG_FILE, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function sanitizeId($id) {
    return preg_replace('/[^a-zA-Z0-9_\-]/', '', $id);
}

function normalizeBaseUrl($url) {
    $url = trim($url);
    if (empty($url)) return '';
    // If user pasted full chat/completions endpoint, strip it
    $url = preg_replace('/\/chat\/completions\/?$/i', '', $url);
    $url = preg_replace('/\/models\/?$/i', '', $url);
    // If URL ends with /v1/... maybe keep only up to /v1
    // For typical OpenAI compatible, we want scheme://host[:port]/v1 or scheme://host/v1 or scheme://host
    // If URL contains /v1/ but also extra path like /v1/chat, we already stripped chat/completions, so if still contains /v1/ plus extra, keep up to /v1
    // Example: https://inference.dahl.global/v1/chat/completions -> after strip -> https://inference.dahl.global/v1
    // https://api.openai.com/v1 -> stays
    // https://inference.dahl.global/v1/ -> trim slash later
    // https://example.com/api/v1 -> stays
    $url = rtrim($url, '/');
    // If URL doesn't contain /v1 and is not empty, many providers expect /v1 at end, but we keep as is if user explicitly gave without v1 (some do)
    // However common case: https://inference.dahl.global -> should become https://inference.dahl.global/v1 ?
    // Let's auto-append /v1 if no /v1 in path and host is known to need it? Safer to not auto-append unless looks like base.
    // We'll keep as is, but for known hosts like dahl.global we ensure /v1 exists
    if (stripos($url, 'dahl.global')!==false && stripos($url, '/v1')===false) {
        $url .= '/v1';
    }
    // For openai general, if user gave https://api.openai.com without v1, append /v1
    if (preg_match('/^https?:\/\/api\.openai\.com\/?$/i', $url)) {
        $url .= '/v1';
    }
    return $url;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get_config':
        $cfg = loadConfig();
        // Don't expose full base64 huge? expose anyway but frontend handles
        echo json_encode($cfg, JSON_UNESCAPED_UNICODE);
        break;

    case 'save_config':
        $cfg = loadConfig();
        if (isset($_POST['profile_name'])) $cfg['profile_name'] = $_POST['profile_name'];
        if (isset($_POST['avatar'])) $cfg['avatar'] = $_POST['avatar'];
        if (isset($_POST['ai_name'])) $cfg['ai_name'] = $_POST['ai_name'];
        if (isset($_POST['ai_avatar'])) $cfg['ai_avatar'] = $_POST['ai_avatar'];
        if (isset($_POST['settings'])) {
            $st = json_decode($_POST['settings'], true);
            if ($st) {
                $cfg['settings'] = array_merge($cfg['settings'] ?? [], $st);
            }
        }
        if (isset($_POST['providers'])) {
            $provs = json_decode($_POST['providers'], true);
            if (is_array($provs)) $cfg['providers'] = $provs;
        }
        if (isset($_POST['active_provider'])) $cfg['active_provider'] = $_POST['active_provider'];
        // legacy
        if (isset($_POST['api_key'])) {
            $cfg['api_key'] = $_POST['api_key'];
            // also update active provider key for backward compat
            foreach ($cfg['providers'] as &$p) {
                if ($p['id'] === $cfg['active_provider']) {
                    $p['api_key'] = $_POST['api_key'];
                    break;
                }
            }
        }
        saveConfigFile($cfg);
        echo json_encode(["status"=>"success"]);
        break;

    case 'save_providers':
        $cfg = loadConfig();
        $providersJson = $_POST['providers'] ?? '[]';
        $providers = json_decode($providersJson, true);
        if (!is_array($providers)) $providers = [];
        // Validate each
        $clean = [];
        foreach ($providers as $p) {
            if (!isset($p['id']) || !$p['id']) $p['id'] = 'prov_'.substr(md5(uniqid()),0,8);
            $rawBase = trim($p['base_url'] ?? '');
            $normBase = normalizeBaseUrl($rawBase);
            // custom_models can be string (comma separated) or array
            $custom = $p['custom_models'] ?? [];
            if (is_string($custom)) {
                $custom = array_filter(array_map('trim', explode(',', $custom)));
            } elseif (!is_array($custom)) {
                $custom = [];
            } else {
                // ensure trimmed
                $custom = array_values(array_filter(array_map('trim', $custom)));
            }
            $clean[] = [
                "id"=>sanitizeId($p['id']),
                "name"=>substr($p['name'] ?? 'Custom',0,80),
                "base_url"=>$normBase,
                "api_key"=>trim($p['api_key'] ?? ''),
                "models"=> is_array($p['models']??[]) ? $p['models'] : [],
                "custom_models"=> $custom
            ];
        }
        $cfg['providers'] = $clean;
        if (isset($_POST['active_provider'])) $cfg['active_provider'] = sanitizeId($_POST['active_provider']);
        // Keep legacy api_key in sync with active provider
        $activeId = $cfg['active_provider'];
        foreach ($clean as $pr) {
            if ($pr['id']===$activeId) {
                $cfg['api_key'] = $pr['api_key'];
                break;
            }
        }
        saveConfigFile($cfg);
        echo json_encode(["status"=>"success","providers"=>$clean]);
        break;

    case 'list_chats':
        $files = glob($CHATS_DIR.'/*.json');
        $chats=[];
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            $chats[] = [
                'id'=>basename($file,'.json'),
                'title'=>$data['title']??'بدون عنوان',
                'createdAt'=>filemtime($file),
                'tokens'=>$data['tokens']??0,
                'count'=>count($data['messages']??[])
            ];
        }
        usort($chats, fn($a,$b)=> $b['createdAt'] - $a['createdAt']);
        echo json_encode($chats, JSON_UNESCAPED_UNICODE);
        break;

    case 'search_chats':
        $query = mb_strtolower(trim($_GET['q'] ?? ''), 'UTF-8');
        if (!$query) { echo json_encode([]); exit; }
        $files = glob($CHATS_DIR.'/*.json');
        $results=[];
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            $title = mb_strtolower($data['title']??'', 'UTF-8');
            $found = mb_strpos($title, $query)!==false;
            if (!$found && isset($data['messages'])) {
                foreach ($data['messages'] as $msg) {
                    if (isset($msg['content']) && mb_strpos(mb_strtolower($msg['content'],'UTF-8'), $query)!==false) {
                        $found=true; break;
                    }
                }
            }
            if ($found) {
                $results[] = [
                    'id'=>basename($file,'.json'),
                    'title'=>$data['title']??'بدون عنوان',
                    'createdAt'=>filemtime($file)
                ];
            }
        }
        usort($results, fn($a,$b)=> $b['createdAt'] - $a['createdAt']);
        echo json_encode($results, JSON_UNESCAPED_UNICODE);
        break;

    case 'get_chat':
        $id = sanitizeId($_GET['id'] ?? '');
        $file = $CHATS_DIR.'/'.$id.'.json';
        if (file_exists($file)) {
            header('Content-Type: application/json; charset=utf-8');
            echo file_get_contents($file);
        } else echo json_encode(["error"=>"چت یافت نشد"], JSON_UNESCAPED_UNICODE);
        break;

    case 'save_chat':
        $id = sanitizeId($_POST['id'] ?? '');
        $data = $_POST['data'] ?? '';
        if (!$id) { echo json_encode(["error"=>"invalid id"]); exit; }
        $file = $CHATS_DIR.'/'.$id.'.json';
        // Validate JSON
        $decoded = json_decode($data, true);
        if (!$decoded) { echo json_encode(["error"=>"invalid json"]); exit; }
        file_put_contents($file, $data);
        echo json_encode(["status"=>"success"]);
        break;

    case 'delete_chat':
        $id = sanitizeId($_POST['id'] ?? '');
        $file = $CHATS_DIR.'/'.$id.'.json';
        if (file_exists($file)) {
            copy($file, $TRASH_DIR.'/trash_'.$id.'.json');
            unlink($file);
        }
        echo json_encode(["status"=>"success"]);
        break;

    case 'restore_chat':
        $id = sanitizeId($_POST['id'] ?? '');
        $trash_file = $TRASH_DIR.'/trash_'.$id.'.json';
        $file = $CHATS_DIR.'/'.$id.'.json';
        if (file_exists($trash_file)) {
            rename($trash_file, $file);
            echo json_encode(["status"=>"success"]);
        } else echo json_encode(["error"=>"قابل بازیابی نیست"], JSON_UNESCAPED_UNICODE);
        break;

    case 'list_trash':
        $files = glob($TRASH_DIR.'/trash_*.json');
        $trash=[];
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            $trash[] = [
                'id'=>str_replace('trash_','',basename($file,'.json')),
                'title'=>$data['title']??'بدون عنوان',
                'deletedAt'=>filemtime($file)
            ];
        }
        usort($trash, fn($a,$b)=> $b['deletedAt'] - $a['deletedAt']);
        echo json_encode($trash, JSON_UNESCAPED_UNICODE);
        break;

    case 'empty_trash':
        $files = glob($TRASH_DIR.'/trash_*.json');
        foreach ($files as $f) unlink($f);
        echo json_encode(["status"=>"success"]);
        break;

    case 'delete_trash_item':
        $id = sanitizeId($_POST['id'] ?? '');
        $trash_file = $TRASH_DIR.'/trash_'.$id.'.json';
        if (file_exists($trash_file)) unlink($trash_file);
        echo json_encode(["status"=>"success"]);
        break;

    case 'clear_all_chats':
        foreach (glob($CHATS_DIR.'/*.json') as $f) unlink($f);
        foreach (glob($TRASH_DIR.'/trash_*.json') as $f) unlink($f);
        echo json_encode(["status"=>"success"]);
        break;

    case 'get_models':
        $cfg = loadConfig();
        $activeId = $_GET['provider'] ?? $cfg['active_provider'] ?? 'freellmapi';
        $provider = null;
        foreach ($cfg['providers'] as $p) {
            if ($p['id']===$activeId) { $provider=$p; break; }
        }
        if (!$provider) $provider = $cfg['providers'][0] ?? null;
        // Fallback to legacy api_key if provider key empty
        $apiKey = $provider['api_key'] ?? '';
        if (empty($apiKey)) $apiKey = $cfg['api_key'] ?? '';
        if (!$provider || empty($apiKey)) {
            echo json_encode(["error"=>"no_api_key","provider"=>$activeId,"hint"=>"کلید API را در مدیریت پرووایدرها وارد کنید"], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $baseRaw = $provider['base_url'] ?? '';
        if (empty($baseRaw)) $baseRaw = 'http://127.0.0.1:31415/v1';
        $base = normalizeBaseUrl($baseRaw);
        if (empty($base)) $base = 'http://127.0.0.1:31415/v1';
        $urlsToTry = [$base.'/models'];
        // Add alternative localhost variants for freellmapi
        if (strpos($base,'127.0.0.1')!==false) {
            $urlsToTry[] = str_replace('127.0.0.1','localhost',$base).'/models';
            $urlsToTry[] = str_replace('127.0.0.1','host.docker.internal',$base).'/models';
        }
        $lastErr = ''; $lastHttp=0; $lastUrl='';
        $finalResponse = null;
        foreach ($urlsToTry as $url) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer '.$apiKey, 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_USERAGENT, 'AdvancedChat/2.1');
            $response = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            $lastErr = $err; $lastHttp=$httpcode; $lastUrl=$url;
            if ($httpcode==200 && $response) { $finalResponse=$response; break; }
            // Try next url if connection failed
            if ($httpcode==0 && !empty($err)) continue;
        }
        if ($finalResponse) {
            $j = json_decode($finalResponse,true);
            if (!$j) {
                echo json_encode(["error"=>"پاسخ نامعتبر از سرور","raw"=>substr($finalResponse,0,500),"url"=>$lastUrl], JSON_UNESCAPED_UNICODE);
                exit;
            }
            if (isset($j['data']) && is_array($j['data'])) {
                $seen=[]; $filtered=[];
                foreach ($j['data'] as $m) {
                    $mid = strtolower(trim($m['id'] ?? ''));
                    if ($mid==='' ) continue;
                    if ($mid==='auto' && isset($seen['auto'])) continue;
                    $seen[$mid]=true;
                    $filtered[]=$m;
                }
                $j['data']=$filtered;
                foreach ($cfg['providers'] as &$pp) {
                    if ($pp['id']===$provider['id']) { $pp['models']= array_column($filtered,'id'); $pp['api_key']=$apiKey; if (empty($pp['base_url'])) $pp['base_url']=$base; break; }
                }
                saveConfigFile($cfg);
            }
            header('Content-Type: application/json');
            echo json_encode($j, JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["error"=>"خطا در دریافت مدل‌ها - بررسی کنید آدرس و کلید و اجرای سرور FreeLLMAPI","http"=>$lastHttp,"detail"=>$lastErr,"url"=>$lastUrl,"tried"=>$urlsToTry], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'get_all_providers_models':
        $cfg = loadConfig();
        $all=[];
        foreach ($cfg['providers'] as $provider) {
            $apiKey = $provider['api_key'] ?? $cfg['api_key'] ?? '';
            if (empty($apiKey)) continue;
            $baseRaw = $provider['base_url'] ?? 'http://127.0.0.1:31415/v1';
            $base = normalizeBaseUrl($baseRaw);
            if (empty($base)) $base = 'http://127.0.0.1:31415/v1';
            $url = $base.'/models';
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer '.$apiKey, 'Accept: application/json']);
            curl_setopt($ch, CURLOPT_USERAGENT, 'AdvancedChat/2.2');
            $response = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpcode==200 && $response) {
                $j = json_decode($response,true);
                $models=[];
                if (isset($j['data'])) {
                    $seen=[];
                    foreach ($j['data'] as $m) {
                        $mid = trim($m['id'] ?? '');
                        if (!$mid) continue;
                        $low = strtolower($mid);
                        if (isset($seen[$low])) continue;
                        $seen[$low]=true;
                        $models[]=$mid;
                    }
                }
                $all[$provider['id']] = $models;
            } else {
                $all[$provider['id']] = [];
            }
        }
        echo json_encode($all, JSON_UNESCAPED_UNICODE);
        break;

    case 'upload_avatar':
        // Expects file and type=user/ai + old path handling
        $type = $_POST['type'] ?? 'user';
        $type = in_array($type, ['user','ai']) ? $type : 'user';
        if (!isset($_FILES['file'])) { echo json_encode(["error"=>"no file"]); exit; }
        $tmp = $_FILES['file']['tmp_name'];
        $mime = mime_content_type($tmp);
        if (strpos($mime,'image/')!==false) {
            $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            $ext = $ext ? strtolower($ext) : 'jpg';
            if (!in_array($ext, ['jpg','jpeg','png','webp','gif'])) $ext='jpg';
            $filename = $type.'_'.time().'_'.substr(md5(uniqid()),0,6).'.'.$ext;
            $dest = $AVATARS_DIR.'/'.$filename;
            // Resize if too big > 400px
            $data = file_get_contents($tmp);
            // Try resize via GD if available
            if (function_exists('imagecreatefromstring')) {
                $img = @imagecreatefromstring($data);
                if ($img) {
                    $w = imagesx($img); $h = imagesy($img);
                    $max=400;
                    if ($w>$max || $h>$max) {
                        $ratio = min($max/$w, $max/$h);
                        $nw = intval($w*$ratio); $nh = intval($h*$ratio);
                        $new = imagecreatetruecolor($nw,$nh);
                        imagealphablending($new,false);
                        imagesavealpha($new,true);
                        imagecopyresampled($new,$img,0,0,0,0,$nw,$nh,$w,$h);
                        imagedestroy($img);
                        $img=$new;
                        $w=$nw; $h=$nh;
                    }
                    // Save
                    if ($ext==='png') imagepng($img,$dest);
                    else if ($ext==='webp' && function_exists('imagewebp')) imagewebp($img,$dest,80);
                    else imagejpeg($img,$dest,85);
                    imagedestroy($img);
                } else {
                    move_uploaded_file($tmp,$dest);
                }
            } else {
                move_uploaded_file($tmp,$dest);
            }
            // Store relative path
            $relPath = 'data/avatars/'.$filename;
            // Update config
            $cfg = loadConfig();
            if ($type==='user') $cfg['avatar']=$relPath;
            else $cfg['ai_avatar']=$relPath;
            saveConfigFile($cfg);
            echo json_encode(["status"=>"success","path"=>$relPath,"type"=>$type], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["error"=>"فرمت عکس نامعتبر"], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'delete_avatar':
        $type = $_POST['type'] ?? 'user';
        $cfg = loadConfig();
        $path = $type==='user' ? ($cfg['avatar']??'') : ($cfg['ai_avatar']??'');
        if ($path && strpos($path,'data/avatars/')===0) {
            $full = __DIR__.'/'.$path;
            if (file_exists($full)) unlink($full);
        }
        if ($type==='user') $cfg['avatar']='';
        else $cfg['ai_avatar']='';
        saveConfigFile($cfg);
        echo json_encode(["status"=>"success"]);
        break;

    case 'upload_file':
        if (!isset($_FILES['file'])) { echo json_encode(["status"=>"error","message"=>"فایلی ارسال نشد"]); exit; }
        $tmp_name = $_FILES['file']['tmp_name'];
        $name = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $mime = mime_content_type($tmp_name) ?: '';
        $size = filesize($tmp_name);

        if ($size > 20*1024*1024) { echo json_encode(["status"=>"error","message"=>"حجم فایل بیش از ۲۰ مگابایت"]); exit; }

        // Image
        if (strpos($mime,'image/')!==false || in_array($ext,['jpg','jpeg','png','webp','gif','bmp'])) {
            $data = file_get_contents($tmp_name);
            $b64 = 'data:'.$mime.';base64,'.base64_encode($data);
            // Also save to uploads for persistence if large? keep base64 for now
            echo json_encode(["status"=>"success","type"=>"image","content"=>$b64,"name"=>$name,"mime"=>$mime], JSON_UNESCAPED_UNICODE);
        }
        // Audio
        else if (strpos($mime,'audio/')!==false || in_array($ext,['mp3','wav','ogg','m4a','flac','aac','opus'])) {
            $destName = time().'_'.preg_replace('/[^a-zA-Z0-9_.-]/','_',$name);
            $dest = $UPLOADS_DIR.'/'.$destName;
            move_uploaded_file($tmp_name,$dest);
            $rel = 'data/uploads/'.$destName;
            echo json_encode(["status"=>"success","type"=>"audio","content"=>$rel,"name"=>$name,"mime"=>$mime,"url"=>$rel], JSON_UNESCAPED_UNICODE);
        }
        // Video
        else if (strpos($mime,'video/')!==false || in_array($ext,['mp4','webm','mov','avi','mkv'])) {
            $destName = time().'_'.preg_replace('/[^a-zA-Z0-9_.-]/','_',$name);
            $dest = $UPLOADS_DIR.'/'.$destName;
            move_uploaded_file($tmp_name,$dest);
            $rel = 'data/uploads/'.$destName;
            echo json_encode(["status"=>"success","type"=>"video","content"=>$rel,"name"=>$name,"mime"=>$mime,"url"=>$rel], JSON_UNESCAPED_UNICODE);
        }
        // Text
        else if (in_array($ext,['txt','md','json','csv','log','js','py','php','html','css','c','cpp','java']) || strpos($mime,'text/')!==false) {
            $content = file_get_contents($tmp_name);
            if (mb_strlen($content)>200000) $content = mb_substr($content,0,200000)."\n... (فایل طولانی برش خورد)";
            echo json_encode(["status"=>"success","type"=>"text","content"=>$content,"name"=>$name], JSON_UNESCAPED_UNICODE);
        } else {
            // Generic: try to save
            $destName = time().'_'.preg_replace('/[^a-zA-Z0-9_.-]/','_',$name);
            $dest = $UPLOADS_DIR.'/'.$destName;
            move_uploaded_file($tmp_name,$dest);
            $rel = 'data/uploads/'.$destName;
            echo json_encode(["status"=>"success","type"=>"file","content"=>$rel,"name"=>$name,"mime"=>$mime,"url"=>$rel], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'export_chats':
        $files = glob($CHATS_DIR.'/*.json');
        $export = [];
        foreach ($files as $f) {
            $export[] = json_decode(file_get_contents($f), true);
        }
        $cfg = loadConfig();
        $bundle = [
            "exported_at"=>date('c'),
            "config"=>$cfg,
            "chats"=>$export
        ];
        // If ?download=1 return as file
        if (isset($_GET['download'])) {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="chat_export_'.date('Y-m-d').'.json"');
            echo json_encode($bundle, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
        } else {
            echo json_encode(["status"=>"success","count"=>count($export),"data"=>$bundle], JSON_UNESCAPED_UNICODE);
        }
        break;

    case 'import_chats':
        // Expects JSON file upload or raw JSON in POST
        $jsonStr = "";
        if (isset($_FILES['file'])) {
            $jsonStr = file_get_contents($_FILES['file']['tmp_name']);
        } else if (isset($_POST['data'])) {
            $jsonStr = $_POST['data'];
        }
        if (!$jsonStr) { echo json_encode(["error"=>"داده‌ای ارسال نشد"]); exit; }
        $bundle = json_decode($jsonStr, true);
        if (!$bundle) { echo json_encode(["error"=>"JSON نامعتبر"]); exit; }
        $chats = $bundle['chats'] ?? $bundle; // support both bundle and array
        if (isset($chats['chats'])) $chats = $chats['chats']; // nested?
        if (!is_array($chats)) $chats = [$chats];
        $imported=0;
        foreach ($chats as $c) {
            if (!isset($c['id']) || !isset($c['messages'])) continue;
            $id = sanitizeId($c['id']);
            if (!$id) $id = 'chat_'.time().'_'.substr(md5(uniqid()),0,6);
            $file = $CHATS_DIR.'/'.$id.'.json';
            // If exists, create new id
            if (file_exists($file)) {
                $id = 'chat_'.time().'_'.substr(md5(uniqid()),0,6);
                $c['id']=$id;
                $file = $CHATS_DIR.'/'.$id.'.json';
            }
            file_put_contents($file, json_encode($c, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
            $imported++;
        }
        echo json_encode(["status"=>"success","imported"=>$imported], JSON_UNESCAPED_UNICODE);
        break;

    case 'get_stats':
        $files = ['index.php','backend.php','api.php','assets/style.css','assets/script.js'];
        $total=0;
        $details=[];
        foreach ($files as $f) {
            $path = __DIR__.'/'.$f;
            if (file_exists($path)) {
                $lines = count(file($path));
                $details[$f]=$lines;
                $total+=$lines;
            }
        }
        echo json_encode(["total"=>$total,"files"=>$details], JSON_UNESCAPED_UNICODE);
        break;

    case 'get_github_user':
        $username = $_GET['user'] ?? 'abalfazljam';
        $username = preg_replace('/[^a-zA-Z0-9\-]/','',$username);
        $url = "https://api.github.com/users/".$username;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'PHP-ChatApp');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code==200 && $res) {
            header('Content-Type: application/json');
            echo $res;
        } else {
            echo json_encode(["login"=>$username,"name"=>"ابوالفضل جمشیدیان","html_url"=>"https://github.com/".$username], JSON_UNESCAPED_UNICODE);
        }
        break;

    default:
        echo json_encode(["error"=>"action not found: ".$action], JSON_UNESCAPED_UNICODE);
}
