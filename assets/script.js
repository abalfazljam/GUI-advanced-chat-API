class ChatApp {
    constructor() {
        this.chats = [];
        this.currentChatId = null;
        this.isGenerating = false;
        this.abortController = null;
        this.config = { 
            api_key: "", 
            profile_name: "کاربر", 
            avatar: "", 
            ai_name: "دستیار هوشمند", 
            ai_avatar: "", 
            providers: [{id:"freellmapi", name:"FreeLLMAPI", base_url:"http://127.0.0.1:31415/v1", api_key:"", models:[]}],
            active_provider: "freellmapi",
            settings: { theme: "dark-blue", temp: 0.7, anim_type:"typewriter", anim_speed:25, smart_scroll:true, prompts:[] } 
        };
        this.typewriterQueue = [];
        this.typewriterInterval = null;
        this.fullStreamContent = "";
        this.displayedContent = "";
        this.availableModels = [];
        this.selectedModel = "auto";
        this.attachedFiles = []; // {type, content, name, url}
        this.userScrolledUp = false;
        this.isNearBottom = true;

        this.configureMarked();
        this.cacheElements();
        this.init();
    }

    configureMarked() {
        const renderer = {
            code(code, infostring) {
                let text = code;
                let lang = infostring;
                if (code && typeof code === 'object') {
                    text = code.text;
                    lang = code.lang;
                }
                lang = (lang || 'plaintext').trim();
                let highlighted;
                try { 
                    highlighted = hljs.highlight(text, { language: hljs.getLanguage(lang) ? lang : 'plaintext' }).value; 
                } catch (e) { 
                    highlighted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
                }
                return `<div class="code-block-wrapper">
                            <div class="code-block-header">
                                <span class="code-block-lang">${lang}</span>
                                <button class="copy-code-btn" data-action="copy-code">📋 کپی</button>
                            </div>
                            <pre><code class="hljs">${highlighted}</code></pre>
                        </div>`;
            },
            image(href, title, text) {
                // Support audio/video via image syntax hack? We'll detect extension
                const lower = (href||'').toLowerCase();
                if (lower.match(/\.(mp3|wav|ogg|m4a|flac|aac|opus)(\?|$)/)) {
                    return `<div class="message-media"><audio controls src="${href}" preload="none"></audio></div>`;
                }
                if (lower.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/)) {
                    return `<div class="message-media"><video controls src="${href}" preload="metadata"></video></div>`;
                }
                // Normal image with lightbox support
                return `<div class="message-media"><img src="${href}" alt="${text}" title="${title||text}" class="message-image" loading="lazy" data-lightbox="${href}"></div>`;
            }
        };
        marked.use({ renderer });
        marked.setOptions({ breaks: true, gfm: true });
        if (window.markedKatex) marked.use(markedKatex({ throwOnError: false }));
    }

    cacheElements() {
        this.el = {
            messages: document.getElementById('messages'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            stopBtn: document.getElementById('stopBtn'),
            newChatBtn: document.getElementById('newChatBtn'),
            chatList: document.getElementById('chatList'),
            chatSearchInput: document.getElementById('chatSearchInput'),
            chatSearchClear: document.getElementById('chatSearchClear'),
            menuToggle: document.getElementById('menuToggle'),
            collapseSidebarBtn: document.getElementById('collapseSidebarBtn'),
            expandSidebarBtn: document.getElementById('expandSidebarBtn'),
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            suggestionsContainer: document.getElementById('suggestionsContainer'),
            messagesContainer: document.getElementById('messagesContainer'),
            toast: document.getElementById('toast'),
            modelBadge: document.getElementById('modelBadge'),
            modelSelectContainer: document.getElementById('modelSelectContainer'),
            modelSelectTrigger: document.getElementById('modelSelectTrigger'),
            modelSelectText: document.getElementById('modelSelectText'),
            modelSelectDropdown: document.getElementById('modelSelectDropdown'),
            modelSearchInput: document.getElementById('modelSearchInput'),
            modelSelectOptions: document.getElementById('modelSelectOptions'),
            providerSelectContainer: document.getElementById('providerSelectContainer'),
            providerSelectTrigger: document.getElementById('providerSelectTrigger'),
            providerSelectText: document.getElementById('providerSelectText'),
            providerSelectDropdown: document.getElementById('providerSelectDropdown'),
            providerSelectOptions: document.getElementById('providerSelectOptions'),
            chatStatsBar: document.getElementById('chatStatsBar'),
            profileAvatarBtn: document.getElementById('profileAvatarBtn'),
            avatarInput: document.getElementById('avatarInput'),
            profileAvatarImg: document.getElementById('profileAvatarImg'),
            profileNameInput: document.getElementById('profileNameInput'),
            openSettingsBtn: document.getElementById('openSettingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            settingsProfileNameInput: document.getElementById('settingsProfileNameInput'),
            settingsUserAvatarBtn: document.getElementById('settingsUserAvatarBtn'),
            settingsUserAvatarInput: document.getElementById('settingsUserAvatarInput'),
            aiNameInput: document.getElementById('aiNameInput'),
            aiAvatarBtn: document.getElementById('aiAvatarBtn'),
            aiAvatarInput: document.getElementById('aiAvatarInput'),
            deleteAiAvatarBtn: document.getElementById('deleteAiAvatarBtn'),
            deleteUserAvatarBtn: document.getElementById('deleteUserAvatarBtn'),
            tempSlider: document.getElementById('tempSlider'),
            tempValue: document.getElementById('tempValue'),
            animTypeSelect: document.getElementById('animTypeSelect'),
            animSpeedSlider: document.getElementById('animSpeedSlider'),
            animSpeedValue: document.getElementById('animSpeedValue'),
            smartScrollToggle: document.getElementById('smartScrollToggle'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            providersList: document.getElementById('providersList'),
            addProviderBtn: document.getElementById('addProviderBtn'),
            fetchAllModelsBtn: document.getElementById('fetchAllModelsBtn'),
            promptsEditor: document.getElementById('promptsEditor'),
            exportChatsBtn: document.getElementById('exportChatsBtn'),
            importChatsBtn: document.getElementById('importChatsBtn'),
            importFileInput: document.getElementById('importFileInput'),
            webSearchBtn: document.getElementById('webSearchBtn'),
            attachFileBtn: document.getElementById('attachFileBtn'),
            fileInput: document.getElementById('fileInput'),
            imagePreviewContainer: document.getElementById('imagePreviewContainer'),
            smartScrollBtn: document.getElementById('smartScrollBtn'),
            currentChatTitle: document.getElementById('currentChatTitle'),
            msgNavToggle: document.getElementById('msgNavToggle'),
            msgNavPanel: document.getElementById('msgNavPanel'),
            msgNavClose: document.getElementById('msgNavClose'),
            msgNavList: document.getElementById('msgNavList'),
            openTrashBtn: document.getElementById('openTrashBtn'),
            trashModal: document.getElementById('trashModal'),
            closeTrashBtn: document.getElementById('closeTrashBtn'),
            emptyTrashBtn: document.getElementById('emptyTrashBtn'),
            trashList: document.getElementById('trashList'),
            openAboutBtn: document.getElementById('openAboutBtn'),
            aboutModal: document.getElementById('aboutModal'),
            closeAboutBtn: document.getElementById('closeAboutBtn'),
            lightboxModal: document.getElementById('lightboxModal'),
            lightboxImg: document.getElementById('lightboxImg'),
            closeLightboxBtn: document.getElementById('closeLightboxBtn'),
        };
    }

    async init() {
        this.bindEvents();
        await this.loadConfig();
        this.applyTheme(this.config.settings.theme);
        this.updateProfileUI();
        this.renderProvidersSelect();
        this.renderProvidersList();
        this.renderPromptsEditor();
        this.renderThemeGrid();
        this.renderSuggestions();
        await this.loadChats();
        // fetch models for active provider
        if (this.getActiveProvider()?.api_key || this.config.api_key) await this.fetchModels();
        this.renderChatList();
        if (this.chats.length > 0) this.openChat(this.chats[0].id);
        this.el.messageInput.focus();
        this.setupSmartScroll();
        this.loadGithubProfile();
        // count lines async
        this.updateAboutLines();
    }

    bindEvents() {
        this.el.messages.addEventListener('click', (e) => {
            const btn = e.target.closest('.msg-action-btn, .copy-code-btn');
            if (!btn) {
                const img = e.target.closest('img[data-lightbox]');
                if (img) this.openLightbox(img.dataset.lightbox || img.src);
                return;
            }
            if (btn.classList.contains('copy-code-btn') || btn.dataset.action === 'copy-code') this.copyCode(btn);
            else if (btn.dataset.action === 'copy') this.copyMessage(btn);
            else if (btn.dataset.action) this.handleMessageAction(btn.dataset.action, btn);
        });
        this.el.sendBtn.addEventListener('click', () => this.sendMessage());
        this.el.messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); } });
        this.el.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        this.el.stopBtn.addEventListener('click', () => this.stopGeneration());
        this.el.newChatBtn.addEventListener('click', () => this.newChat());
        
        this.el.chatSearchInput.addEventListener('input', (e) => this.searchChats(e.target.value));
        this.el.chatSearchClear.addEventListener('click', () => {
            this.el.chatSearchInput.value = '';
            this.el.chatSearchClear.style.display = 'none';
            this.renderChatList();
        });
        
        this.el.menuToggle.addEventListener('click', () => this.el.sidebar.classList.toggle('open'));
        this.el.sidebarOverlay.addEventListener('click', () => this.el.sidebar.classList.remove('open'));
        this.el.collapseSidebarBtn.addEventListener('click', () => this.el.sidebar.classList.toggle('collapsed'));
        this.el.expandSidebarBtn.addEventListener('click', () => this.el.sidebar.classList.remove('collapsed'));
        
        this.el.profileAvatarBtn.addEventListener('click', () => this.el.avatarInput.click());
        this.el.avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e, 'user'));
        this.el.profileNameInput.addEventListener('change', () => { this.syncProfileNames('sidebar'); this.saveConfig(); });

        // Settings profile (new)
        if (this.el.settingsProfileNameInput) {
            this.el.settingsProfileNameInput.addEventListener('change', () => { this.syncProfileNames('settings'); this.saveConfig(); });
            this.el.settingsProfileNameInput.addEventListener('input', () => { this.syncProfileNames('settings', true); });
        }
        if (this.el.settingsUserAvatarBtn) {
            this.el.settingsUserAvatarBtn.addEventListener('click', () => this.el.settingsUserAvatarInput.click());
        }
        if (this.el.settingsUserAvatarInput) {
            this.el.settingsUserAvatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e, 'user'));
        }
        
        this.el.openSettingsBtn.addEventListener('click', () => this.el.settingsModal.classList.add('show'));
        this.el.closeSettingsBtn.addEventListener('click', () => this.el.settingsModal.classList.remove('show'));
        this.el.settingsModal.addEventListener('click', (e) => { if(e.target === this.el.settingsModal) this.el.settingsModal.classList.remove('show'); });
        this.el.saveSettingsBtn.addEventListener('click', () => this.saveSettingsExplicitly());
        
        this.el.aiAvatarBtn.addEventListener('click', () => this.el.aiAvatarInput.click());
        this.el.aiAvatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e, 'ai'));
        this.el.aiNameInput.addEventListener('change', () => this.saveConfig());
        this.el.deleteAiAvatarBtn.addEventListener('click', () => this.deleteAvatar('ai'));
        this.el.deleteUserAvatarBtn.addEventListener('click', () => this.deleteAvatar('user'));
        
        this.el.tempSlider.addEventListener('input', (e) => this.el.tempValue.textContent = this.toPersianNum(e.target.value));
        this.el.tempSlider.addEventListener('change', () => this.saveConfig());

        this.el.animTypeSelect.addEventListener('change', () => this.saveConfig());
        this.el.animSpeedSlider.addEventListener('input', (e) => { this.el.animSpeedValue.textContent = e.target.value; });
        this.el.animSpeedSlider.addEventListener('change', () => this.saveConfig());
        this.el.smartScrollToggle.addEventListener('change', () => this.saveConfig());

        this.el.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        this.el.addProviderBtn.addEventListener('click', () => this.addCustomProviderInline());
        this.el.fetchAllModelsBtn.addEventListener('click', () => this.fetchAllProvidersModels());
        this.el.exportChatsBtn.addEventListener('click', () => this.exportChats());
        this.el.importChatsBtn.addEventListener('click', () => this.el.importFileInput.click());
        this.el.importFileInput.addEventListener('change', (e) => this.handleImport(e));
        
        this.el.modelSelectTrigger.addEventListener('click', () => this.el.modelSelectDropdown.classList.toggle('show'));
        this.el.modelSearchInput.addEventListener('input', (e) => this.filterModels(e.target.value));
        this.el.providerSelectTrigger.addEventListener('click', () => this.el.providerSelectDropdown.classList.toggle('show'));

        document.addEventListener('click', (e) => {
            if (!this.el.modelSelectContainer.contains(e.target)) this.el.modelSelectDropdown.classList.remove('show');
            if (!this.el.providerSelectContainer.contains(e.target)) this.el.providerSelectDropdown.classList.remove('show');
        });
        
        this.el.webSearchBtn.addEventListener('click', () => this.el.webSearchBtn.classList.toggle('active'));
        this.el.attachFileBtn.addEventListener('click', () => this.el.fileInput.click());
        this.el.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.el.smartScrollBtn.addEventListener('click', () => this.scrollToBottom(true));
        this.el.msgNavToggle.addEventListener('click', () => this.toggleMsgNav());
        this.el.msgNavClose.addEventListener('click', () => this.el.msgNavPanel.classList.remove('show'));
        
        const langSel = document.getElementById('langSelect');
        if (langSel) {
            langSel.value = window.currentLang || localStorage.getItem('chat_lang') || 'fa';
            langSel.addEventListener('change', (e)=>{
                const nl = e.target.value;
                window.applyI18n(nl);
                // re-render dynamic lists that contain translated strings
                this.renderChatList();
                this.renderProvidersList();
                this.renderProvidersSelect();
                if (this.currentChatId) {
                    const chat = this.getCurrentChat();
                    if (chat) this.updateChatStats(chat);
                }
                // update toast
                this.showToast(nl==='fa'?'زبان فارسی فعال شد':'English activated');
            });
        }

        this.el.openTrashBtn.addEventListener('click', () => { this.el.trashModal.classList.add('show'); this.loadTrash(); });
        this.el.closeTrashBtn.addEventListener('click', () => this.el.trashModal.classList.remove('show'));
        this.el.emptyTrashBtn.addEventListener('click', () => this.emptyTrash());
        this.el.trashModal.addEventListener('click', (e) => { if(e.target === this.el.trashModal) this.el.trashModal.classList.remove('show'); });

        this.el.openAboutBtn.addEventListener('click', () => this.el.aboutModal.classList.add('show'));
        this.el.closeAboutBtn.addEventListener('click', () => this.el.aboutModal.classList.remove('show'));
        this.el.aboutModal.addEventListener('click', (e) => { if(e.target===this.el.aboutModal) this.el.aboutModal.classList.remove('show'); });

        this.el.lightboxModal.addEventListener('click', (e) => {
            if (e.target===this.el.lightboxModal || e.target===this.el.closeLightboxBtn || e.target.closest('#closeLightboxBtn')) this.el.lightboxModal.classList.remove('show');
        });
        this.el.closeLightboxBtn.addEventListener('click', () => this.el.lightboxModal.classList.remove('show'));

        document.addEventListener('click', (e) => {
            if (!this.el.msgNavPanel.contains(e.target) && !this.el.msgNavToggle.contains(e.target)) this.el.msgNavPanel.classList.remove('show');
        });
    }

    syncProfileNames(from, live=false) {
        if (from==='sidebar') {
            const val = this.el.profileNameInput.value;
            if (this.el.settingsProfileNameInput) this.el.settingsProfileNameInput.value = val;
            this.config.profile_name = val;
        } else {
            const val = this.el.settingsProfileNameInput.value;
            this.el.profileNameInput.value = val;
            if (!live) this.config.profile_name = val;
            else this.config.profile_name = val; // live sync too
        }
    }

    setupSmartScroll() {
        const container = this.el.messagesContainer;
        container.addEventListener('scroll', () => {
            const threshold = 120;
            const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
            this.isNearBottom = atBottom;
            this.userScrolledUp = !atBottom;
            if (atBottom) {
                this.el.smartScrollBtn.style.display = 'none';
            } else if (this.isGenerating) {
                this.el.smartScrollBtn.style.display = 'flex';
            }
        });
    }

    /* ==== CONFIG ==== */
    async loadConfig() {
        try {
            const res = await fetch('backend.php?action=get_config');
            let data = await res.json();
            if (!data || data.error) data = this.config;
            this.config = data;
            if (!this.config.providers || this.config.providers.length===0) {
                this.config.providers = [{id:"freellmapi", name:"FreeLLMAPI", base_url:"http://127.0.0.1:31415/v1", api_key: data.api_key || "", models:[]}];
                this.config.active_provider = "freellmapi";
            }
            if (!this.config.settings) this.config.settings = { theme: "dark-blue", temp: 0.7, anim_type:"typewriter", anim_speed:25, smart_scroll:true, prompts:[] };
            if (!this.config.settings.anim_type) this.config.settings.anim_type = this.config.settings.typewriter===false ? "none" : "typewriter";
            if (!this.config.settings.anim_speed) this.config.settings.anim_speed = 25;
            if (this.config.settings.smart_scroll===undefined) this.config.settings.smart_scroll = true;
            if (!this.config.settings.prompts || this.config.settings.prompts.length===0) {
                this.config.settings.prompts = [
                    {icon:"💻", label:"کدنویسی", prompt:"یک برنامه پایتون برای محاسبه فیبوناچی بنویس"},
                    {icon:"✍️", label:"نوشتن متن", prompt:"یک متن خلاقانه درباره فصل بهار بنویس"},
                    {icon:"🧠", label:"توضیح مفهوم", prompt:"مفهوم هوش مصنوعی را به زبان ساده توضیح بده"},
                    {icon:"🌐", label:"ترجمه", prompt:"این متن را به انگلیسی ترجمه کن: "}
                ];
            }
            // UI
            this.el.aiNameInput.value = this.config.ai_name || 'دستیار هوشمند';
            this.el.profileNameInput.value = this.config.profile_name || 'کاربر';
            if (this.el.settingsProfileNameInput) this.el.settingsProfileNameInput.value = this.config.profile_name || 'کاربر';
            this.el.tempSlider.value = this.config.settings.temp || 0.7;
            this.el.tempValue.textContent = this.toPersianNum(this.config.settings.temp);
            this.el.animTypeSelect.value = this.config.settings.anim_type || "typewriter";
            this.el.animSpeedSlider.value = this.config.settings.anim_speed || 25;
            this.el.animSpeedValue.textContent = this.config.settings.anim_speed || 25;
            this.el.smartScrollToggle.checked = this.config.settings.smart_scroll !== false;
        } catch (e) { console.error("Config load error:", e); }
    }

    getActiveProvider() {
        const id = this.config.active_provider || 'freellmapi';
        return this.config.providers.find(p=>p.id===id) || this.config.providers[0];
    }

    async saveConfig() {
        // sync names
        if (this.el.settingsProfileNameInput) this.config.profile_name = this.el.settingsProfileNameInput.value || this.el.profileNameInput.value;
        else this.config.profile_name = this.el.profileNameInput.value;
        this.config.ai_name = this.el.aiNameInput.value;
        this.config.settings.temp = parseFloat(this.el.tempSlider.value);
        this.config.settings.anim_type = this.el.animTypeSelect.value;
        this.config.settings.anim_speed = parseInt(this.el.animSpeedSlider.value);
        this.config.settings.smart_scroll = this.el.smartScrollToggle.checked;
        this.config.settings.prompts = this.collectPromptsFromEditor();
        // keep legacy api_key as active provider's key for api.php fallback
        const active = this.getActiveProvider();
        if (active) this.config.api_key = active.api_key || this.config.api_key || "";
        
        await fetch('backend.php?action=save_config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'api_key=' + encodeURIComponent(this.config.api_key) +
                  '&profile_name=' + encodeURIComponent(this.config.profile_name) +
                  '&avatar=' + encodeURIComponent(this.config.avatar || '') +
                  '&ai_name=' + encodeURIComponent(this.config.ai_name) +
                  '&ai_avatar=' + encodeURIComponent(this.config.ai_avatar || '') +
                  '&active_provider=' + encodeURIComponent(this.config.active_provider) +
                  '&providers=' + encodeURIComponent(JSON.stringify(this.config.providers)) +
                  '&settings=' + encodeURIComponent(JSON.stringify(this.config.settings))
        });
    }

    async saveProviders() {
        await fetch('backend.php?action=save_providers', {
            method: 'POST',
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            body: 'providers=' + encodeURIComponent(JSON.stringify(this.config.providers)) +
                  '&active_provider=' + encodeURIComponent(this.config.active_provider)
        });
        this.renderProvidersSelect();
        // Don't call renderProvidersList here to avoid focus loss during typing, caller decides
        // Also keep api key legacy sync
        const active = this.getActiveProvider();
        if (active) this.config.api_key = active.api_key;
    }

    saveSettingsExplicitly() {
        this.saveConfig();
        this.saveProviders();
        this.renderProvidersList();
        this.showToast(window.t('toast_settings_saved'));
        if (this.config.api_key || this.getActiveProvider()?.api_key) this.fetchModels();
        this.updateProfileUI();
        this.renderSuggestions();
    }

    updateProfileUI() {
        this.el.profileNameInput.value = this.config.profile_name || 'کاربر';
        if (this.el.settingsProfileNameInput) this.el.settingsProfileNameInput.value = this.config.profile_name || 'کاربر';
        let avatarSrc = this.config.avatar;
        if (!avatarSrc) {
            avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.config.profile_name)}&background=2563eb&color=fff`;
        }
        this.el.profileAvatarImg.src = avatarSrc;
        this.el.profileAvatarImg.onerror = () => {
            this.el.profileAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.config.profile_name)}&background=2563eb&color=fff`;
        };
        this.renderSuggestions();
    }

    async handleAvatarUpload(e, type) {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        form.append('action','upload_avatar');
        form.append('type', type);
        try {
            const res = await fetch('backend.php', {method:'POST', body:form});
            const data = await res.json();
            if (data.status==='success') {
                if (type==='user') this.config.avatar = data.path;
                else this.config.ai_avatar = data.path;
                await this.saveConfig();
                this.updateProfileUI();
                this.showToast(window.t('toast_avatar_saved'));
                // re-render messages to show new avatars
                if (this.currentChatId) {
                    const chat = this.getCurrentChat();
                    if (chat) this.renderMessages(chat);
                }
            } else {
                this.showToast(data.error || 'خطا در آپلود');
            }
        } catch(err) {
            this.showToast('خطا در ارتباط');
        }
        e.target.value='';
    }

    async deleteAvatar(type) {
        if (!confirm(type==='user'?'حذف عکس پروفایل خودت؟':'حذف عکس هوش مصنوعی؟')) return;
        try {
            const form = new FormData();
            form.append('action','delete_avatar');
            form.append('type', type);
            const res = await fetch('backend.php', {method:'POST', body:form});
            const data = await res.json();
            if (data.status==='success') {
                if (type==='user') this.config.avatar='';
                else this.config.ai_avatar='';
                await this.saveConfig();
                this.updateProfileUI();
                this.showToast(window.t('toast_avatar_deleted'));
                if (this.currentChatId) {
                    const chat = this.getCurrentChat();
                    if (chat) this.renderMessages(chat);
                }
            }
        } catch(e){ this.showToast('خطا'); }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.config.settings.theme = theme;
    }

    async resetSettings() {
        if (!confirm('آیا از ریست کامل تنظیمات مطمئن هستید؟ کلید API، پرووایدرها، عکس پروفایل و کل تاریخچه گفتگوهای شما برای همیشه حذف خواهند شد.')) return;
        this.config.api_key = '';
        this.config.avatar = '';
        this.config.ai_avatar = '';
        this.config.profile_name = 'کاربر';
        this.config.ai_name = 'دستیار هوشمند';
        this.config.providers = [{id:"freellmapi", name:"FreeLLMAPI", base_url:"http://127.0.0.1:31415/v1", api_key:"", models:[]}];
        this.config.active_provider = "freellmapi";
        this.config.settings = { theme: 'dark-blue', temp: 0.7, anim_type:"typewriter", anim_speed:25, smart_scroll:true, prompts:[
            {icon:"💻", label:"کدنویسی", prompt:"یک برنامه پایتون برای محاسبه فیبوناچی بنویس"},
            {icon:"✍️", label:"نوشتن متن", prompt:"یک متن خلاقانه درباره فصل بهار بنویس"},
            {icon:"🧠", label:"توضیح مفهوم", prompt:"مفهوم هوش مصنوعی را به زبان ساده توضیح بده"},
            {icon:"🌐", label:"ترجمه", prompt:"این متن را به انگلیسی ترجمه کن: "}
        ]};
        
        this.el.aiNameInput.value = 'دستیار هوشمند';
        this.el.tempSlider.value = 0.7;
        this.el.tempValue.textContent = '۰.۷';
        this.el.animTypeSelect.value = 'typewriter';
        this.el.animSpeedSlider.value = 25;
        this.el.animSpeedValue.textContent = '25';
        this.el.smartScrollToggle.checked = true;
        this.el.profileNameInput.value = 'کاربر';
        if (this.el.settingsProfileNameInput) this.el.settingsProfileNameInput.value = 'کاربر';
        
        this.applyTheme('dark-blue');
        await this.saveConfig();
        await this.saveProviders();
        this.updateProfileUI();
        this.renderProvidersList();
        this.renderProvidersSelect();
        this.renderPromptsEditor();
        try {
            await fetch('backend.php?action=clear_all_chats');
            await this.loadChats();
            this.newChat();
        } catch (e) { console.error('Reset chats failed', e); }
        this.renderThemeGrid();
        this.showToast('تنظیمات و تاریخچه گفتگوها به طور کامل ریست شدند');
    }

    async testProviderConnection(providerId) {
        const btn = document.querySelector(`button[data-act="test"][data-id="${providerId}"]`);
        if (btn) { btn.textContent='در حال تست...'; btn.disabled=true; }
        // ensure latest inputs saved first
        this.collectProvidersFromInputs();
        await this.saveProviders();
        try {
            const res = await fetch(`backend.php?action=get_models&provider=${encodeURIComponent(providerId)}`);
            const data = await res.json();
            if (data.data && data.data.length>0) {
                this.showToast(`✅ ${providerId}: اتصال موفق! ${data.data.length} مدل یافت شد.`);
                const prov = this.config.providers.find(p=>p.id===providerId);
                if (prov) prov.models = data.data.map(m=>m.id);
                await this.saveProviders();
                this.renderProvidersList();
                if (providerId===this.config.active_provider) {
                    this.availableModels = data.data.filter(m=>m.id.toLowerCase()!=='auto');
                    this.renderModelSelect();
                }
            } else if (data.error) {
                let msg = data.error;
                if (data.error==='no_api_key') msg='کلید API خالی است';
                this.showToast(`❌ ${providerId}: ${msg} ${data.detail||''}`, true);
            } else {
                this.showToast(`❌ ${providerId}: پاسخی دریافت نشد`, true);
            }
        } catch(e) {
            this.showToast(`❌ خطا در اتصال ${providerId}`, true);
        }
        if (btn) { btn.textContent='تست اتصال'; btn.disabled=false; }
    }

    collectProvidersFromInputs() {
        const list = this.el.providersList;
        if (!list) return;
        list.querySelectorAll('.provider-item').forEach(itemDiv=>{
            const id = itemDiv.querySelector('input[data-field="name"]')?.dataset.id;
            if (!id) return;
            const prov = this.config.providers.find(p=>p.id===id);
            if (!prov) return;
            const nameInp = itemDiv.querySelector('input[data-field="name"]');
            const baseInp = itemDiv.querySelector('input[data-field="base_url"]');
            const keyInp = itemDiv.querySelector('input[data-field="api_key"]');
            const customInp = itemDiv.querySelector('input[data-field="custom_models"]');
            if (nameInp) prov.name = nameInp.value;
            if (baseInp) prov.base_url = baseInp.value.trim();
            if (keyInp) prov.api_key = keyInp.value.trim();
            if (customInp) {
                const raw = customInp.value||'';
                prov.custom_models = raw.split(',').map(s=>s.trim()).filter(s=>s.length>0);
            }
        });
    }

    /* ==== CHATS ==== */
    async loadChats() {
        try {
            const res = await fetch('backend.php?action=list_chats');
            this.chats = await res.json();
        } catch (e) { console.error('Load chats failed', e); }
    }

    async openChat(id) {
        try {
            const res = await fetch(`backend.php?action=get_chat&id=${id}`);
            const chat = await res.json();
            if (chat.error) { this.showToast(chat.error, true); return; }
            this.currentChatId = id;
            this.renderMessages(chat);
            this.renderChatList();
            this.el.currentChatTitle.textContent = chat.title;
            this.el.sidebar.classList.remove('open');
            this.updateChatStats(chat);
        } catch (e) { console.error('Open chat failed', e); }
    }

    async saveChat(chat) {
        let localChat = this.chats.find(c => c.id === chat.id);
        if (localChat) Object.assign(localChat, chat);
        else this.chats.unshift(chat);
        this.renderChatList();
        
        await fetch('backend.php?action=save_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + chat.id + '&data=' + encodeURIComponent(JSON.stringify(chat))
        });
    }

    async deleteChat(id, e) {
        if (e) e.stopPropagation();
        if (!confirm('آیا از حذف این گفتگو مطمئن هستید؟ (امکان بازیابی وجود دارد)')) return;

        await fetch('backend.php?action=delete_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + id
        });
        if (this.currentChatId === id) this.newChat();
        await this.loadChats();
        this.renderChatList();
        this.showToastWithUndo('گفتگو حذف شد', id);
    }

    async undoDelete(id) {
        await fetch('backend.php?action=restore_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + id
        });
        await this.loadChats();
        this.renderChatList();
        this.openChat(id);
        this.showToast('گفتگو با موفقیت بازیابی شد');
    }

    newChat() {
        this.currentChatId = null;
        this.el.welcomeScreen.style.display = 'flex';
        this.el.messages.innerHTML = '';
        this.el.messages.appendChild(this.el.welcomeScreen);
        this.el.currentChatTitle.textContent = 'چت جدید';
        this.renderChatList();
        this.el.chatStatsBar.textContent = 'توکن مصرفی این چت: 0';
        this.el.messageInput.focus();
        this.el.msgNavToggle.classList.remove('has-chat');
        this.el.msgNavPanel.classList.remove('show');
        this.renderSuggestions();
    }

    createChat(firstMessage) {
        const chat = {
            id: 'chat_' + Date.now(),
            title: firstMessage.substring(0, 30) || 'چت جدید',
            messages: [],
            tokens: 0
        };
        this.currentChatId = chat.id;
        return chat;
    }

    getCurrentChat() {
        return this.chats.find(c => c.id === this.currentChatId);
    }

    async searchChats(query) {
        this.el.chatSearchClear.style.display = query ? 'block' : 'none';
        if (!query.trim()) {
            this.renderChatList();
            return;
        }
        try {
            const res = await fetch(`backend.php?action=search_chats&q=${encodeURIComponent(query)}`);
            const results = await res.json();
            this.renderChatList(results);
        } catch (e) {
            console.error('Search error:', e);
        }
    }

    renderChatList(chats = null) {
        const list = chats || this.chats;
        this.el.chatList.innerHTML = '';
        if (list.length === 0) {
            this.el.chatList.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">${window.t('no_chat')}</div>`;
            return;
        }
        list.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-item' + (chat.id === this.currentChatId ? ' active' : '');
            item.innerHTML = `<span class="chat-item-title">${this.escapeHtml(chat.title)}</span><button class="chat-item-delete" onclick="window.chatApp.deleteChat('${chat.id}', event)">&times;</button>`;
            item.addEventListener('click', () => this.openChat(chat.id));
            this.el.chatList.appendChild(item);
        });
    }

    renderMessages(chat) {
        this.el.welcomeScreen.style.display = 'none';
        this.el.messages.innerHTML = '';
        chat.messages.forEach(msg => this.appendMessage(msg.role, msg.content, false, msg.tokens, msg.images, msg.files));
        this.scrollToBottom(true);
        this.el.msgNavToggle.classList.toggle('has-chat', chat.messages.some(m => m.role === 'user'));
    }

    appendMessage(role, content, animate = true, tokens = 0, images = [], files = []) {
        this.el.welcomeScreen.style.display = 'none';
        const msgEl = document.createElement('div');
        msgEl.className = `message ${role} anim-${this.config.settings.anim_type||'typewriter'}`;
        
        let avatarHTML = '';
        const userAvatar = this.config.avatar;
        const aiAvatar = this.config.ai_avatar;
        if (role === 'user') {
            if (userAvatar) {
                const src = userAvatar.startsWith('data:') || userAvatar.startsWith('http') ? userAvatar : userAvatar;
                avatarHTML = `<img src="${src}" onerror="this.style.display='none'">`;
            } else {
                avatarHTML = this.escapeHtml((this.config.profile_name||'ش')[0]||'ش');
            }
        } else {
            if (aiAvatar) {
                const src = aiAvatar.startsWith('data:') || aiAvatar.startsWith('http') ? aiAvatar : aiAvatar;
                avatarHTML = `<img src="${src}" onerror="this.style.display='none'">`;
            } else {
                avatarHTML = 'AI';
            }
        }
        
        let mediaHTML = '';
        if (images && images.length > 0) {
            mediaHTML += images.map(img => {
                const lower = (img||'').toLowerCase();
                if (lower.includes('data:audio') || lower.match(/\.mp3|\.wav|\.ogg|\.m4a/)) {
                    return `<div class="message-media"><audio controls src="${img}"></audio></div>`;
                }
                if (lower.includes('data:video') || lower.match(/\.mp4|\.webm|\.mov/)) {
                    return `<div class="message-media"><video controls src="${img}"></video></div>`;
                }
                return `<div class="message-media"><img src="${img}" class="message-image" alt="عکس ضمیمه" data-lightbox="${img}"></div>`;
            }).join('');
        }
        if (files && files.length>0) {
            mediaHTML += files.map(f => {
                if (f.type==='audio') return `<div class="message-media"><audio controls src="${f.url||f.content}"></audio><div style="font-size:11px;color:var(--text-tertiary)">${this.escapeHtml(f.name)}</div></div>`;
                if (f.type==='video') return `<div class="message-media"><video controls src="${f.url||f.content}"></video><div style="font-size:11px;color:var(--text-tertiary)">${this.escapeHtml(f.name)}</div></div>`;
                if (f.type==='file') return `<div class="message-media" style="padding:10px;"><a href="${f.url}" target="_blank">📎 ${this.escapeHtml(f.name)}</a></div>`;
                return '';
            }).join('');
        }
        
        const roleName = role === 'user' ? this.config.profile_name : (this.config.ai_name || 'دستیار هوشمند');
        
        msgEl.innerHTML = 
            `<div class="message-avatar">${avatarHTML}</div>`+
            `<div class="message-content">`+
                `<div class="message-role">${this.escapeHtml(roleName)}</div>`+
                `<div class="message-text">${mediaHTML}</div>`+
                `<div class="message-actions">`+
                    `${role === 'assistant' ?` <button class="msg-action-btn" data-action="regenerate"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>ریجنریت</button>`: ''}`+
                    `<button class="msg-action-btn" data-action="reply"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>ریپلای</button>`+
                    `<button class="msg-action-btn" data-action="copy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>کپی</button>`+
                    `<span class="msg-token-count">${tokens ? ((window.currentLang==='en' ? tokens + ' tokens' : this.toPersianNum(tokens) + ' توکن')) : ''}</span>`+
                `</div>`+
            `</div>`
        ;
        
        const textEl = msgEl.querySelector('.message-text');
        if (role === 'user') {
            textEl.innerHTML += this.escapeHtml(content).replace(/\n/g, '<br>');
        } else {
            this.renderMarkdown(textEl, content, animate);
        }
        
        if (!animate) msgEl.style.animation = 'none';
        this.el.messages.appendChild(msgEl);
        // Attach lightbox events for images already in mediaHTML - they have data-lightbox
        return msgEl;
    }

    renderMarkdown(el, content, animate=false) {
        try {
            // Enhance content: detect standalone image/audio/video URLs and convert to markdown
            let enhanced = content;
            // If content contains raw urls for media, markdown will already handle? Let's convert bare urls ending with media extensions to markdown
            enhanced = enhanced.replace(/(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif|bmp))/gi, '![]($1)');
            enhanced = enhanced.replace(/(https?:\/\/[^\s\)]+\.(?:mp3|wav|ogg|m4a|flac))/gi, '![audio]($1)');
            enhanced = enhanced.replace(/(https?:\/\/[^\s\)]+\.(?:mp4|webm|mov))/gi, '![video]($1)');

            // If content is data url image
            enhanced = enhanced.replace(/(data:image\/[a-z]+;base64,[^\s]+)/gi, '![]($1)');

            const html = marked.parse(enhanced);
            el.innerHTML += html;
            el.querySelectorAll('pre code').forEach(block => { try { hljs.highlightElement(block); } catch (e) {} });

            // Apply fade animation if needed
            if (animate && (this.config.settings.anim_type==='fade')) {
                const blocks = el.querySelectorAll('p, h1, h2, h3, ul, ol, blockquote, .code-block-wrapper, .message-media');
                blocks.forEach((b,i)=>{
                    b.classList.add('fade-block');
                    b.style.animationDelay = (i*0.08)+'s';
                });
            }
        } catch (e) { el.innerHTML += this.escapeHtml(content); }
    }

    handleMessageAction(action, btn) {
        if (action === 'copy') this.copyMessage(btn);
        else if (action === 'reply') this.reply(btn);
        else if (action === 'regenerate') this.regenerate(btn);
    }

    /* ==== SUGGESTIONS ==== */
    renderSuggestions() {
        const container = this.el.suggestionsContainer;
        if (!container) return;
        container.innerHTML='';
        const prompts = this.config.settings.prompts || [];
        prompts.forEach(pr => {
            if (!pr.prompt) return;
            const card = document.createElement('div');
            card.className='suggestion-card';
            card.dataset.prompt = pr.prompt;
            card.innerHTML = `<div class="suggestion-icon">${this.escapeHtml(pr.icon||'✨')}</div><div class="suggestion-text">${this.escapeHtml(pr.label||'سفارشی')}</div>`;
            card.addEventListener('click', () => {
                this.el.messageInput.value = card.dataset.prompt;
                this.autoResizeTextarea();
                this.sendMessage();
            });
            container.appendChild(card);
        });
        if (prompts.filter(p=>p.prompt).length===0) {
            container.innerHTML = '<div style="color:var(--text-tertiary); font-size:13px;">دستور پیش‌فرضی تنظیم نشده - از تنظیمات اضافه کنید</div>';
        }
    }

    renderPromptsEditor() {
        const wrap = this.el.promptsEditor;
        if (!wrap) return;
        wrap.innerHTML='';
        const prompts = this.config.settings.prompts || [];
        while (prompts.length<4) prompts.push({icon:"✨", label:"سفارشی "+(prompts.length+1), prompt:""});
        prompts.slice(0,4).forEach((pr, idx)=>{
            const div = document.createElement('div');
            div.className='prompt-editor-item';
            div.innerHTML = `
                <input type="text" class="prompt-icon" value="${this.escapeHtml(pr.icon||'✨')}" placeholder="😀" maxlength="2" data-idx="${idx}" data-field="icon" style="width:50px;">
                <input type="text" class="prompt-label" value="${this.escapeHtml(pr.label||'')}" placeholder="عنوان" data-idx="${idx}" data-field="label">
                <input type="text" class="prompt-text" value="${this.escapeHtml(pr.prompt||'')}" placeholder="متن پرامپت" data-idx="${idx}" data-field="prompt">
            `;
            wrap.appendChild(div);
        });
        wrap.querySelectorAll('input').forEach(inp=>{
            inp.addEventListener('change', ()=>{
                this.saveConfig();
                this.renderSuggestions();
            });
            inp.addEventListener('input', ()=>{
                // live? debounce save
            });
        });
    }

    collectPromptsFromEditor() {
        const wrap = this.el.promptsEditor;
        if (!wrap) return this.config.settings.prompts;
        const result=[];
        const items = wrap.querySelectorAll('.prompt-editor-item');
        items.forEach(item=>{
            const icon = item.querySelector('[data-field="icon"]')?.value || '✨';
            const label = item.querySelector('[data-field="label"]')?.value || 'سفارشی';
            const prompt = item.querySelector('[data-field="prompt"]')?.value || '';
            result.push({icon, label, prompt});
        });
        // ensure 4
        while (result.length<4) result.push({icon:"✨", label:"سفارشی", prompt:""});
        return result.slice(0,4);
    }

    /* ==== PROVIDERS ==== */
    renderProvidersSelect() {
        const container = this.el.providerSelectOptions;
        const textSpan = this.el.providerSelectText;
        if (!container) return;
        container.innerHTML='';
        this.config.providers.forEach(p=>{
            const opt = document.createElement('div');
            opt.className = 'select-option' + (p.id===this.config.active_provider ? ' active':'');
            opt.textContent = `${p.name} (${p.id})`;
            opt.dataset.value = p.id;
            opt.addEventListener('click',async ()=>{
                this.collectProvidersFromInputs();
                this.config.active_provider = p.id;
                textSpan.textContent = p.name;
                this.el.providerSelectDropdown.classList.remove('show');
                await this.saveProviders();
                this.renderProvidersList();
                this.fetchModels();
                this.el.modelBadge.textContent = '...';
                this.showToast(`پرووایدر ${p.name} فعال شد`);
            });
            container.appendChild(opt);
        });
        const active = this.getActiveProvider();
        if (active) textSpan.textContent = active.name;
    }

    renderProvidersList() {
        const list = this.el.providersList;
        if (!list) return;
        list.innerHTML='';
        this.config.providers.forEach((p)=>{
            const div = document.createElement('div');
            div.className='provider-item';
            div.dataset.pid = p.id;
            const customModelsStr = (p.custom_models||[]).join(', ') || (p.models||[]).slice(0,3).join(', ');
            div.innerHTML = `
                <div class="provider-item-header">
                    <strong style="font-size:13px;">${this.escapeHtml(p.name||'(' + window.t('custom') + ')')} <small style="color:var(--text-tertiary);">(${p.id})</small> ${p.id===this.config.active_provider?' <span style="background:var(--success);color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;">'+window.t('active')+'</span>':''}</strong>
                    <div class="provider-actions">
                        <button class="btn-secondary" data-act="select" data-id="${p.id}" style="font-size:11px; padding:4px 8px;">${window.t('activate')}</button>
                        <button class="btn-danger" data-act="delete" data-id="${p.id}" style="font-size:11px; padding:4px 8px;">${window.t('delete')}</button>
                    </div>
                </div>
                <input type="text" placeholder="${window.t('provider_name_placeholder')}" value="${this.escapeHtml(p.name)}" data-field="name" data-id="${p.id}">
                <input type="text" placeholder="${window.t('base_url_placeholder')}" value="${this.escapeHtml(p.base_url)}" data-field="base_url" data-id="${p.id}" dir="ltr">
                <div style="display:flex; gap:6px;">
                    <input type="password" class="prov-key-input" placeholder="${window.t('api_key_placeholder')}" value="${this.escapeHtml(p.api_key)}" data-field="api_key" data-id="${p.id}" style="flex:1;" dir="ltr">
                    <button class="btn-secondary" data-act="toggle-key" data-id="${p.id}" style="padding:6px 10px;" title="👁️">👁️</button>
                    <button class="btn-secondary" data-act="test" data-id="${p.id}" style="padding:6px 12px; background:var(--accent); color:#fff;" title="${window.t('test_connection')}">${window.t('test_connection')}</button>
                </div>
                <input type="text" placeholder="Custom models - e.g. gpt-4o, claude-3, dahl-llama (comma separated) - for APIs like Dahl without /models" value="${this.escapeHtml((p.custom_models||[]).join(', '))}" data-field="custom_models" data-id="${p.id}" dir="ltr" style="font-size:12px;">
                <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">${window.t('models_label')}${(p.models||[]).slice(0,6).join(', ')}${(p.models||[]).length>6?' ...':''} (${(p.models||[]).length}) ${p.id==='freellmapi'?window.t('provider_hint_freellmapi'):''} ${p.base_url.includes('dahl.global')?' • Dahl: https://inference.dahl.global/v1':''}</div>
            `;
            list.appendChild(div);
        });
        // bind - use input event for name/base live, change for save
        list.querySelectorAll('input').forEach(inp=>{
            inp.addEventListener('input', (e)=>{
                const id = e.target.dataset.id;
                const field = e.target.dataset.field;
                const prov = this.config.providers.find(x=>x.id===id);
                if (!prov) return;
                if (field==='custom_models') {
                    prov[field] = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                } else {
                    prov[field] = e.target.value;
                }
                // don't save on every keystroke to avoid losing focus, but update header text
                if (field==='name') {
                    const strong = e.target.closest('.provider-item').querySelector('strong');
                    if (strong) {
                        strong.childNodes[0].textContent = e.target.value + ' ';
                    }
                }
            });
            inp.addEventListener('change', async (e)=>{
                // on blur/change, persist
                await this.saveProviders();
                this.renderProvidersSelect();
            });
        });
        list.querySelectorAll('button').forEach(btn=>{
            btn.addEventListener('click', async (e)=>{
                const act = e.currentTarget.dataset.act;
                const id = e.currentTarget.dataset.id;
                if (act==='delete') {
                    if (this.config.providers.length<=1) { this.showToast(window.t('toast_min_provider'), true); return; }
                    if (!confirm('حذف این پروایدر؟')) return;
                    this.config.providers = this.config.providers.filter(p=>p.id!==id);
                    if (this.config.active_provider===id) this.config.active_provider = this.config.providers[0].id;
                    await this.saveProviders();
                    this.renderProvidersSelect();
                    this.renderProvidersList();
                    this.fetchModels();
                } else if (act==='select') {
                    this.collectProvidersFromInputs();
                    this.config.active_provider = id;
                    await this.saveProviders();
                    this.renderProvidersSelect();
                    this.renderProvidersList();
                    this.fetchModels();
                    this.showToast(window.t('toast_provider_activated', {name: this.getActiveProvider()?.name||id}));
                } else if (act==='toggle-key') {
                    const input = list.querySelector(`input[data-field="api_key"][data-id="${id}"]`);
                    if (input) {
                        input.type = input.type==='password'?'text':'password';
                        e.currentTarget.textContent = input.type==='password'?'👁️':'🙈';
                    }
                } else if (act==='test') {
                    await this.testProviderConnection(id);
                }
            });
        });
    }

    addCustomProviderInline() {
        const id = 'custom_' + Date.now().toString(36);
        this.config.providers.push({
            id: id,
            name: "",
            base_url: "",
            api_key: "",
            models:[]
        });
        this.renderProvidersList();
        // focus first input of new provider
        setTimeout(()=>{
            const list = this.el.providersList;
            const newItem = list.querySelector(`.provider-item[data-pid="${id}"]`);
            if (newItem) {
                const nameInp = newItem.querySelector('input[data-field="name"]');
                if (nameInp) { nameInp.focus(); nameInp.placeholder='مثلاً: OpenAI'; }
                newItem.scrollIntoView({behavior:'smooth', block:'center'});
                newItem.style.outline='2px solid var(--accent)';
                setTimeout(()=> newItem.style.outline='', 2000);
            }
        }, 100);
        this.showToast('باکس خالی اضافه شد - اطلاعات را پر کن و Enter بزن (ذخیره خودکار)');
        // don't save immediately, let user fill
    }

    // kept for backward compatibility, now calls inline
    addCustomProvider() { this.addCustomProviderInline(); }

    async fetchModelsForProvider(providerId) {
        // Alias to testProviderConnection for backward compat
        return this.testProviderConnection(providerId);
    }

    async fetchAllProvidersModels() {
        this.showToast('در حال دریافت همه مدل‌ها...');
        try {
            this.collectProvidersFromInputs();
            await this.saveProviders();
            const res = await fetch('backend.php?action=get_all_providers_models');
            const data = await res.json();
            let total=0;
            for (const pid in data) {
                const prov = this.config.providers.find(p=>p.id===pid);
                if (prov) prov.models = data[pid]||[];
                total += (data[pid]||[]).length;
            }
            await this.saveProviders();
            this.renderProvidersList();
            this.showToast(`${total} مدل در مجموع دریافت شد`);
            await this.fetchModels();
        } catch(e){ this.showToast('خطا در دریافت مدل‌ها', true); }
    }

    /* ==== SENDING MESSAGES - OPTIMIZED TYPEWRITER ==== */
    async sendMessage(isRegenerate = false) {
        let input = this.el.messageInput.value.trim();
        
        if (this.isGenerating) return;
        const activeProv = this.getActiveProvider();
        if (!activeProv?.api_key && !this.config.api_key) {
            this.showToast('لطفا ابتدا کلید API را در تنظیمات وارد کنید', true);
            this.el.settingsModal.classList.add('show');
            return;
        }
        let chat = this.getCurrentChat();
        
        if (!isRegenerate) {
            if (!input && this.attachedFiles.length===0) return;
            if (!chat) chat = this.createChat(input || "چت جدید");
            const userMsg = { 
                role: 'user', 
                content: input, 
                tokens: 0,
                images: this.attachedFiles.filter(f=>f.type==='image').map(f=>f.content),
                files: this.attachedFiles.filter(f=>f.type!=='image')
            };
            chat.messages.push(userMsg);
            this.el.messageInput.value = '';
            this.autoResizeTextarea();
            this.appendMessage('user', input, true, 0, userMsg.images, userMsg.files);
            this.el.currentChatTitle.textContent = chat.title;
            
            this.attachedFiles = [];
            this.el.imagePreviewContainer.innerHTML = '';
            this.el.imagePreviewContainer.style.display = 'none';
        } else {
            if (!chat) return;
        }
        
        const assistantMsgEl = this.appendMessage('assistant', '', true);
        const textEl = assistantMsgEl.querySelector('.message-text');
        textEl.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        this.scrollToBottom(true);
        
        this.isGenerating = true;
        this.toggleGeneratingUI(true);
        this.fullStreamContent = "";
        this.displayedContent = "";
        this.typewriterQueue = [];
        if (this.typewriterInterval) { clearInterval(this.typewriterInterval); this.typewriterInterval=null; }
        
        try {
            const messagesToSend = chat.messages.map(m => {
                // Combine images/files into content
                if ((m.images && m.images.length>0) || (m.files && m.files.length>0)) {
                    const parts=[];
                    if (m.content) parts.push({type:"text", text:m.content});
                    (m.images||[]).forEach(img=>{
                        parts.push({type:"image_url", image_url:{url: img}});
                    });
                    // files non-image sent as text mention? Or as additional text
                    (m.files||[]).forEach(f=>{
                        if (f.type==='text') {
                            parts[0].text += `\n\n[فایل ${f.name}]:\n${f.content.substring(0,5000)}`;
                        }
                    });
                    if (parts.length===0) parts.push({type:"text", text: m.content || "عکس را بررسی کن"});
                    return { role: m.role, content: parts };
                }
                return { role: m.role, content: m.content };
            });
            
            const res = await this.callAPI(messagesToSend);
            textEl.innerHTML = '';
            const animType = this.config.settings.anim_type || 'typewriter';
            const animSpeed = parseInt(this.config.settings.anim_speed)||25;

            if (animType==='none') {
                // No animation, direct
                await this.streamResponse(res, (chunk) => {
                    this.fullStreamContent += chunk;
                    textEl.innerHTML = marked.parse(this.fullStreamContent);
                    this.conditionalScroll();
                });
                textEl.innerHTML = marked.parse(this.fullStreamContent);
            } else if (animType==='fade' || animType==='smooth') {
                // Buffer and final render with fade
                await this.streamResponse(res, (chunk) => {
                    this.fullStreamContent += chunk;
                    // For performance, only re-parse every 200ms or 100 chars
                    if (this.fullStreamContent.length % 100 < chunk.length) {
                        textEl.innerHTML = marked.parse(this.fullStreamContent) + '<span class="cursor-blink"></span>';
                        this.conditionalScroll();
                    }
                });
                textEl.innerHTML = marked.parse(this.fullStreamContent);
                if (animType==='fade') {
                    const blocks = textEl.querySelectorAll('p, h1, h2, h3, ul, ol, blockquote, .code-block-wrapper, .message-media');
                    blocks.forEach((b,i)=>{
                        b.style.opacity='0';
                        b.style.transform='translateY(8px)';
                        b.style.transition='all 0.4s ease';
                        setTimeout(()=>{ b.style.opacity='1'; b.style.transform='translateY(0)'; }, i*60);
                    });
                }
            } else if (animType==='word') {
                // word by word
                const wordQueue=[];
                await this.streamResponse(res, (chunk) => {
                    this.fullStreamContent += chunk;
                    const words = chunk.split(/(\s+)/);
                    wordQueue.push(...words);
                    if (!this.typewriterInterval) {
                        this.startOptimizedTypewriter(textEl, wordQueue, animSpeed, 'word');
                    }
                });
                // wait for queue drain
                await this.waitForQueue(wordQueue);
                textEl.innerHTML = marked.parse(this.fullStreamContent);
            } else {
                // typewriter char optimized
                const charQueue=[];
                await this.streamResponse(res, (chunk) => {
                    this.fullStreamContent += chunk;
                    // push chars
                    for (let ch of chunk) charQueue.push(ch);
                    if (!this.typewriterInterval) {
                        this.startOptimizedTypewriter(textEl, charQueue, animSpeed, 'char');
                    }
                });
                await this.waitForQueue(charQueue);
                textEl.innerHTML = marked.parse(this.fullStreamContent);
            }

            textEl.querySelectorAll('pre code').forEach(block => { try { hljs.highlightElement(block); } catch (e) {} });
            
            const userTokens = isRegenerate ? 0 : Math.ceil((input || '').length / 4);
            const assistantTokens = Math.ceil(this.fullStreamContent.length / 4);
            
            if (!isRegenerate) {
                chat.messages[chat.messages.length - 1].tokens = userTokens;
            }
            
            chat.messages.push({ role: 'assistant', content: this.fullStreamContent, tokens: assistantTokens });
            chat.tokens = (chat.tokens || 0) + userTokens + assistantTokens;
            
            await this.saveChat(chat);
            this.updateChatStats(chat);
            const langTmp = window.currentLang || 'fa';
            const tokText = langTmp==='en' ? assistantTokens + ' tokens' : this.toPersianNum(assistantTokens) + ' توکن';
            assistantMsgEl.querySelector('.msg-token-count').textContent = tokText;
            
        } catch (error) {
            textEl.innerHTML = `<div style="color:var(--danger)">خطا: ${this.escapeHtml(error.message)}</div>`;
        } finally {
            this.isGenerating = false;
            this.toggleGeneratingUI(false);
            this.scrollToBottom(true);
            this.el.smartScrollBtn.style.display='none';
            if (this.typewriterInterval) { clearInterval(this.typewriterInterval); this.typewriterInterval=null; }
        }
    }

    startOptimizedTypewriter(textEl, queue, speed, mode) {
        // speed is slider 5-100, lower means faster? we interpret as ms delay
        // Let's map: speed 5 => 10ms fast, 100 => 80ms slow
        // Actually anim_speed setting originally was interval ms. We'll treat as ms directly but with multiplier for char
        const baseDelay = Math.max(5, Math.min(100, parseInt(speed)||25));
        const chunkSize = mode==='word' ? 1 : Math.max(1, Math.floor(60 / baseDelay)); // more chars if faster
        const isSmartScrollEnabled = this.config.settings.smart_scroll !== false;

        this.typewriterInterval = setInterval(() => {
            if (queue.length===0) {
                clearInterval(this.typewriterInterval);
                this.typewriterInterval=null;
                return;
            }
            let take = Math.min(chunkSize * (mode==='word'?1:3), queue.length);
            let added='';
            for(let i=0;i<take;i++) added += queue.shift();
            this.displayedContent += added;

            // Optimization: only parse markdown every N chars or when queue large? But to avoid flicker, we parse
            // For long chats, we parse only the new part? To keep simple, we parse full displayedContent but throttle
            // Use requestAnimationFrame for smoother UI
            requestAnimationFrame(()=>{
                try {
                    // For performance, if displayedContent > 5000 chars, we parse incrementally? We'll parse full but with cursor
                    textEl.innerHTML = marked.parse(this.displayedContent) + '<span class="cursor-blink"></span>';
                    textEl.querySelectorAll('pre code').forEach(block => { try { hljs.highlightElement(block); } catch(e){} });
                } catch(e) {
                    textEl.textContent = this.displayedContent + '|';
                }
                if (isSmartScrollEnabled) {
                    this.conditionalScroll();
                } else {
                    // always scroll if smart disabled? Actually if disabled, still auto scroll
                    if (this.isNearBottom) this.scrollToBottom(false);
                }
            });

        }, baseDelay);
    }

    waitForQueue(queue) {
        return new Promise(resolve=>{
            const check = () => {
                if (queue.length===0 && !this.typewriterInterval) resolve();
                else if (queue.length===0 && this.typewriterInterval) {
                    // wait a bit more for final rendering
                    setTimeout(()=>{
                        if (queue.length===0) {
                            if (this.typewriterInterval) { clearInterval(this.typewriterInterval); this.typewriterInterval=null; }
                            resolve();
                        } else check();
                    }, 100);
                } else setTimeout(check, 50);
            };
            check();
        });
    }

    conditionalScroll() {
        // Only auto-scroll if user is near bottom or smart scroll disabled
        if (this.config.settings.smart_scroll===false || this.isNearBottom) {
            this.scrollToBottom(false);
        } else {
            // show button
            this.el.smartScrollBtn.style.display='flex';
        }
    }

    async callAPI(messages) {
        this.abortController = new AbortController();
        const payload = {
            messages: messages,
            model: this.selectedModel || 'auto',
            temperature: parseFloat(this.el.tempSlider.value),
            stream: true,
            web_search: this.el.webSearchBtn.classList.contains('active')
        };
        const res = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: this.abortController.signal
        });
        if (!res.ok) throw new Error(`خطای سرور: ${res.status}`);
        return res;
    }

    async streamResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();
            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const data = line.slice(5).trim();
                if (data === '[DONE]') return;
                try {
                    const json = JSON.parse(data);
                    if (json.error) throw new Error(json.error);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) onChunk(delta);
                } catch (e) { if (!(e instanceof SyntaxError)) throw e; }
            }
        }
    }

    stopGeneration() {
        if (this.abortController) { this.abortController.abort(); this.abortController = null; }
        if (this.typewriterInterval) { clearInterval(this.typewriterInterval); this.typewriterInterval = null; }
        this.isGenerating = false;
        this.toggleGeneratingUI(false);
        this.el.smartScrollBtn.style.display='none';
    }

    toggleGeneratingUI(state) {
        this.el.sendBtn.style.display = state ? 'none' : 'flex';
        this.el.stopBtn.style.display = state ? 'flex' : 'none';
    }

    /* ==== MODELS ==== */
    async fetchModels() {
        try {
            const activeProv = this.getActiveProvider();
            const activeId = this.config.active_provider || 'freellmapi';
            const res = await fetch(`backend.php?action=get_models&provider=${encodeURIComponent(activeId)}`);
            const data = await res.json();
            let apiModels = [];
            if (!data.error) {
                apiModels = data.data || [];
            } else {
                // If /models fails, use custom models or cached models
                if (activeProv && (activeProv.custom_models?.length>0 || activeProv.models?.length>0)) {
                    apiModels = [...(activeProv.models||[]).map(id=>({id})), ...(activeProv.custom_models||[]).map(id=>({id: id.trim()})).filter(m=>m.id)];
                } else if (activeProv && data.error==='no_api_key') {
                    this.availableModels = [];
                    this.renderModelSelect();
                    return;
                }
            }
            const seen = new Set();
            const filtered=[];
            for (let m of apiModels) {
                const low = (m.id||'').toLowerCase();
                if (!low) continue;
                if (seen.has(low)) continue;
                if (low==='auto') continue; // manual auto separately
                seen.add(low);
                filtered.push(m);
            }
            // Merge custom models from active provider
            if (activeProv && activeProv.custom_models) {
                for (let cm of activeProv.custom_models) {
                    const id = (cm||'').trim();
                    if (!id) continue;
                    const low = id.toLowerCase();
                    if (seen.has(low)) continue;
                    seen.add(low);
                    filtered.push({id});
                }
            } else if (activeProv && activeProv.models) {
                // If custom empty but provider has models cached that were not from API (manual), keep them? Already included if apiModels empty case handled
            }
            this.availableModels = filtered;
            this.renderModelSelect();
        } catch (e) { console.error('Model fetch error', e); }
    }

    renderModelSelect() {
        this.el.modelSelectOptions.innerHTML = '';
        const autoOpt = document.createElement('div');
        autoOpt.className = 'select-option active';
        autoOpt.textContent = 'خودکار (Auto)';
        autoOpt.dataset.value = 'auto';
        autoOpt.addEventListener('click', () => this.selectModel('auto', 'خودکار (Auto)'));
        this.el.modelSelectOptions.appendChild(autoOpt);
        
        this.availableModels.forEach(m => {
            const opt = document.createElement('div');
            opt.className = 'select-option';
            opt.textContent = m.id;
            opt.dataset.value = m.id;
            opt.addEventListener('click', () => this.selectModel(m.id, m.id));
            this.el.modelSelectOptions.appendChild(opt);
        });
    }

    filterModels(query) {
        const q = query.toLowerCase();
        this.el.modelSelectOptions.querySelectorAll('.select-option').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(q) ? 'block' : 'none';
        });
    }

    selectModel(value, text) {
        this.selectedModel = value;
        this.el.modelSelectText.textContent = text;
        this.el.modelBadge.textContent = value === 'auto' ? 'Auto' : text.length > 20 ? text.substring(0, 20) + '...' : text;
        document.querySelectorAll('#modelSelectOptions .select-option').forEach(o => o.classList.remove('active'));
        const activeOpt = Array.from(document.querySelectorAll('#modelSelectOptions .select-option')).find(o => o.dataset.value === value);
        if (activeOpt) activeOpt.classList.add('active');
        this.el.modelSelectDropdown.classList.remove('show');
    }

    updateChatStats(chat) {
        const prefix = window.t ? window.t('token_usage_prefix') : 'توکن مصرفی این چت: ';
        const num = this.toPersianNum ? this.toPersianNum(chat.tokens || 0) : (chat.tokens||0);
        // For EN, don't use Persian numbers
        const lang = window.currentLang || 'fa';
        const displayNum = lang==='fa' ? this.toPersianNum(chat.tokens||0) : (chat.tokens||0);
        this.el.chatStatsBar.textContent = prefix + displayNum;
    }

    /* ==== MESSAGE ACTIONS ==== */
    reply(btn) {
        const msg = btn.closest('.message');
        const text = msg.querySelector('.message-text').innerText || msg.querySelector('.message-text').textContent;
        this.el.messageInput.value = `[ریپلای]\n${text.trim().substring(0, 80)}...\n\n`;
        this.el.messageInput.focus();
        this.autoResizeTextarea();
    }

    async regenerate(btn) {
        if (this.isGenerating) return;
        const msg = btn.closest('.message');
        const chat = this.getCurrentChat();
        if (!chat) return;
        
        const messageElements = Array.from(this.el.messages.querySelectorAll('.message'));
        const isLastMessage = messageElements[messageElements.length - 1] === msg;
        
        if (isLastMessage) {
            msg.remove();
            if (chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === 'assistant') {
                chat.messages.pop();
                await this.saveChat(chat);
                this.sendMessage(true);
            } else {
                this.showToast('پیامی برای ریجنریت وجود ندارد', true);
            }
        } else {
            this.showToast('فقط آخرین پیام قابلیت ریجنریت دارد', true);
        }
    }

    /* ==== FILE UPLOAD ==== */
    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'upload_file');
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.status === 'success') {
                if (data.type === 'image') {
                    this.attachedFiles.push({type:'image', content:data.content, name:data.name});
                } else if (data.type === 'audio' || data.type==='video' || data.type==='file') {
                    this.attachedFiles.push({type:data.type, content:data.content, name:data.name, url:data.url||data.content, mime:data.mime});
                } else if (data.type==='text') {
                    this.el.messageInput.value += `\n\n[محتوای فایل ${data.name}]:\n${data.content}\n`;
                    this.autoResizeTextarea();
                    e.target.value='';
                    return;
                }
                this.renderAttachmentPreviews();
            } else {
                this.showToast(data.message || 'خطا در آپلود فایل', true);
            }
        } catch (err) {
            console.error('File upload error:', err);
            this.showToast('خطا در آپلود فایل (خطای ارتباط با سرور)', true);
        }
        e.target.value = '';
    }

    renderAttachmentPreviews() {
        const cont = this.el.imagePreviewContainer;
        cont.innerHTML='';
        if (this.attachedFiles.length===0) { cont.style.display='none'; return; }
        cont.style.display='flex';
        this.attachedFiles.forEach((f, idx)=>{
            const div = document.createElement('div');
            div.className='image-preview';
            if (f.type==='image') {
                div.innerHTML = `<img src="${f.content}"><button class="remove-img" data-idx="${idx}">&times;</button>`;
            } else if (f.type==='audio') {
                div.innerHTML = `<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);font-size:24px;">🎵</div><button class="remove-img" data-idx="${idx}">&times;</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:#fff;font-size:9px;text-align:center;padding:2px;white-space:nowrap;overflow:hidden;">${this.escapeHtml(f.name)}</div>`;
            } else if (f.type==='video') {
                div.innerHTML = `<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);font-size:24px;">🎬</div><button class="remove-img" data-idx="${idx}">&times;</button><div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:#fff;font-size:9px;text-align:center;padding:2px;white-space:nowrap;overflow:hidden;">${this.escapeHtml(f.name)}</div>`;
            } else {
                div.innerHTML = `<div style="width:80px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--bg-tertiary);font-size:24px;">📎</div><button class="remove-img" data-idx="${idx}">&times;</button>`;
            }
            cont.appendChild(div);
        });
        cont.querySelectorAll('.remove-img').forEach(btn=>{
            btn.addEventListener('click', (e)=>{
                const idx = parseInt(e.target.dataset.idx);
                this.attachedFiles.splice(idx,1);
                this.renderAttachmentPreviews();
            });
        });
    }

    /* ==== NAVIGATOR ==== */
    toggleMsgNav() {
        const panel = this.el.msgNavPanel;
        if (panel.classList.contains('show')) {
            panel.classList.remove('show');
        } else {
            this.populateMsgNav();
            panel.classList.add('show');
        }
    }

    populateMsgNav() {
        this.el.msgNavList.innerHTML = '';
        const messages = this.el.messages.querySelectorAll('.message.user');
        if (messages.length === 0) {
            this.el.msgNavList.innerHTML = '<div class="msg-nav-empty">پیامی وجود ندارد</div>';
            return;
        }
        messages.forEach((msgEl, index) => {
            const text = msgEl.querySelector('.message-text').textContent.trim();
            const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
            const item = document.createElement('div');
            item.className = 'msg-nav-item';
            item.textContent = preview || `پیام ${this.toPersianNum(index + 1)}`;
            item.addEventListener('click', () => {
                msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                msgEl.style.transition = 'background 0.3s';
                msgEl.style.background = 'var(--accent-light)';
                setTimeout(() => { msgEl.style.background = ''; }, 1500);
                this.el.msgNavPanel.classList.remove('show');
            });
            this.el.msgNavList.appendChild(item);
        });
    }

    /* ==== TRASH ==== */
    async loadTrash() {
        try {
            const res = await fetch('backend.php?action=list_trash');
            const data = await res.json();
            this.el.trashList.innerHTML = '';
            if (data.length === 0) {
                this.el.trashList.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-tertiary); font-size:13px;">سطل زباله خالی است</div>';
                return;
            }
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'trash-item';
                div.innerHTML = 
                    `<span class="trash-item-title">${this.escapeHtml(item.title)}</span>`+
                    `<div class="trash-actions">`+
                        `<button class="btn-primary" data-restore="${item.id}" style="font-size: 11px; padding: 4px 10px;">بازیابی</button>`+
                        `<button class="btn-danger" data-del="${item.id}" style="font-size: 11px; padding: 4px 10px;">حذف دائم</button>`+
                    `</div>`
                ;
                this.el.trashList.appendChild(div);
            });
            this.el.trashList.querySelectorAll('[data-restore]').forEach(b=>{
                b.addEventListener('click', ()=> this.restoreTrashChat(b.dataset.restore));
            });
            this.el.trashList.querySelectorAll('[data-del]').forEach(b=>{
                b.addEventListener('click', ()=> this.deleteTrashItem(b.dataset.del));
            });
        } catch (e) {
            console.error('Load trash failed', e);
        }
    }

    async restoreTrashChat(id) {
        await fetch('backend.php?action=restore_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + id
        });
        await this.loadChats();
        this.renderChatList();
        this.loadTrash();
        this.showToast('گفتگو با موفقیت بازیابی شد');
    }

    async deleteTrashItem(id) {
        if (!confirm('آیا از حذف دائم این گفتگو مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) return;
        await fetch('backend.php?action=delete_trash_item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'id=' + id
        });
        this.loadTrash();
        this.showToast('گفتگو برای همیشه حذف شد');
    }

    async emptyTrash() {
        if (this.el.trashList.querySelector('.trash-item') === null) {
            this.showToast('سطل زباله در حال حاضر خالی است');
            return;
        }
        if (!confirm('آیا از خالی کردن سطل زباله مطمئن هستید؟ تمام گفتگوها برای همیشه حذف خواهند شد.')) return;
        await fetch('backend.php?action=empty_trash');
        this.loadTrash();
        this.showToast('سطل زباله کاملاً خالی شد');
    }

    /* ==== EXPORT / IMPORT ==== */
    async exportChats() {
        try {
            const res = await fetch('backend.php?action=export_chats');
            const data = await res.json();
            if (data.status==='success') {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], {type:'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href=url;
                a.download = `chat_export_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showToast(`خروجی ${data.count} چت با موفقیت دانلود شد`);
            }
        } catch(e){ this.showToast('خطا در خروجی', true); }
    }

    async handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        form.append('action','import_chats');
        try {
            const res = await fetch('backend.php', {method:'POST', body:form});
            const data = await res.json();
            if (data.status==='success') {
                this.showToast(`${data.imported} چت با موفقیت وارد شد`);
                await this.loadChats();
                this.renderChatList();
            } else {
                this.showToast(data.error||'خطا در وارد کردن', true);
            }
        } catch(err){ this.showToast('خطا', true); }
        e.target.value='';
    }

    /* ==== ABOUT ==== */
    async loadGithubProfile() {
        try {
            const res = await fetch('backend.php?action=get_github_user&user=abalfazljam');
            const data = await res.json();
            const avatar = document.getElementById('aboutAvatar');
            const nameEl = document.getElementById('aboutName');
            const loginEl = document.getElementById('aboutLogin');
            const bioEl = document.getElementById('aboutBio');
            if (data.avatar_url) avatar.src = data.avatar_url;
            if (data.name) nameEl.textContent = data.name;
            else if (data.login) nameEl.textContent = data.login;
            if (data.login) loginEl.textContent = '@'+data.login;
            if (data.bio) bioEl.textContent = data.bio;
            else bioEl.textContent = 'توسعه‌دهنده رابط گرافیکی پیشرفته چت API';
        } catch(e){ console.log('github fetch failed', e); }
    }

    async updateAboutLines() {
        try {
            const el = document.getElementById('aboutLines');
            if (!el) return;
            el.textContent = 'در حال محاسبه...';
            const res = await fetch('backend.php?action=get_stats');
            const data = await res.json();
            if (data.total) {
                el.textContent = this.toPersianNum(data.total) + ' خط (';
                el.textContent += Object.entries(data.files).map(([k,v])=> `${k}: ${this.toPersianNum(v)}`).join(' + ');
                el.textContent += ')';
            } else {
                el.textContent = 'بیش از ۳۵۰۰ خط بهینه شده';
            }
        } catch(e){
            const el = document.getElementById('aboutLines');
            if (el) el.textContent = 'بیش از ۳۵۰۰ خط (حرفه‌ای)';
        }
    }

    openLightbox(src) {
        this.el.lightboxImg.src = src;
        this.el.lightboxModal.classList.add('show');
    }

    /* ==== UTILITIES ==== */
    copyMessage(btn) { 
        const messageEl = btn.closest('.message');
        const textEl = messageEl.querySelector('.message-text');
        const text = textEl.innerText || textEl.textContent;
        
        const original = btn.innerHTML;
        const successStyle = () => {
            btn.innerHTML = 'کپی شد ✓';
            btn.style.background = 'var(--success)';
            setTimeout(() => { 
                btn.innerHTML = original; 
                btn.style.background = ''; 
            }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text.trim())
                .then(successStyle)
                .catch(() => this.fallbackCopy(text.trim(), successStyle));
        } else {
            this.fallbackCopy(text.trim(), successStyle);
        }
    }

    copyCode(btn) { 
        const codeBlock = btn.closest('.code-block-wrapper');
        const code = codeBlock.querySelector('code').innerText;
        
        const originalText = btn.textContent;
        const successStyle = () => {
            btn.textContent = 'کپی شد ✓';
            btn.style.background = 'var(--success)';
            setTimeout(() => { 
                btn.textContent = originalText; 
                btn.style.background = ''; 
            }, 1800);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code)
                .then(successStyle)
                .catch(() => this.fallbackCopy(code, successStyle));
        } else {
            this.fallbackCopy(code, successStyle);
        }
    }

    fallbackCopy(text, callback) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (callback) callback();
            else this.showToast('کپی شد');
        } catch (err) {
            this.showToast('خطا در کپی', true);
        }
        document.body.removeChild(textarea);
    }

    autoResizeTextarea() {
        const ta = this.el.messageInput;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }

    scrollToBottom(force=false) { 
        const c = this.el.messagesContainer;
        if (!force && this.config.settings.smart_scroll!==false && this.userScrolledUp && !this.isNearBottom) {
            // don't force
            return;
        }
        requestAnimationFrame(() => { 
            c.scrollTop = c.scrollHeight; 
            this.isNearBottom = true;
            this.userScrolledUp = false;
            this.el.smartScrollBtn.style.display='none';
        }); 
    }
    
    showToast(msg, isError=false) {
        this.el.toast.textContent = msg;
        this.el.toast.className = 'toast' + (isError ? ' error' : '') + ' show';
        setTimeout(() => this.el.toast.classList.remove('show'), 3000);
    }

    showToastWithUndo(msg, chatId) {
        this.el.toast.innerHTML = `${msg} <button onclick="window.chatApp.undoDelete('${chatId}')" style="background: rgba(255,255,255,0.25); color: #fff; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; margin-right: 10px; font-family: inherit; font-weight: 600;">بازیابی</button>`;
        this.el.toast.className = 'toast show';
        setTimeout(() => this.el.toast.classList.remove('show'), 5000);
    }

    escapeHtml(text) { 
        if (!text) return '';
        const div = document.createElement('div'); 
        div.textContent = text; 
        return div.innerHTML; 
    }

    toPersianNum(num) { 
        return String(num).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]); 
    }

    /* ==== THEMES ==== */
    renderThemeGrid() {
        const grid = document.getElementById('themeGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const darkStatic = [
            { id: "dark-blue", label: "آبی" },
            { id: "dark-yellow", label: "زرد" },
            { id: "dark-green", label: "سبز" },
            { id: "dark-red", label: "قرمز" },
            { id: "dark-purple", label: "بنفش" },
            { id: "dark-orange", label: "نارنجی" },
            { id: "dark-pink", label: "صورتی" },
            { id: "dark-teal", label: "سبزآبی" },
            { id: "dark-cyan", label: "فیروزه‌ای" },
            { id: "dark-indigo", label: "نیلی" },
            { id: "dark-lime", label: "لیمویی" },
            { id: "dark-coral", label: "مرجانی" },
            { id: "dark-magenta", label: "ارغوانی" },
            { id: "dark-gold", label: "طلایی" },
            { id: "dark-emerald", label: "زمردی" },
            { id: "dark-navy", label: "سرمه‌ای" },
            { id: "dark-burgundy", label: "شرابی" },
            { id: "dark-slate", label: "خاکستری" },
            { id: "dark-amber", label: "کهربایی" },
            { id: "dark-rose", label: "رز" },
            { id: "dark-mint", label: "نعنایی" },
            { id: "dark-violet", label: "یاسی" },
            { id: "dark-crimson", label: "زرشکی" },
            { id: "dark-sapphire", label: "یاقوتی" },
            { id: "dark-forest", label: "جنگلی" },
            { id: "dark-lavender", label: "لاوندر تیره" },
            { id: "dark-olive", label: "زیتونی" },
            { id: "dark-plum", label: "آلبالویی" },
            { id: "dark-peach", label: "هلویی تیره" },
            { id: "dark-charcoal", label: "زغالی" },
            { id: "dark-chocolate", label: "شکلاتی" },
            { id: "dark-rust", label: "زنگاری" },
            { id: "dark-mahogany", label: "بلوطی" },
            { id: "dark-bronze", label: "برنزی" },
            { id: "dark-silver", label: "نقره‌ای" },
            { id: "dark-nord", label: "نورد" },
            { id: "dark-dracula", label: "دراکولا" },
            { id: "dark-onehalf", label: "وان‌هلف" },
            { id: "dark-monokai", label: "مونوکای" },
            { id: "dark-midnight", label: "نیمه‌شب" }
        ];

        const lightStatic = [
            { id: "light-blue", label: "آبی" },
            { id: "light-yellow", label: "زرد" },
            { id: "light-green", label: "سبز" },
            { id: "light-red", label: "قرمز" },
            { id: "light-gray", label: "خاکستری" },
            { id: "light-orange", label: "نارنجی" },
            { id: "light-pink", label: "صورتی" },
            { id: "light-teal", label: "سبزآبی" },
            { id: "light-cyan", label: "فیروزه‌ای" },
            { id: "light-indigo", label: "نیلی" },
            { id: "light-lime", label: "لیمویی" },
            { id: "light-coral", label: "مرجانی" },
            { id: "light-magenta", label: "ارغوانی" },
            { id: "light-gold", label: "طلایی" },
            { id: "light-emerald", label: "زمردی" },
            { id: "light-lavender", label: "لاوندر" },
            { id: "light-peach", label: "هلویی" },
            { id: "light-mint", label: "نعنایی" },
            { id: "light-rose", label: "رز" },
            { id: "light-sky", label: "آسمانی" },
            { id: "light-sand", label: "شنی" },
            { id: "light-lilac", label: "یاسمنی" },
            { id: "light-ivory", label: "عاجی" },
            { id: "light-aqua", label: "آبزی" },
            { id: "light-blush", label: "گلبهی" },
            { id: "light-sage", label: "مریم‌گلی" },
            { id: "light-honey", label: "عسلی" },
            { id: "light-cream", label: "کرم" },
            { id: "light-snow", label: "برفی" },
            { id: "light-banana", label: "موزی" },
            { id: "light-apricot", label: "زردآلو" },
            { id: "light-pistachio", label: "پسته‌ای" },
            { id: "light-skyline", label: "خط‌افق" },
            { id: "light-parchment", label: "پوستی" },
            { id: "light-seashell", label: "صدفی" },
            { id: "light-linen", label: "کتان" },
            { id: "light-butter", label: "کره‌ای" },
            { id: "light-lavendercream", label: "یاس و کرم" },
            { id: "light-cotton", label: "پنبه‌ای" }
        ];

        const darkAnimated = [
            { id: "dark-aurora", label: "شفق قطبی" },
            { id: "dark-sunset", label: "غروب" },
            { id: "dark-ocean", label: "اقیانوس" },
            { id: "dark-galaxy", label: "کهکشان" },
            { id: "dark-fire", label: "آتش" },
            { id: "dark-nebula", label: "سحابی" },
            { id: "dark-supernova", label: "ابرنواختر" },
            { id: "dark-cyberpunk", label: "سایبرپانک" },
            { id: "dark-acid", label: "اسیدی" },
            { id: "dark-lava", label: "گدازه" }
        ];

        const lightAnimated = [
            { id: "light-aurora", label: "شفق قطبی" },
            { id: "light-sunset", label: "غروب" },
            { id: "light-ocean", label: "اقیانوس" },
            { id: "light-galaxy", label: "کهکشان" },
            { id: "light-cherry", label: "گیلاسی" },
            { id: "light-rainbow", label: "رنگین‌کمان" },
            { id: "light-bubblegum", label: "آدامسی" },
            { id: "light-spring", label: "بهاری" },
            { id: "light-meadow", label: "چمنزار" },
            { id: "light-breeze", label: "نسیم" }
        ];

        const themeColors = {
            "dark-blue": "linear-gradient(135deg,#1a1a2e,#252540)",
            "dark-yellow": "linear-gradient(135deg,#1a1a1a,#333)",
            "dark-green": "linear-gradient(135deg,#141e1e,#243030)",
            "dark-red": "linear-gradient(135deg,#1e1414,#302424)",
            "dark-purple": "linear-gradient(135deg,#1a1424,#282032)",
            "dark-orange": "linear-gradient(135deg,#1e1a14,#302820)",
            "dark-pink": "linear-gradient(135deg,#1e1418,#302430)",
            "dark-teal": "linear-gradient(135deg,#141e1e,#203030)",
            "dark-cyan": "linear-gradient(135deg,#141a1e,#202830)",
            "dark-indigo": "linear-gradient(135deg,#16142a,#242038)",
            "dark-lime": "linear-gradient(135deg,#181e14,#283020)",
            "dark-coral": "linear-gradient(135deg,#1e1616,#302626)",
            "dark-magenta": "linear-gradient(135deg,#1e141c,#30242e)",
            "dark-gold": "linear-gradient(135deg,#1e1c14,#302e20)",
            "dark-emerald": "linear-gradient(135deg,#121e18,#1e3028)",
            "dark-navy": "linear-gradient(135deg,#101420,#1c2030)",
            "dark-burgundy": "linear-gradient(135deg,#1a1014,#2c1e24)",
            "dark-slate": "linear-gradient(135deg,#1a1c20,#2a2c30)",
            "dark-amber": "linear-gradient(135deg,#1e1c12,#302e1e)",
            "dark-rose": "linear-gradient(135deg,#1e1416,#302426)",
            "dark-mint": "linear-gradient(135deg,#141e1a,#202e28)",
            "dark-violet": "linear-gradient(135deg,#1a1428,#282038)",
            "dark-crimson": "linear-gradient(135deg,#1e1214,#301e22)",
            "dark-sapphire": "linear-gradient(135deg,#101828,#1c2838)",
            "dark-forest": "linear-gradient(135deg,#0a120c,#18281e)",
            "dark-lavender": "linear-gradient(135deg,#140f20,#241d40)",
            "dark-olive": "linear-gradient(135deg,#12120a,#262618)",
            "dark-plum": "linear-gradient(135deg,#160a16,#2e182e)",
            "dark-peach": "linear-gradient(135deg,#1e120d,#3a251f)",
            "dark-charcoal": "linear-gradient(135deg,#121212,#2d2d2d)",
            "dark-chocolate": "linear-gradient(135deg,#140e0a,#2b201a)",
            "dark-rust": "linear-gradient(135deg,#1e0c05,#381c12)",
            "dark-mahogany": "linear-gradient(135deg,#180a0a,#321818)",
            "dark-bronze": "linear-gradient(135deg,#16130a,#2d291e)",
            "dark-silver": "linear-gradient(135deg,#1a1c1e,#30353c)",
            "dark-nord": "linear-gradient(135deg,#2e3440,#434c5e)",
            "dark-dracula": "linear-gradient(135deg,#282a36,#44475a)",
            "dark-onehalf": "linear-gradient(135deg,#21252b,#353b45)",
            "dark-monokai": "linear-gradient(135deg,#272822,#49483e)",
            "dark-midnight": "linear-gradient(135deg,#09090e,#18182d)",
            "dark-aurora": "linear-gradient(135deg,#0a1628,#0d2818,#1a0a2e,#0a2818)",
            "dark-sunset": "linear-gradient(135deg,#1a0a0a,#2e0a18,#1a1a0a,#2e0018)",
            "dark-ocean": "linear-gradient(135deg,#080e1a,#0a1828,#0a0a1a,#081a2e)",
            "dark-galaxy": "linear-gradient(135deg,#0a0618,#180820,#060818,#1a0a28)",
            "dark-fire": "linear-gradient(135deg,#1a0804,#2e0a00,#1a1000,#2e0600)",
            "dark-nebula": "linear-gradient(135deg,#100820,#1c082e)",
            "dark-supernova": "linear-gradient(135deg,#051515,#082828)",
            "dark-cyberpunk": "linear-gradient(135deg,#1c0510,#1e0520)",
            "dark-acid": "linear-gradient(135deg,#0a1a08,#051002)",
            "dark-lava": "linear-gradient(135deg,#1c0803,#2e0200)",
            "light-blue": "linear-gradient(135deg,#f0f7ff,#e6f0fa)",
            "light-yellow": "linear-gradient(135deg,#fffcf0,#fff5cc)",
            "light-green": "linear-gradient(135deg,#f0fff4,#e0fae8)",
            "light-red": "linear-gradient(135deg,#fff0f0,#fae0e0)",
            "light-gray": "linear-gradient(135deg,#f5f5f5,#eee)",
            "light-orange": "linear-gradient(135deg,#fff8f0,#fae8d0)",
            "light-pink": "linear-gradient(135deg,#fff0f6,#fae0ee)",
            "light-teal": "linear-gradient(135deg,#f0fff8,#d8f5e8)",
            "light-cyan": "linear-gradient(135deg,#f0fbff,#d8f0fa)",
            "light-indigo": "linear-gradient(135deg,#f2f0ff,#e4e0fa)",
            "light-lime": "linear-gradient(135deg,#f6fff0,#e4fad0)",
            "light-coral": "linear-gradient(135deg,#fff4f0,#fae4d8)",
            "light-magenta": "linear-gradient(135deg,#fff0fa,#fae0f4)",
            "light-gold": "linear-gradient(135deg,#fffcf0,#fff3c0)",
            "light-emerald": "linear-gradient(135deg,#eefcf4,#d0fae0)",
            "light-lavender": "linear-gradient(135deg,#f8f0ff,#f0e0fa)",
            "light-peach": "linear-gradient(135deg,#fff5ee,#fae6d4)",
            "light-mint": "linear-gradient(135deg,#f0fff6,#d4fae4)",
            "light-rose": "linear-gradient(135deg,#fff0f2,#fadce0)",
            "light-sky": "linear-gradient(135deg,#f0f8ff,#d8ecfa)",
            "light-sand": "linear-gradient(135deg,#faf6f0,#f0e8d8)",
            "light-lilac": "linear-gradient(135deg,#f8f2ff,#eee0fa)",
            "light-ivory": "linear-gradient(135deg,#fdfcf8,#f4f0e8)",
            "light-aqua": "linear-gradient(135deg,#f0fffc,#d0f8f0)",
            "light-blush": "linear-gradient(135deg,#fff0f4,#fadce6)",
            "light-sage": "linear-gradient(135deg,#f2f6f0,#e0ead8)",
            "light-honey": "linear-gradient(135deg,#fffaf0,#fff0c8)",
            "light-cream": "linear-gradient(135deg,#fdfaf4,#f6f0e4)",
            "light-snow": "linear-gradient(135deg,#fafaff,#f0f0fa)",
            "light-banana": "linear-gradient(135deg,#fffee8,#fff9b0)",
            "light-apricot": "linear-gradient(135deg,#fff9f2,#ffe3c8)",
            "light-pistachio": "linear-gradient(135deg,#f2fff5,#cbf2d5)",
            "light-skyline": "linear-gradient(135deg,#f5faff,#cfe3ff)",
            "light-parchment": "linear-gradient(135deg,#fcf8f2,#eedcbd)",
            "light-seashell": "linear-gradient(135deg,#fffaf8,#ffe8e0)",
            "light-linen": "linear-gradient(135deg,#fbfbfa,#e6e6e2)",
            "light-butter": "linear-gradient(135deg,#fffdf2,#fff7b0)",
            "light-lavendercream": "linear-gradient(135deg,#faf8ff,#ebe4ff)",
            "light-cotton": "linear-gradient(135deg,#fcfdff,#e0e8ff)",
            "light-aurora": "linear-gradient(135deg,#e8fff0,#f0ffe8,#e0f8ff,#f0fff4)",
            "light-sunset": "linear-gradient(135deg,#fff0e8,#ffe8f0,#fff8e0,#ffe0e8)",
            "light-ocean": "linear-gradient(135deg,#e8f4ff,#f0e8ff,#e0f0ff,#f0f8ff)",
            "light-galaxy": "linear-gradient(135deg,#f0e8ff,#e8e0ff,#f4f0ff,#ece4ff)",
            "light-cherry": "linear-gradient(135deg,#ffe8f0,#fff0f4,#ffe0ec,#fff4f8)",
            "light-rainbow": "linear-gradient(135deg,#ffebee,#fffde7,#e8f5e9,#e3f2fd)",
            "light-bubblegum": "linear-gradient(135deg,#fce4ec,#f3e5f5,#efebe9,#e8f5e9)",
            "light-spring": "linear-gradient(135deg,#f1f8e9,#f9fbe7,#efebe9,#e8f5e9)",
            "light-meadow": "linear-gradient(135deg,#fffde7,#fff9c4,#fff59d,#fff176)",
            "light-breeze": "linear-gradient(135deg,#e0f7fa,#e0f2f1,#e0f7fa,#e0f2f1)"
        };

        const renderCategory = (title, items, isAnimated) => {
            const label = document.createElement('div');
            label.className = 'theme-section-label';
            label.textContent = title;
            grid.appendChild(label);
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'theme-card' + (item.id === this.config.settings.theme ? ' active' : '');
                card.dataset.theme = item.id;
                
                const bgStyle = themeColors[item.id] || "linear-gradient(135deg,#ccc,#999)";
                
                card.innerHTML = 
                    `<div class="theme-color ${isAnimated ? 'theme-color-animated' : ''}" style="background: ${bgStyle};"></div>`+
                    `<span>${item.label}</span>`
                ;
                
                card.addEventListener('click', () => {
                    this.applyTheme(item.id);
                    this.saveConfig();
                    grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                });
                grid.appendChild(card);
            });
        };

        renderCategory('تم‌های تاریک (۴۰)', darkStatic, false);
        renderCategory('تاریک متحرک (۱۰)', darkAnimated, true);
        renderCategory('تم‌های روشن (۴۰)', lightStatic, false);
        renderCategory('روشن متحرک (۱۰)', lightAnimated, true);
    }
}

let chatApp;
document.addEventListener('DOMContentLoaded', () => { 
    chatApp = new ChatApp(); 
    window.chatApp = chatApp; 
});
