// Google Sheets API Integration
class GoogleSheetsService {
  constructor() {
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    this.token = null;
    this.sheetId = null;
  }

  /**
   * Initialize service with token and sheet ID
   * @param {string} token - OAuth token
   * @param {string} sheetId - Google Sheet ID
   */
  init(token, sheetId) {
    this.token = token;
    this.sheetId = sheetId;
  }

  /**
   * Set OAuth token
   * @param {string} token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Set Sheet ID
   * @param {string} sheetId
   */
  setSheetId(sheetId) {
    this.sheetId = sheetId;
  }

  /**
   * Get sheet metadata
   * @returns {Promise<Object>}
   */
  async getSheetMetadata() {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized. Call init() first.');
    }

    const response = await fetch(`${this.baseUrl}/${this.sheetId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Get values from a range
   * @param {string} range - Sheet range (e.g., 'Sheet1!A1:H10')
   * @returns {Promise<Array>}
   */
  async getValues(range) {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized');
    }

    const response = await fetch(
      `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    return data.values || [];
  }

  /**
   * Append values to sheet
   * @param {Array<Array>} values - 2D array of values
   * @param {string} range - Starting range (e.g., 'Sheet1')
   * @returns {Promise<Object>}
   */
  async appendValues(values, range = 'Sheet1') {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized');
    }

    const response = await fetch(
      `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Update values in a range
   * @param {string} range - Range to update
   * @param {Array<Array>} values - Values to write
   * @returns {Promise<Object>}
   */
  async updateValues(range, values) {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized');
    }

    const response = await fetch(
      `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ values })
      }
    );

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Batch update multiple ranges
   * @param {Array<Object>} data - Array of {range, values} objects
   * @returns {Promise<Object>}
   */
  async batchUpdate(data) {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized');
    }

    const updateData = data.map(item => ({
      range: item.range,
      values: item.values
    }));

    const response = await fetch(
      `${this.baseUrl}/${this.sheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data: updateData
        })
      }
    );

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Clear a range
   * @param {string} range - Range to clear
   * @returns {Promise<Object>}
   */
  async clearRange(range) {
    if (!this.token || !this.sheetId) {
      throw new Error('Not initialized');
    }

    const response = await fetch(
      `${this.baseUrl}/${this.sheetId}/values/${encodeURIComponent(range)}:clear`,
      {
        method: 'POST',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Create or ensure headers exist
   * @returns {Promise<boolean>}
   */
  async ensureHeaders() {
    try {
      const values = await this.getValues('Sheet1!A1:H1');

      if (values.length === 0) {
        // No headers, create them
        await this.updateValues('Sheet1!A1:H1', [[
          'Timestamp',
          'Post URL',
          'Author',
          'Keywords Matched',
          'Post Content',
          'Emails',
          'Phone Numbers',
          'Status'
        ]]);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error ensuring headers:', error);
      throw error;
    }
  }

  /**
   * Export leads to sheet
   * @param {Array<Object>} leads - Array of lead objects
   * @returns {Promise<Object>}
   */
  async exportLeads(leads) {
    if (!leads || leads.length === 0) {
      return { success: true, count: 0 };
    }

    try {
      // Ensure headers exist
      await this.ensureHeaders();

      // Convert leads to rows
      const rows = leads.map(lead => [
        lead.timestamp || new Date().toISOString(),
        lead.postUrl || '',
        lead.authorName || '',
        Array.isArray(lead.keywordMatched) ? lead.keywordMatched.join(', ') : (lead.keywordMatched || ''),
        (lead.postContent || '').substring(0, 500), // Limit content length
        Array.isArray(lead.emails) ? lead.emails.join(', ') : (lead.emails || ''),
        Array.isArray(lead.phones) ? lead.phones.join(', ') : (lead.phones || ''),
        lead.status || 'New'
      ]);

      // Append to sheet
      const result = await this.appendValues(rows, 'Sheet1');

      return {
        success: true,
        count: leads.length,
        updates: result.updates
      };

    } catch (error) {
      console.error('Error exporting leads:', error);
      throw error;
    }
  }

  /**
   * Check if a lead already exists (by post URL)
   * @param {string} postUrl - Post URL to check
   * @returns {Promise<boolean>}
   */
  async leadExists(postUrl) {
    try {
      const values = await this.getValues('Sheet1!B:B'); // Column B contains URLs

      return values.some(row => row[0] === postUrl);

    } catch (error) {
      console.error('Error checking lead existence:', error);
      return false;
    }
  }

  /**
   * Get request headers
   * @returns {Object}
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Handle API errors
   * @param {Response} response
   */
  async handleError(response) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch (e) {
      // Could not parse error response
    }

    if (response.status === 401) {
      throw new Error('Authentication failed. Please reconnect your Google account.');
    } else if (response.status === 403) {
      throw new Error('Access denied. Please check sheet permissions.');
    } else if (response.status === 404) {
      throw new Error('Sheet not found. Please check the Sheet ID.');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    throw new Error(errorMessage);
  }

  /**
   * Test connection to sheet
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      const metadata = await this.getSheetMetadata();

      return {
        success: true,
        sheetName: metadata.properties.title,
        sheetId: metadata.spreadsheetId
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format lead data for export
   * @param {Object} lead - Lead object
   * @returns {Array}
   */
  static formatLead(lead) {
    return [
      lead.timestamp || new Date().toISOString(),
      lead.postUrl || '',
      lead.authorName || '',
      Array.isArray(lead.keywordMatched) ? lead.keywordMatched.join(', ') : '',
      (lead.postContent || '').substring(0, 500),
      Array.isArray(lead.emails) ? lead.emails.join(', ') : '',
      Array.isArray(lead.phones) ? lead.phones.join(', ') : '',
      lead.status || 'New'
    ];
  }

  /**
   * Get sheet headers
   * @returns {Array<string>}
   */
  static getHeaders() {
    return [
      'Timestamp',
      'Post URL',
      'Author',
      'Keywords Matched',
      'Post Content',
      'Emails',
      'Phone Numbers',
      'Status'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GoogleSheetsService = GoogleSheetsService;
}

// For Node.js/module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleSheetsService;
}
