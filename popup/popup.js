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
      openRouterModel: 'openrouter/openai/gpt-4o-mini'
    };
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setupTabs();
    this.renderKeywords();
    this.renderStats();
    this.renderSettings();
    this.checkAuthStatus();
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

    // Statistics
    document.getElementById('export-now-btn').addEventListener('click', () => this.exportNow());
    document.getElementById('clear-data-btn').addEventListener('click', () => this.clearData());

    // Settings
    document.getElementById('save-settings-btn').addEventListener('click', () => this.saveAllSettings());
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
    document.getElementById('openrouter-model').value = this.settings.openRouterModel || 'openrouter/openai/gpt-4o-mini';
    this.updateOpenRouterStatus();
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
    statusBar.style.color = type === 'error' ? '#d32f2f' : '#0077b5';

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
