const OPENROUTER_FREE_MODELS = [
  { id: 'kwaipilot/kat-coder-pro:free', label: 'Kwaipilot: KAT-Coder-Pro V1 (free)' },
  { id: 'nvidia/nemotron-nano-12b-v2-vl:free', label: 'NVIDIA: Nemotron Nano 12B 2 VL (free)' },
  { id: 'alibaba/tongyi-deepresearch-30b-a3b:free', label: 'Tongyi DeepResearch 30B A3B (free)' },
  { id: 'meituan/longcat-flash-chat:free', label: 'Meituan: LongCat Flash Chat (free)' },
  { id: 'nvidia/nemotron-nano-9b-v2:free', label: 'NVIDIA: Nemotron Nano 9B V2 (free)' },
  { id: 'deepseek/deepseek-chat-v3.1:free', label: 'DeepSeek: DeepSeek V3.1 (free)' },
  { id: 'openai/gpt-oss-20b:free', label: 'OpenAI: GPT-OSS 20B (free)' },
  { id: 'z-ai/glm-4.5-air:free', label: 'Z.AI: GLM 4.5 Air (free)' },
  { id: 'qwen/qwen3-coder:free', label: 'Qwen: Qwen3 Coder 480B A35B (free)' },
  { id: 'moonshotai/kimi-k2:free', label: 'MoonshotAI: Kimi K2 0711 (free)' },
  { id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Venice: Uncensored (free)' },
  { id: 'google/gemma-3n-e2b-it:free', label: 'Google: Gemma 3n 2B (free)' },
  { id: 'tngtech/deepseek-r1t2-chimera:free', label: 'TNG: DeepSeek R1T2 Chimera (free)' },
  { id: 'mistralai/mistral-small-3.2-24b-instruct:free', label: 'Mistral: Small 3.2 24B (free)' },
  { id: 'deepseek/deepseek-r1-0528-qwen3-8b:free', label: 'DeepSeek: R1 0528 Qwen3 8B (free)' },
  { id: 'deepseek/deepseek-r1-0528:free', label: 'DeepSeek: R1 0528 (free)' },
  { id: 'google/gemma-3n-e4b-it:free', label: 'Google: Gemma 3n 4B (free)' },
  { id: 'meta-llama/llama-3.3-8b-instruct:free', label: 'Meta: Llama 3.3 8B Instruct (free)' },
  { id: 'qwen/qwen3-4b:free', label: 'Qwen: Qwen3 4B (free)' },
  { id: 'qwen/qwen3-30b-a3b:free', label: 'Qwen: Qwen3 30B A3B (free)' },
  { id: 'qwen/qwen3-14b:free', label: 'Qwen: Qwen3 14B (free)' },
  { id: 'qwen/qwen3-235b-a22b:free', label: 'Qwen: Qwen3 235B A22B (free)' },
  { id: 'tngtech/deepseek-r1t-chimera:free', label: 'TNG: DeepSeek R1T Chimera (free)' },
  { id: 'microsoft/mai-ds-r1:free', label: 'Microsoft: MAI DS R1 (free)' },
  { id: 'arliai/qwq-32b-arliai-rpr-v1:free', label: 'ArliAI: QwQ 32B RpR v1 (free)' },
  { id: 'agentica-org/deepcoder-14b-preview:free', label: 'Agentica: Deepcoder 14B Preview (free)' },
  { id: 'meta-llama/llama-4-maverick:free', label: 'Meta: Llama 4 Maverick (free)' },
  { id: 'meta-llama/llama-4-scout:free', label: 'Meta: Llama 4 Scout (free)' },
  { id: 'qwen/qwen2.5-vl-32b-instruct:free', label: 'Qwen: Qwen2.5 VL 32B Instruct (free)' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek: DeepSeek V3 0324 (free)' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral: Small 3.1 24B (free)' },
  { id: 'google/gemma-3-4b-it:free', label: 'Google: Gemma 3 4B (free)' },
  { id: 'google/gemma-3-12b-it:free', label: 'Google: Gemma 3 12B (free)' },
  { id: 'google/gemma-3-27b-it:free', label: 'Google: Gemma 3 27B (free)' },
  { id: 'mistralai/mistral-small-24b-instruct-2501:free', label: 'Mistral: Small 3 (free)' },
  { id: 'deepseek/deepseek-r1-distill-llama-70b:free', label: 'DeepSeek: R1 Distill Llama 70B (free)' },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek: R1 (free)' },
  { id: 'google/gemini-2.0-flash-exp:free', label: 'Google: Gemini 2.0 Flash Experimental (free)' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta: Llama 3.3 70B Instruct (free)' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct:free', label: 'Qwen2.5 Coder 32B Instruct (free)' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Meta: Llama 3.2 3B Instruct (free)' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen2.5 72B Instruct (free)' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Nous: Hermes 3 405B Instruct (free)' },
  { id: 'mistralai/mistral-nemo:free', label: 'Mistral: Nemo (free)' },
  { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral: 7B Instruct (free)' }
];

const OPENROUTER_DEFAULT_MODEL = OPENROUTER_FREE_MODELS[0]?.id || '';

// Popup UI Controller
class PopupController {
  constructor() {
    this.keywords = [];
    this.settings = {};
    this.stats = {
      totalLeads: 0,
      emailsFound: 0,
      phonesFound: 0,
      exportedCount: 0,
      lastSync: null
    };
    this.init();
  }

  getDefaultSettings() {
    return {
      caseSensitive: false,
      wholeWord: false,
      autoSync: true,
      scanMode: 'auto',
      enableNotifications: true,
      highlightPosts: true,
      scanComments: false,
      scanIntervalMs: 15000,
      autoSearchEnabled: false,
      autoSearchDelay: 20000,
      autoScrollEnabled: true,
      autoScrollDelay: 1500,
      autoScrollCycles: 6,
      aiRelevanceEnabled: false,
      companyProfile: '',
      openRouterModel: OPENROUTER_DEFAULT_MODEL,
      // Co-pilot settings
      intelligentMode: false,
      currentGoalId: null,
      autopilotEnabled: false
    };
  }

  async init() {
    await this.loadData();
    this.populateModelOptions();
    this.setupEventListeners();
    this.setupTabs();
    this.renderKeywords();
    this.renderStats();
    this.renderSettings();
    this.checkAuthStatus();
    this.initCoPilot();
  }

  async loadData() {
    try {
      const data = await chrome.storage.sync.get(['keywords', 'settings']);
      const localData = await chrome.storage.local.get(['stats', 'openRouterKey']);

      const defaults = this.getDefaultSettings();
      this.keywords = data.keywords || [];
      this.settings = { ...defaults, ...(data.settings || {}) };
      this.stats = localData.stats || this.stats;
      this.hasOpenRouterKey = Boolean(localData.openRouterKey);
      this.maskedOpenRouterKey = this.maskApiKey(localData.openRouterKey || '');
    } catch (error) {
      console.error('Error loading data:', error);
      this.showStatus('Error loading data', 'error');
    }
  }

  setupEventListeners() {
    // Keywords
    document.getElementById('add-keyword-btn').addEventListener('click', () => this.addKeyword());
    document.getElementById('keyword-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addKeyword();
    });
    document.getElementById('case-sensitive').addEventListener('change', (e) => {
      this.settings.caseSensitive = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('whole-word').addEventListener('change', (e) => {
      this.settings.wholeWord = e.target.checked;
      this.saveSettings();
    });

    // Google Sheets
    document.getElementById('auth-btn').addEventListener('click', () => this.authenticateGoogle());
    document.getElementById('save-sheet-btn').addEventListener('click', () => this.saveSheetConfig());
    document.getElementById('test-connection-btn').addEventListener('click', () => this.testConnection());
    document.getElementById('auto-sync').addEventListener('change', (e) => {
      this.settings.autoSync = e.target.checked;
      this.saveSettings();
    });

    // Automation & AI
    document.getElementById('auto-search').addEventListener('change', (e) => {
      this.settings.autoSearchEnabled = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('auto-scroll').addEventListener('change', (e) => {
      this.settings.autoScrollEnabled = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('ai-filter').addEventListener('change', (e) => {
      this.settings.aiRelevanceEnabled = e.target.checked;
      this.saveSettings();
    });
    document.getElementById('search-delay').addEventListener('change', (e) => {
      const val = Math.max(5, Number(e.target.value) || 20);
      this.settings.autoSearchDelay = val * 1000;
      e.target.value = val;
      this.saveSettings();
    });
    document.getElementById('scroll-cycles').addEventListener('change', (e) => {
      const val = Math.max(1, Number(e.target.value) || 6);
      this.settings.autoScrollCycles = val;
      e.target.value = val;
      this.saveSettings();
    });
    document.getElementById('openrouter-model').addEventListener('change', (e) => {
      this.settings.openRouterModel = e.target.value;
      this.saveSettings();
    });
    const profileInput = document.getElementById('company-profile');
    profileInput.addEventListener('input', (e) => {
      this.settings.companyProfile = e.target.value;
    });
    profileInput.addEventListener('blur', () => this.saveSettings());
    document.getElementById('save-openrouter-key').addEventListener('click', () => this.saveOpenRouterKey());
    document.getElementById('clear-openrouter-key').addEventListener('click', () => this.clearOpenRouterKey());
    document.getElementById('start-ai-auto-search').addEventListener('click', () => this.startAutoSearchWithAI());

    // Statistics
    document.getElementById('export-now-btn').addEventListener('click', () => this.exportNow());
    document.getElementById('clear-data-btn').addEventListener('click', () => this.clearData());

    // Settings
    document.getElementById('save-settings-btn').addEventListener('click', () => this.saveAllSettings());

    // Co-Pilot
    document.getElementById('analyze-page-btn').addEventListener('click', () => this.analyzePage());
    document.getElementById('start-copilot-btn').addEventListener('click', () => this.startCoPilot());
    document.getElementById('stop-copilot-btn').addEventListener('click', () => this.stopCoPilot());
    document.getElementById('autopilot-mode').addEventListener('change', (e) => {
      this.settings.autopilotEnabled = e.target.checked;
      this.saveSettings();
    });
  }

  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;

        // Remove active class from all
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked
        btn.classList.add('active');
        document.getElementById(tabName).classList.add('active');
      });
    });
  }

  async addKeyword() {
    const input = document.getElementById('keyword-input');
    const keyword = input.value.trim();

    if (!keyword) {
      this.showStatus('Please enter a keyword', 'error');
      return;
    }

    if (this.keywords.includes(keyword)) {
      this.showStatus('Keyword already exists', 'error');
      return;
    }

    this.keywords.push(keyword);
    await this.saveKeywords();
    this.renderKeywords();
    input.value = '';
    this.showStatus('Keyword added successfully');
  }

  async removeKeyword(keyword) {
    this.keywords = this.keywords.filter(k => k !== keyword);
    await this.saveKeywords();
    this.renderKeywords();
    this.showStatus('Keyword removed');
  }

  async saveKeywords() {
    try {
      await chrome.storage.sync.set({ keywords: this.keywords });
      // Notify content script of keyword update
      this.notifyContentScript({ type: 'KEYWORDS_UPDATED', keywords: this.keywords });
    } catch (error) {
      console.error('Error saving keywords:', error);
      this.showStatus('Error saving keywords', 'error');
    }
  }

  renderKeywords() {
    const container = document.getElementById('keyword-list');

    if (this.keywords.length === 0) {
      container.innerHTML = '<div class="empty-state">No keywords added yet. Add keywords to start finding leads.</div>';
      return;
    }

    container.innerHTML = this.keywords.map(keyword => `
      <div class="keyword-item">
        <span class="keyword-text">${this.escapeHtml(keyword)}</span>
        <button class="remove-keyword" data-keyword="${this.escapeHtml(keyword)}">&times;</button>
      </div>
    `).join('');

    // Add event listeners to remove buttons
    container.querySelectorAll('.remove-keyword').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeKeyword(btn.dataset.keyword);
      });
    });
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
      // Notify content script
      this.notifyContentScript({ type: 'SETTINGS_UPDATED', settings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async saveAllSettings() {
    this.settings.scanMode = document.getElementById('scan-mode').value;
    this.settings.enableNotifications = document.getElementById('enable-notifications').checked;
    this.settings.highlightPosts = document.getElementById('highlight-posts').checked;
    this.settings.scanComments = document.getElementById('scan-comments').checked;
    this.settings.companyProfile = document.getElementById('company-profile').value.trim();
    this.settings.autoSearchEnabled = document.getElementById('auto-search').checked;
    this.settings.autoScrollEnabled = document.getElementById('auto-scroll').checked;
    this.settings.aiRelevanceEnabled = document.getElementById('ai-filter').checked;
    const delayValue = Math.max(5, Number(document.getElementById('search-delay').value) || 20);
    const cycleValue = Math.max(1, Number(document.getElementById('scroll-cycles').value) || 6);
    this.settings.autoSearchDelay = delayValue * 1000;
    this.settings.autoScrollCycles = cycleValue;
    this.settings.openRouterModel = document.getElementById('openrouter-model').value;

    await this.saveSettings();
    this.showStatus('Settings saved successfully');
  }

  renderSettings() {
    document.getElementById('case-sensitive').checked = this.settings.caseSensitive || false;
    document.getElementById('whole-word').checked = this.settings.wholeWord || false;
    document.getElementById('auto-sync').checked = this.settings.autoSync !== false;
    document.getElementById('scan-mode').value = this.settings.scanMode || 'auto';
    document.getElementById('enable-notifications').checked = this.settings.enableNotifications !== false;
    document.getElementById('highlight-posts').checked = this.settings.highlightPosts !== false;
    document.getElementById('scan-comments').checked = this.settings.scanComments || false;
    this.renderAutomationSettings();
  }

  populateModelOptions() {
    const select = document.getElementById('openrouter-model');
    if (!select) return;

    select.innerHTML = '';
    OPENROUTER_FREE_MODELS.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.label;
      select.appendChild(option);
    });
  }

  renderAutomationSettings() {
    const profileInput = document.getElementById('company-profile');
    if (profileInput) {
      profileInput.value = this.settings.companyProfile || '';
    }

    const delaySeconds = Math.round((this.settings.autoSearchDelay || 20000) / 1000);
    const scrollCycles = this.settings.autoScrollCycles || 6;

    document.getElementById('auto-search').checked = !!this.settings.autoSearchEnabled;
    document.getElementById('auto-scroll').checked = this.settings.autoScrollEnabled !== false;
    document.getElementById('ai-filter').checked = !!this.settings.aiRelevanceEnabled;
    document.getElementById('search-delay').value = delaySeconds;
    document.getElementById('scroll-cycles').value = scrollCycles;
    const modelSelect = document.getElementById('openrouter-model');
    const desiredModel = this.settings.openRouterModel || OPENROUTER_DEFAULT_MODEL;
    if (modelSelect) {
      const exists = OPENROUTER_FREE_MODELS.some((model) => model.id === desiredModel);
      if (!exists && desiredModel) {
        const option = document.createElement('option');
        option.value = desiredModel;
        option.textContent = `${desiredModel} (custom)`;
        modelSelect.appendChild(option);
      }
      modelSelect.value = desiredModel;
    }
    this.updateOpenRouterStatus();
  }

  async startAutoSearchWithAI() {
    if (!this.hasOpenRouterKey) {
      this.showStatus('Add your OpenRouter API key first.', 'error');
      return;
    }

    const profile = (this.settings.companyProfile || '').trim();
    if (!profile) {
      this.showStatus('Describe your ideal lead in the company profile field.', 'error');
      return;
    }

    this.showStatus('Generating fresh keywords with AI...', 'info');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_KEYWORDS',
        profile,
        existingKeywords: this.keywords,
        model: this.settings.openRouterModel || OPENROUTER_DEFAULT_MODEL
      });

      if (!response?.success) {
        throw new Error(response?.error || 'AI keyword generation failed');
      }

      const generated = (response.keywords || []).map(keyword => keyword.trim()).filter(Boolean);
      if (generated.length === 0) {
        throw new Error('AI did not return any keywords');
      }

      const previousCount = this.keywords.length;
      const combined = [...new Set([...generated, ...this.keywords])].slice(0, 50);
      const addedCount = combined.length - previousCount;

      this.keywords = combined;
      await this.saveKeywords();
      this.renderKeywords();

      this.settings.autoSearchEnabled = true;
      await this.saveSettings();
      this.renderSettings();

      this.notifyContentScript({ type: 'START_AUTO_SEARCH' });

      const keywordMsg = addedCount > 0
        ? `AI added ${addedCount} new keyword${addedCount === 1 ? '' : 's'}`
        : 'Keywords refreshed';
      this.showStatus(`${keywordMsg}. Auto-search is running.`, 'success');
    } catch (error) {
      console.error('AI auto search error:', error);
      this.showStatus(error.message || 'Unable to start AI auto search', 'error');
    }
  }

  async checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get(['googleToken', 'sheetId']);
      const isConnected = !!result.googleToken;

      const indicator = document.getElementById('status-indicator');
      const authText = document.getElementById('auth-text');
      const authBtn = document.getElementById('auth-btn');
      const sheetConfig = document.getElementById('sheet-config');

      if (isConnected) {
        indicator.classList.add('connected');
        authText.textContent = 'Connected';
        authBtn.textContent = 'Disconnect';
        sheetConfig.style.display = 'block';

        if (result.sheetId) {
          document.getElementById('sheet-url').value = result.sheetId;
        }
      } else {
        indicator.classList.remove('connected');
        authText.textContent = 'Not connected';
        authBtn.textContent = 'Connect Google Account';
        sheetConfig.style.display = 'none';
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }

  async authenticateGoogle() {
    const authBtn = document.getElementById('auth-btn');

    if (authBtn.textContent === 'Disconnect') {
      await chrome.storage.local.remove(['googleToken', 'sheetId']);
      this.checkAuthStatus();
      this.showStatus('Disconnected from Google');
      return;
    }

    this.showStatus('Authenticating...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'AUTHENTICATE_GOOGLE'
      });

      if (response.success) {
        this.showStatus('Connected to Google successfully');
        this.checkAuthStatus();
      } else {
        this.showStatus('Authentication failed', 'error');
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.showStatus('Authentication error', 'error');
    }
  }

  async saveSheetConfig() {
    const sheetUrl = document.getElementById('sheet-url').value.trim();

    if (!sheetUrl) {
      this.showStatus('Please enter a Sheet URL or ID', 'error');
      return;
    }

    // Extract sheet ID from URL or use as-is
    let sheetId = sheetUrl;
    const urlMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      sheetId = urlMatch[1];
    }

    try {
      await chrome.storage.local.set({ sheetId });
      this.showStatus('Sheet configuration saved');
    } catch (error) {
      console.error('Error saving sheet config:', error);
      this.showStatus('Error saving configuration', 'error');
    }
  }

  async testConnection() {
    this.showStatus('Testing connection...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_SHEET_CONNECTION'
      });

      if (response.success) {
        this.showStatus('Connection successful!');
      } else {
        this.showStatus('Connection failed: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      this.showStatus('Connection test failed', 'error');
    }
  }

  renderStats() {
    document.getElementById('total-leads').textContent = this.stats.totalLeads || 0;
    document.getElementById('emails-found').textContent = this.stats.emailsFound || 0;
    document.getElementById('phones-found').textContent = this.stats.phonesFound || 0;
    document.getElementById('exported-count').textContent = this.stats.exportedCount || 0;

    const lastSync = this.stats.lastSync
      ? new Date(this.stats.lastSync).toLocaleString()
      : 'Never';
    document.getElementById('last-sync-time').textContent = lastSync;
  }

  async exportNow() {
    this.showStatus('Exporting to Google Sheets...');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXPORT_NOW'
      });

      if (response.success) {
        this.stats.lastSync = new Date().toISOString();
        this.stats.exportedCount = response.count || this.stats.exportedCount;
        await chrome.storage.local.set({ stats: this.stats });
        this.renderStats();
        this.showStatus(`Exported ${response.count || 0} leads successfully`);
      } else {
        this.showStatus('Export failed: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showStatus('Export failed', 'error');
    }
  }

  async clearData() {
    if (!confirm('Are you sure you want to clear all lead data? This cannot be undone.')) {
      return;
    }

    try {
      await chrome.storage.local.remove(['leads', 'stats']);
      this.stats = {
        totalLeads: 0,
        emailsFound: 0,
        phonesFound: 0,
        exportedCount: 0,
        lastSync: null
      };
      this.renderStats();
      this.showStatus('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showStatus('Error clearing data', 'error');
    }
  }

  notifyContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {
          // Content script might not be loaded
        });
      }
    });
  }

  showStatus(message, type = 'success') {
    const statusBar = document.getElementById('status-message');
    statusBar.textContent = message;
    const colors = {
      success: '#0077b5',
      error: '#d32f2f',
      info: '#555'
    };
    statusBar.style.color = colors[type] || colors.success;

    setTimeout(() => {
      statusBar.textContent = 'Ready';
      statusBar.style.color = '#666';
    }, 3000);
  }

  async saveOpenRouterKey() {
    const input = document.getElementById('openrouter-key');
    const key = (input.value || '').trim();
    if (!key) {
      this.updateOpenRouterStatus('Enter an API key before saving.', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ openRouterKey: key });
      input.value = '';
      this.hasOpenRouterKey = true;
      this.maskedOpenRouterKey = this.maskApiKey(key);
      this.updateOpenRouterStatus('API key saved securely.');
      this.showStatus('OpenRouter key saved');
    } catch (error) {
      console.error('Error saving API key:', error);
      this.updateOpenRouterStatus('Unable to save key. Try again.', 'error');
    }
  }

  async clearOpenRouterKey() {
    try {
      await chrome.storage.local.remove(['openRouterKey']);
      this.hasOpenRouterKey = false;
      this.maskedOpenRouterKey = '';
      this.updateOpenRouterStatus('API key removed. AI filtering disabled until a key is added.');
      this.showStatus('OpenRouter key cleared');
    } catch (error) {
      console.error('Error clearing API key:', error);
      this.updateOpenRouterStatus('Failed to clear key.', 'error');
    }
  }

  updateOpenRouterStatus(message, type = 'info') {
    const statusEl = document.getElementById('openrouter-status');
    if (!statusEl) return;

    if (!message) {
      if (this.hasOpenRouterKey && this.maskedOpenRouterKey) {
        message = `API key stored (${this.maskedOpenRouterKey}).`;
        type = 'success';
      } else {
        message = 'API key not configured';
        type = 'info';
      }
    }

    statusEl.textContent = message;
    switch (type) {
      case 'error':
        statusEl.style.color = '#d32f2f';
        break;
      case 'success':
        statusEl.style.color = '#2e7d32';
        break;
      default:
        statusEl.style.color = '#777';
    }
  }

  maskApiKey(key = '') {
    if (!key || key.length < 10) return key ? `${key.slice(0, 3)}***` : '';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ====== CO-PILOT METHODS ======

  initCoPilot() {
    this.renderGoalCards();
    this.selectedGoalId = this.settings.currentGoalId;
  }

  renderGoalCards() {
    const goalGrid = document.getElementById('goal-grid');
    if (!goalGrid) return;

    const goals = [
      {
        id: 'job_applicants',
        icon: '📋',
        name: 'Job Applicants',
        description: 'Extract applicant profiles and download resumes from job listings'
      },
      {
        id: 'comment_mining',
        icon: '💬',
        name: 'Comment Mining',
        description: 'Mine emails and contacts from post comments'
      },
      {
        id: 'post_engagement',
        icon: '❤️',
        name: 'Post Engagement',
        description: 'Find people who liked/commented on relevant posts'
      },
      {
        id: 'people_discovery',
        icon: '👥',
        name: 'People Discovery',
        description: 'Extract profiles matching your criteria'
      },
      {
        id: 'company_intel',
        icon: '🏢',
        name: 'Company Intel',
        description: 'Gather employee lists and decision makers'
      },
      {
        id: 'keyword_hunting',
        icon: '🔍',
        name: 'Keyword Hunting',
        description: 'Traditional keyword-based extraction (enhanced)'
      }
    ];

    goalGrid.innerHTML = goals.map(goal => `
      <div class="goal-card ${this.selectedGoalId === goal.id ? 'selected' : ''}" data-goal-id="${goal.id}">
        <div class="goal-icon">${goal.icon}</div>
        <div class="goal-name">${goal.name}</div>
        <div class="goal-description">${goal.description}</div>
      </div>
    `).join('');

    // Add click listeners
    goalGrid.querySelectorAll('.goal-card').forEach(card => {
      card.addEventListener('click', () => {
        goalGrid.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedGoalId = card.dataset.goalId;
      });
    });
  }

  async analyzePage() {
    const btn = document.getElementById('analyze-page-btn');
    const resultDiv = document.getElementById('analysis-result');

    btn.disabled = true;
    btn.textContent = '🔍 Analyzing...';
    resultDiv.innerHTML = '<p class="text-muted">Analyzing current page...</p>';

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      // Check if on LinkedIn
      if (!tabs[0].url || !tabs[0].url.includes('linkedin.com')) {
        throw new Error('Please navigate to a LinkedIn page first');
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'ANALYZE_PAGE'
      });

      if (response && response.success) {
        const analysis = response.analysis;

        resultDiv.innerHTML = `
          <div class="analysis-info">
            <div><strong>Page Type:</strong> ${this.formatPageType(analysis.pageType)}</div>
            <div><strong>Extractable Elements:</strong></div>
            <ul>
              ${analysis.extractableElements.map(el => `
                <li>${el.type}: ${el.extractable ? el.extractable.join(', ') : 'N/A'} ${el.count ? `(${el.count})` : ''}</li>
              `).join('')}
            </ul>
            ${analysis.recommendedGoal ? `<div><strong>Recommended:</strong> ${analysis.recommendedGoal.name}</div>` : ''}
          </div>
        `;

        this.showStatus('Page analyzed successfully');
      } else {
        throw new Error('Failed to analyze page');
      }
    } catch (error) {
      console.error('Error analyzing page:', error);

      // Handle connection errors specifically
      if (error.message && error.message.includes('Could not establish connection')) {
        resultDiv.innerHTML = `
          <p class="text-error">⚠️ Co-pilot not ready</p>
          <p style="font-size: 11px; margin-top: 8px;">Please <strong>refresh the LinkedIn page</strong> and try again.</p>
          <p style="font-size: 10px; color: #999; margin-top: 4px;">The extension needs to load on the page first.</p>
        `;
        this.showStatus('Please refresh the LinkedIn page', 'error');
      } else {
        resultDiv.innerHTML = `<p class="text-error">Error: ${error.message}</p>`;
        this.showStatus('Error analyzing page', 'error');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = '🔍 Analyze Page';
    }
  }

  async startCoPilot() {
    if (!this.selectedGoalId) {
      this.showStatus('Please select a goal first', 'error');
      return;
    }

    const customInstructions = document.getElementById('custom-instructions').value;
    const statusDiv = document.getElementById('copilot-status');
    const startBtn = document.getElementById('start-copilot-btn');
    const stopBtn = document.getElementById('stop-copilot-btn');

    startBtn.disabled = true;
    statusDiv.innerHTML = '<p class="text-info">🚀 Starting co-pilot...</p>';

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      // Check if on LinkedIn
      if (!tabs[0].url || !tabs[0].url.includes('linkedin.com')) {
        throw new Error('Please navigate to a LinkedIn page first');
      }

      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        type: 'START_INTELLIGENT_MODE',
        goalId: this.selectedGoalId,
        customInstructions: customInstructions
      });

      if (response && response.success) {
        this.settings.intelligentMode = true;
        this.settings.currentGoalId = this.selectedGoalId;
        await this.saveSettings();

        statusDiv.innerHTML = '<p class="text-success">✅ Co-pilot is active and extracting leads!</p>';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';

        this.showStatus('Co-pilot started successfully');
      } else {
        throw new Error('Failed to start co-pilot');
      }
    } catch (error) {
      console.error('Error starting co-pilot:', error);

      // Handle connection errors specifically
      if (error.message && error.message.includes('Could not establish connection')) {
        statusDiv.innerHTML = `
          <p class="text-error">⚠️ Co-pilot not ready</p>
          <p style="font-size: 11px; margin-top: 8px;">Please <strong>refresh the LinkedIn page</strong> and try again.</p>
          <p style="font-size: 10px; color: #999; margin-top: 4px;">After refreshing, re-select your goal and click Start.</p>
        `;
        this.showStatus('Please refresh the LinkedIn page', 'error');
      } else {
        statusDiv.innerHTML = `<p class="text-error">Error: ${error.message}</p>`;
        this.showStatus('Error starting co-pilot', 'error');
      }
      startBtn.disabled = false;
    }
  }

  async stopCoPilot() {
    const statusDiv = document.getElementById('copilot-status');
    const startBtn = document.getElementById('start-copilot-btn');
    const stopBtn = document.getElementById('stop-copilot-btn');

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'STOP_INTELLIGENT_MODE'
        });
      }

      this.settings.intelligentMode = false;
      this.settings.currentGoalId = null;
      await this.saveSettings();

      statusDiv.innerHTML = '<p class="text-muted">Co-pilot is inactive</p>';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      startBtn.disabled = false;

      this.showStatus('Co-pilot stopped');
    } catch (error) {
      console.error('Error stopping co-pilot:', error);
      this.showStatus('Error stopping co-pilot', 'error');
    }
  }

  formatPageType(pageType) {
    const typeMap = {
      'job_listing': 'Job Listing',
      'job_search': 'Job Search',
      'feed': 'Feed',
      'post_detail': 'Post Detail',
      'profile': 'Profile',
      'search_results': 'Search Results',
      'people_search': 'People Search',
      'company_page': 'Company Page',
      'messaging': 'Messaging',
      'unknown': 'Unknown'
    };

    return typeMap[pageType] || pageType;
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Listen for updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATS_UPDATED') {
    const popup = new PopupController();
    popup.stats = message.stats;
    popup.renderStats();
  }
});
