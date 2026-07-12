<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="page_title">چت هوش مصنوعی پیشرفته</title>
    <link rel="stylesheet" href="assets/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/styles/atom-one-dark.min.css">
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release/build/highlight.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked-katex-extension/lib/index.umd.js"></script>
</head>
<body>
    <div class="app" id="app">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div style="display: flex; gap: 8px; width: 100%;">
                    <button class="new-chat-btn" id="newChatBtn" style="flex: 1;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span data-i18n="new_chat">گفتگوی جدید</span>
                    </button>
                    <button class="icon-btn" id="openTrashBtn" data-i18n-title="trash" title="سطل زباله" style="background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
                <div class="chat-search-wrapper">
                    <svg class="chat-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" id="chatSearchInput" class="chat-search-input" data-i18n-placeholder="search_chats" placeholder="جستجوی گفتگو..." autocomplete="off">
                    <button class="chat-search-clear" id="chatSearchClear" style="display:none">&times;</button>
                </div>
            </div>
            <div class="chat-list" id="chatList"></div>
            <div class="sidebar-footer">
                <div class="profile-section">
                    <div class="profile-avatar" id="profileAvatarBtn">
                        <img id="profileAvatarImg" src="https://ui-avatars.com/api/?name=User&background=2563eb&color=fff" alt="پروفایل">
                        <div class="upload-overlay" data-i18n="settings">تغییر</div>
                        <input type="file" id="avatarInput" accept="image/*" hidden>
                    </div>
                    <div class="profile-info">
                        <input type="text" id="profileNameInput" class="profile-name-input" data-i18n-placeholder="your_name_placeholder" placeholder="اسم شما" value="کاربر">
                        <button class="settings-btn" id="openSettingsBtn" data-i18n="settings">تنظیمات</button>
                    </div>
                </div>
            </div>
        </aside>
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <button class="expand-sidebar-btn" id="expandSidebarBtn" data-i18n-title="expand_menu" title="باز کردن منو">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        </button>
        <main class="chat-main">
            <header class="chat-header">
                <button class="icon-btn menu-btn" id="menuToggle" data-i18n-title="menu" title="منو">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button class="icon-btn collapse-btn" id="collapseSidebarBtn" data-i18n-title="collapse_menu" title="جمع کردن منو">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="15" y1="3" x2="15" y2="21"></line></svg>
                    </button>
                    <button class="icon-btn" id="openAboutBtn" data-i18n-title="about" title="درباره برنامه">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
                <div class="header-title">
                    <div class="logo-icon">AI</div>
                    <h1 id="currentChatTitle" data-i18n="chat_ai">چت هوش مصنوعی</h1>
                    <span id="modelBadge" class="model-badge">Auto</span>
                </div>
                <div class="header-actions">
                    <select id="langSelect" class="lang-select" data-i18n-title="language" title="زبان" style="padding:6px 8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary); font-family:inherit; font-size:12px;">
                        <option value="fa">🇮🇷 فارسی</option>
                        <option value="en">🇺🇸 English</option>
                    </select>
                    <div class="custom-select" id="modelSelectContainer">
                        <div class="select-trigger" id="modelSelectTrigger">
                            <span id="modelSelectText" data-i18n="auto">خودکار (Auto)</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div class="select-dropdown" id="modelSelectDropdown">
                            <input type="text" class="select-search" id="modelSearchInput" data-i18n-placeholder="search_model" placeholder="جستجوی مدل..." autocomplete="off">
                            <div class="select-options" id="modelSelectOptions"></div>
                        </div>
                    </div>
                    <div class="custom-select" id="providerSelectContainer" style="width:160px;">
                        <div class="select-trigger" id="providerSelectTrigger">
                            <span id="providerSelectText">FreeLLMAPI</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div class="select-dropdown" id="providerSelectDropdown">
                            <div class="select-options" id="providerSelectOptions"></div>
                        </div>
                    </div>
                </div>
            </header>
            <div class="messages-container" id="messagesContainer">
                <div class="messages" id="messages">
                    <div class="welcome-screen" id="welcomeScreen">
                        <div class="welcome-icon">✨</div>
                        <h2 data-i18n="welcome_title">به دستیار هوشمند خوش آمدید</h2>
                        <p data-i18n="welcome_desc">برای شروع، یک سوال بپرسید یا یکی از گزینه‌های زیر را انتخاب کنید</p>
                        <div class="suggestions" id="suggestionsContainer"></div>
                    </div>
                </div>
            </div>
            <div class="input-area">
                <div class="chat-stats-bar" id="chatStatsBar" data-i18n="token_usage">توکن مصرفی این چت: 0</div>
                <div id="imagePreviewContainer" class="image-preview-container" style="display:none;"></div>
                <div id="smartScrollBtn" class="smart-scroll-btn" style="display:none;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    <span data-i18n="go_down">برو پایین</span>
                </div>
                <div class="input-wrapper">
                    <button class="icon-input-btn" id="webSearchBtn" data-i18n-title="web_search" title="جستجوی وب">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </button>
                    <button class="icon-input-btn" id="attachFileBtn" data-i18n-title="upload_file" title="آپلود فایل/عکس/صوت/ویدیو">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input type="file" id="fileInput" hidden accept="image/*,audio/*,video/*,.txt,.md,.json,.csv,.log,.js,.py,.php,.html,.css">
                    <textarea id="messageInput" class="message-input" data-i18n-placeholder="message_placeholder" placeholder="پیام خود را بنویسید..." rows="1" autocomplete="off"></textarea>
                    <button class="send-btn" id="sendBtn" data-i18n-title="send" title="ارسال"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                    <button class="stop-btn" id="stopBtn" data-i18n-title="stop" title="توقف" style="display:none"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg></button>
                </div>
                <div class="input-hint" data-i18n="input_hint">Enter برای ارسال • Shift+Enter برای خط جدید • فایل صوتی/تصویری هم پشتیبانی می‌شود</div>
            </div>
        </main>
        <button class="msg-nav-toggle" id="msgNavToggle" data-i18n-title="my_messages" title="پیام‌های من">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <div class="msg-nav-panel" id="msgNavPanel">
            <div class="msg-nav-header">
                <span data-i18n="my_messages">پیام‌های من</span>
                <button class="msg-nav-close" id="msgNavClose">&times;</button>
            </div>
            <div class="msg-nav-list" id="msgNavList"></div>
        </div>
    </div>

    <!-- Settings Modal -->
    <div class="modal" id="settingsModal">
        <div class="modal-content" style="max-width:750px;">
            <div class="modal-header">
                <h2 data-i18n="advanced_settings">تنظیمات پیشرفته</h2>
                <button class="close-btn" id="closeSettingsBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="setting-group">
                    <label data-i18n="provider_mgmt">مدیریت پرووایدرها (API Providers)</label>
                    <div id="providersList" style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding:5px;"></div>
                    <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
                        <button class="btn-secondary" id="addProviderBtn" data-i18n="add_custom_provider">+ افزودن پرووایدر سفارشی</button>
                        <button class="btn-secondary" id="fetchAllModelsBtn" data-i18n="fetch_all_models">🔄 دریافت همه مدل‌ها</button>
                    </div>
                    <small style="color:var(--text-tertiary); font-size:11px; margin-top:6px;" data-i18n="provider_hint">می‌تونی OpenAI, Groq, OpenRouter, و هر API سازگار با OpenAI را اضافه کنی. base_url باید تا /v1 باشد. مثال FreeLLMAPI: http://127.0.0.1:31415/v1 - برای Dahl: https://inference.dahl.global/v1</small>
                </div>

                <div class="setting-group">
                    <label data-i18n="ai_settings">تنظیمات هوش مصنوعی</label>
                    <div class="api-input-group">
                        <input type="text" id="aiNameInput" data-i18n-placeholder="ai_name_placeholder" placeholder="نام هوش مصنوعی (مثلا: ربات من)">
                        <button id="aiAvatarBtn" class="btn-secondary" data-i18n="upload_ai_avatar">آپلود عکس AI</button>
                        <button id="deleteAiAvatarBtn" class="btn-danger" style="padding:10px 12px;" data-i18n="delete_avatar">حذف عکس</button>
                        <input type="file" id="aiAvatarInput" accept="image/*" hidden>
                    </div>
                </div>

                <div class="setting-group">
                    <label data-i18n="user_profile_settings">تنظیمات پروفایل کاربر</label>
                    <div class="api-input-group">
                        <input type="text" id="settingsProfileNameInput" data-i18n-placeholder="your_name_placeholder" placeholder="اسم شما">
                        <button id="settingsUserAvatarBtn" class="btn-secondary" data-i18n="upload_my_avatar">آپلود عکس من</button>
                        <button id="deleteUserAvatarBtn" class="btn-danger" style="padding:10px 12px;" data-i18n="delete_avatar">حذف عکس</button>
                        <input type="file" id="settingsUserAvatarInput" accept="image/*" hidden>
                    </div>
                    <small style="color:var(--text-tertiary); font-size:11px; margin-top:4px;" data-i18n="avatar_hint">عکس‌ها در سرور دخیره می‌شوند و با حذف از سیستم پاک نمی‌شوند. این بخش همان تنظیم سایدبار است.</small>
                </div>

                <div class="setting-group">
                    <label data-i18n="temperature">دقت (Temperature)</label>
                    <div class="slider-row">
                        <input type="range" id="tempSlider" min="0" max="2" step="0.1" value="0.7">
                        <span id="tempValue">۰.۷</span>
                    </div>
                </div>

                <div class="setting-group">
                    <label data-i18n="animation_response">انیمیشن پاسخ</label>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                        <select id="animTypeSelect" style="flex:1; min-width:200px; padding:10px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-sm); color:var(--text-primary); font-family:inherit;">
                            <option value="none" data-i18n="no_animation">بدون انیمیشن (فوری)</option>
                            <option value="typewriter" data-i18n="typewriter_opt">تایپ تدریجی بهینه (Typewriter)</option>
                            <option value="word" data-i18n="word_opt">کلمه به کلمه (Word)</option>
                            <option value="fade" data-i18n="fade_opt">ظهور تدریجی بلوکی (Fade)</option>
                            <option value="smooth" data-i18n="smooth_opt">نمایش نرم با کرسر (Smooth)</option>
                        </select>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <label style="font-size:12px; white-space:nowrap;" data-i18n="speed">سرعت</label>
                            <input type="range" id="animSpeedSlider" min="5" max="100" step="5" value="25" style="width:110px;">
                            <span id="animSpeedValue" style="font-size:12px; min-width:28px;">25</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:14px; padding:10px 12px; background:var(--bg-tertiary); border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                        <span style="font-size:13px; font-weight:500; color:var(--text-primary);" data-i18n="smart_scroll">اسکرول هوشمند (اگر بالا باشی، مزاحم نشود)</span>
                        <label class="switch" style="flex-shrink:0;">
                            <input type="checkbox" id="smartScrollToggle" checked>
                            <span class="slider-switch"></span>
                        </label>
                    </div>
                </div>

                <div class="setting-group">
                    <label data-i18n="default_prompts">دستورهای پیش‌فرض (حداکثر ۴ عدد - آیکون ایموجی قابل ویرایش)</label>
                    <div id="promptsEditor" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>

                <div class="setting-group">
                    <label data-i18n="backup_chats">پشتیبان‌گیری چت‌ها</label>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn-secondary" id="exportChatsBtn" data-i18n="export_json">📤 خروجی گرفتن (Export JSON)</button>
                        <button class="btn-secondary" id="importChatsBtn" data-i18n="import_json">📥 وارد کردن (Import)</button>
                        <input type="file" id="importFileInput" accept=".json" hidden>
                    </div>
                </div>

                <div class="setting-group">
                    <label data-i18n="theme_select">انتخاب تم رنگی (۱۰۰ تم جذاب)</label>
                    <div class="theme-grid" id="themeGrid"></div>
                </div>

                <div class="modal-actions">
                    <button class="btn-danger" id="resetSettingsBtn" data-i18n="reset_full">ریست کامل</button>
                    <button class="btn-primary" id="saveSettingsBtn" data-i18n="save_settings">ذخیره تنظیمات</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Trash Modal -->
    <div class="modal" id="trashModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 data-i18n="trash_title">سطل زباله چت‌ها</h2>
                <button class="close-btn" id="closeTrashBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 13px; color: var(--text-secondary);" data-i18n="trash_desc">گفتگوهای حذف شده شما در این بخش قابل بازیابی یا حذف دائم هستند.</span>
                    <button class="btn-danger" id="emptyTrashBtn" style="font-size: 12px; padding: 6px 12px; border-radius: var(--radius-sm);" data-i18n="empty_trash">خالی کردن سطل زباله</button>
                </div>
                <div id="trashList" style="max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 5px;"></div>
            </div>
        </div>
    </div>

    <!-- About Modal -->
    <div class="modal" id="aboutModal">
        <div class="modal-content" style="max-width:520px;">
            <div class="modal-header">
                <h2 data-i18n="about_title">درباره برنامه</h2>
                <button class="close-btn" id="closeAboutBtn">&times;</button>
            </div>
            <div class="modal-body" style="text-align:center;">
                <div id="aboutGithubProfile" style="display:flex; flex-direction:column; align-items:center; gap:12px;">
                    <img id="aboutAvatar" src="https://avatars.githubusercontent.com/u/abalfazljam?v=4" style="width:90px; height:90px; border-radius:50%; border:3px solid var(--accent);" alt="avatar" onerror="this.src='https://ui-avatars.com/api/?name=Abolfazl&background=2563eb&color=fff'">
                    <h3 id="aboutName" style="margin:0;" data-i18n="dev_name">ابوالفضل جمشیدیان</h3>
                    <span id="aboutLogin" style="color:var(--text-secondary); font-size:13px;">@abalfazljam</span>
                    <p id="aboutBio" style="color:var(--text-secondary); font-size:13px; max-width:400px;" data-i18n="dev_bio">توسعه‌دهنده رابط گرافیکی پیشرفته چت API - علاقه‌مند به هوش مصنوعی و متن‌باز</p>
                </div>
                <div style="margin-top:20px; display:flex; flex-direction:column; gap:8px;">
                    <a href="https://github.com/abalfazljam/GUI-advanced-chat-API" target="_blank" class="btn-secondary" style="text-decoration:none; text-align:center; display:block;" data-i18n="project_github">⭐ پروژه در گیت‌هاب - دریافت نسخه‌های جدید</a>
                    <a href="https://github.com/abalfazljam" target="_blank" class="btn-primary" style="text-decoration:none; text-align:center; display:block;" data-i18n="profile_github">👤 پروفایل گیت‌هاب توسعه‌دهنده</a>
                    <div style="margin-top:10px; padding:12px; background:var(--bg-tertiary); border-radius:var(--radius-sm); font-size:12px; color:var(--text-secondary); line-height:1.6;" data-i18n="version_info">
                        نسخه: 2.2 حرفه‌ای<br>لایسنس: MIT<br>ساخته شده با ❤️ برای ایران
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="lightboxModal">
        <div style="position:relative; max-width:90vw; max-height:90vh;">
            <button class="close-btn" id="closeLightboxBtn" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:#fff; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; z-index:10;">&times;</button>
            <img id="lightboxImg" src="" style="max-width:90vw; max-height:90vh; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        </div>
    </div>

    <div class="toast" id="toast"></div>
    <script src="assets/i18n.js"></script>
    <script src="assets/script.js"></script>
</body>
</html>
