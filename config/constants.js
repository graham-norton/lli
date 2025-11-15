// Configuration Constants for LinkedIn Lead Finder

const CONFIG = {
  // Extension Info
  NAME: 'LinkedIn Lead Finder',
  VERSION: '1.0.0',

  // Storage Keys
  STORAGE_KEYS: {
    KEYWORDS: 'keywords',
    SETTINGS: 'settings',
    LEADS: 'leads',
    STATS: 'stats',
    GOOGLE_TOKEN: 'googleToken',
    SHEET_ID: 'sheetId'
  },

  // Default Settings
  DEFAULT_SETTINGS: {
    caseSensitive: false,
    wholeWord: false,
    autoSync: true,
    scanMode: 'auto',
    enableNotifications: true,
    highlightPosts: true,
    scanComments: false
  },

  // LinkedIn Selectors (may need updates)
  LINKEDIN_SELECTORS: {
    POSTS: [
      '.feed-shared-update-v2',
      '[data-id^="urn:li:activity"]',
      '.occludable-update',
      'div[data-urn]'
    ],
    POST_CONTENT: [
      '.feed-shared-update-v2__description',
      '.feed-shared-text',
      '[data-test-id="main-feed-activity-card__commentary"]',
      '.update-components-text'
    ],
    AUTHOR: [
      '.feed-shared-actor__name',
      '[data-test-id="main-feed-activity-card__actor"]',
      '.update-components-actor__name'
    ],
    POST_LINK: [
      'a[href*="/feed/update/"]',
      'a[data-test-id="main-feed-activity-card__link"]'
    ],
    PROFILE_LINK: 'a[href*="/in/"]',
    FEED_CONTAINER: [
      '.scaffold-layout__main',
      'main',
      'body'
    ]
  },

  // API Settings
  GOOGLE_SHEETS: {
    API_BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
    SCOPES: ['https://www.googleapis.com/auth/spreadsheets'],
    DEFAULT_SHEET_NAME: 'Sheet1',
    HEADERS: [
      'Timestamp',
      'Post URL',
      'Author',
      'Keywords Matched',
      'Post Content',
      'Emails',
      'Phone Numbers',
      'Status'
    ]
  },

  // Rate Limiting
  RATE_LIMITS: {
    EXPORT_DELAY: 5000, // 5 seconds delay before batch export
    MAX_BATCH_SIZE: 50, // Maximum leads per batch
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000 // 2 seconds between retries
  },

  // Validation
  VALIDATION: {
    MAX_KEYWORD_LENGTH: 100,
    MAX_KEYWORDS: 50,
    MAX_POST_CONTENT_LENGTH: 500, // For export
    MIN_EMAIL_LENGTH: 6,
    MAX_EMAIL_LENGTH: 254,
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 15
  },

  // UI
  UI: {
    NOTIFICATION_DURATION: 5000, // 5 seconds
    STATUS_MESSAGE_DURATION: 3000, // 3 seconds
    STATS_UPDATE_INTERVAL: 1000 // 1 second
  },

  // Regex Patterns
  REGEX: {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE_US: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    PHONE_INTERNATIONAL: /\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    PHONE_SIMPLE: /\b\d{10,15}\b/g,
    URL: /(https?:\/\/[^\s]+)/g
  },

  // Blacklists
  BLACKLIST: {
    EMAILS: [
      'example.com',
      'test.com',
      'domain.com',
      'email.com',
      'yourcompany.com',
      'youremail.com',
      'company.com',
      'noreply@',
      'no-reply@'
    ],
    PHONES: [
      '1234567890',
      '0000000000',
      '1111111111',
      '2222222222',
      '3333333333',
      '4444444444',
      '5555555555',
      '6666666666',
      '7777777777',
      '8888888888',
      '9999999999'
    ]
  },

  // Messages
  MESSAGES: {
    SUCCESS: {
      KEYWORD_ADDED: 'Keyword added successfully',
      KEYWORD_REMOVED: 'Keyword removed',
      SETTINGS_SAVED: 'Settings saved successfully',
      EXPORT_SUCCESS: 'Exported successfully',
      AUTH_SUCCESS: 'Connected to Google successfully',
      CONNECTION_SUCCESS: 'Connection successful!',
      DATA_CLEARED: 'All data cleared'
    },
    ERROR: {
      EMPTY_KEYWORD: 'Please enter a keyword',
      DUPLICATE_KEYWORD: 'Keyword already exists',
      AUTH_FAILED: 'Authentication failed',
      CONNECTION_FAILED: 'Connection failed',
      EXPORT_FAILED: 'Export failed',
      NO_AUTH: 'Not authenticated. Please connect your Google account.',
      NO_SHEET: 'No sheet ID configured.',
      INVALID_SHEET: 'Sheet not found. Please check the Sheet ID.',
      RATE_LIMIT: 'Rate limit exceeded. Please try again later.'
    },
    INFO: {
      NO_KEYWORDS: 'No keywords added yet. Add keywords to start finding leads.',
      NO_LEADS: 'No new leads to export',
      SCANNING: 'Scanning LinkedIn posts...',
      EXPORTING: 'Exporting to Google Sheets...',
      AUTHENTICATING: 'Authenticating...',
      TESTING: 'Testing connection...'
    }
  },

  // Debug
  DEBUG: false, // Set to true for verbose logging

  // LinkedIn URL
  LINKEDIN_URL: 'https://www.linkedin.com/'
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
