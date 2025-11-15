// Storage Management Utility
class StorageManager {
  constructor() {
    this.STORAGE_KEYS = {
      KEYWORDS: 'keywords',
      SETTINGS: 'settings',
      LEADS: 'leads',
      STATS: 'stats',
      GOOGLE_TOKEN: 'googleToken',
      SHEET_ID: 'sheetId'
    };
  }

  /**
   * Get keywords from storage
   * @returns {Promise<Array<string>>}
   */
  async getKeywords() {
    const data = await chrome.storage.sync.get([this.STORAGE_KEYS.KEYWORDS]);
    return data[this.STORAGE_KEYS.KEYWORDS] || [];
  }

  /**
   * Save keywords to storage
   * @param {Array<string>} keywords
   * @returns {Promise<void>}
   */
  async saveKeywords(keywords) {
    await chrome.storage.sync.set({
      [this.STORAGE_KEYS.KEYWORDS]: keywords
    });
  }

  /**
   * Add a keyword
   * @param {string} keyword
   * @returns {Promise<boolean>}
   */
  async addKeyword(keyword) {
    const keywords = await this.getKeywords();

    if (keywords.includes(keyword)) {
      return false; // Already exists
    }

    keywords.push(keyword);
    await this.saveKeywords(keywords);
    return true;
  }

  /**
   * Remove a keyword
   * @param {string} keyword
   * @returns {Promise<boolean>}
   */
  async removeKeyword(keyword) {
    const keywords = await this.getKeywords();
    const filtered = keywords.filter(k => k !== keyword);

    if (filtered.length === keywords.length) {
      return false; // Not found
    }

    await this.saveKeywords(filtered);
    return true;
  }

  /**
   * Get settings from storage
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const data = await chrome.storage.sync.get([this.STORAGE_KEYS.SETTINGS]);
    return data[this.STORAGE_KEYS.SETTINGS] || this.getDefaultSettings();
  }

  /**
   * Save settings to storage
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    await chrome.storage.sync.set({
      [this.STORAGE_KEYS.SETTINGS]: settings
    });
  }

  /**
   * Update specific setting
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    await this.saveSettings(settings);
  }

  /**
   * Get default settings
   * @returns {Object}
   */
  getDefaultSettings() {
    return {
      caseSensitive: false,
      wholeWord: false,
      autoSync: true,
      scanMode: 'auto',
      enableNotifications: true,
      highlightPosts: true,
      scanComments: false
    };
  }

  /**
   * Get leads from storage
   * @returns {Promise<Array<Object>>}
   */
  async getLeads() {
    const data = await chrome.storage.local.get([this.STORAGE_KEYS.LEADS]);
    return data[this.STORAGE_KEYS.LEADS] || [];
  }

  /**
   * Save leads to storage
   * @param {Array<Object>} leads
   * @returns {Promise<void>}
   */
  async saveLeads(leads) {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.LEADS]: leads
    });
  }

  /**
   * Add a lead
   * @param {Object} lead
   * @returns {Promise<void>}
   */
  async addLead(lead) {
    const leads = await this.getLeads();
    leads.push(lead);
    await this.saveLeads(leads);

    // Update stats
    await this.updateStatsForNewLead(lead);
  }

  /**
   * Get lead by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getLeadById(id) {
    const leads = await this.getLeads();
    return leads.find(lead => lead.id === id) || null;
  }

  /**
   * Update lead
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<boolean>}
   */
  async updateLead(id, updates) {
    const leads = await this.getLeads();
    const index = leads.findIndex(lead => lead.id === id);

    if (index === -1) {
      return false;
    }

    leads[index] = { ...leads[index], ...updates };
    await this.saveLeads(leads);
    return true;
  }

  /**
   * Delete lead
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteLead(id) {
    const leads = await this.getLeads();
    const filtered = leads.filter(lead => lead.id !== id);

    if (filtered.length === leads.length) {
      return false;
    }

    await this.saveLeads(filtered);
    return true;
  }

  /**
   * Get unexported leads
   * @returns {Promise<Array<Object>>}
   */
  async getUnexportedLeads() {
    const leads = await this.getLeads();
    return leads.filter(lead => !lead.exported);
  }

  /**
   * Mark leads as exported
   * @param {Array<string>} ids
   * @returns {Promise<void>}
   */
  async markAsExported(ids) {
    const leads = await this.getLeads();
    const timestamp = new Date().toISOString();

    leads.forEach(lead => {
      if (ids.includes(lead.id)) {
        lead.exported = true;
        lead.exportedAt = timestamp;
      }
    });

    await this.saveLeads(leads);
  }

  /**
   * Get stats from storage
   * @returns {Promise<Object>}
   */
  async getStats() {
    const data = await chrome.storage.local.get([this.STORAGE_KEYS.STATS]);
    return data[this.STORAGE_KEYS.STATS] || this.getDefaultStats();
  }

  /**
   * Save stats to storage
   * @param {Object} stats
   * @returns {Promise<void>}
   */
  async saveStats(stats) {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.STATS]: stats
    });
  }

  /**
   * Get default stats
   * @returns {Object}
   */
  getDefaultStats() {
    return {
      totalLeads: 0,
      emailsFound: 0,
      phonesFound: 0,
      exportedCount: 0,
      lastSync: null
    };
  }

  /**
   * Update stats for new lead
   * @param {Object} lead
   * @returns {Promise<void>}
   */
  async updateStatsForNewLead(lead) {
    const stats = await this.getStats();

    stats.totalLeads++;
    stats.emailsFound += (lead.emails?.length || 0);
    stats.phonesFound += (lead.phones?.length || 0);

    await this.saveStats(stats);
  }

  /**
   * Update export stats
   * @param {number} count
   * @returns {Promise<void>}
   */
  async updateExportStats(count) {
    const stats = await this.getStats();

    stats.exportedCount += count;
    stats.lastSync = new Date().toISOString();

    await this.saveStats(stats);
  }

  /**
   * Clear all leads
   * @returns {Promise<void>}
   */
  async clearLeads() {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.LEADS]: []
    });

    // Reset stats
    await this.saveStats(this.getDefaultStats());
  }

  /**
   * Get Google auth token
   * @returns {Promise<string|null>}
   */
  async getGoogleToken() {
    const data = await chrome.storage.local.get([this.STORAGE_KEYS.GOOGLE_TOKEN]);
    return data[this.STORAGE_KEYS.GOOGLE_TOKEN] || null;
  }

  /**
   * Save Google auth token
   * @param {string} token
   * @returns {Promise<void>}
   */
  async saveGoogleToken(token) {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.GOOGLE_TOKEN]: token
    });
  }

  /**
   * Clear Google auth token
   * @returns {Promise<void>}
   */
  async clearGoogleToken() {
    await chrome.storage.local.remove([this.STORAGE_KEYS.GOOGLE_TOKEN]);
  }

  /**
   * Get Sheet ID
   * @returns {Promise<string|null>}
   */
  async getSheetId() {
    const data = await chrome.storage.local.get([this.STORAGE_KEYS.SHEET_ID]);
    return data[this.STORAGE_KEYS.SHEET_ID] || null;
  }

  /**
   * Save Sheet ID
   * @param {string} sheetId
   * @returns {Promise<void>}
   */
  async saveSheetId(sheetId) {
    await chrome.storage.local.set({
      [this.STORAGE_KEYS.SHEET_ID]: sheetId
    });
  }

  /**
   * Get storage usage info
   * @returns {Promise<Object>}
   */
  async getStorageInfo() {
    const syncUsage = await chrome.storage.sync.getBytesInUse();
    const localUsage = await chrome.storage.local.getBytesInUse();

    return {
      sync: {
        used: syncUsage,
        limit: chrome.storage.sync.QUOTA_BYTES,
        percentage: (syncUsage / chrome.storage.sync.QUOTA_BYTES) * 100
      },
      local: {
        used: localUsage,
        limit: chrome.storage.local.QUOTA_BYTES,
        percentage: (localUsage / chrome.storage.local.QUOTA_BYTES) * 100
      }
    };
  }

  /**
   * Export all data
   * @returns {Promise<Object>}
   */
  async exportAllData() {
    const [keywords, settings, leads, stats] = await Promise.all([
      this.getKeywords(),
      this.getSettings(),
      this.getLeads(),
      this.getStats()
    ]);

    return {
      keywords,
      settings,
      leads,
      stats,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import data
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async importData(data) {
    if (data.keywords) await this.saveKeywords(data.keywords);
    if (data.settings) await this.saveSettings(data.settings);
    if (data.leads) await this.saveLeads(data.leads);
    if (data.stats) await this.saveStats(data.stats);
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
}
