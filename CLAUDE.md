# LinkedIn Lead Finder - Chrome Extension Plan

## Project Overview
A Chrome extension that monitors LinkedIn posts for specific keywords, extracts email addresses and phone numbers, and automatically exports the data to a Google Sheet.

## Architecture

### 1. Extension Structure
```
linkedin-lead-finder/
├── manifest.json                 # Extension configuration
├── popup/
│   ├── popup.html               # Extension popup UI
│   ├── popup.css                # Popup styling
│   └── popup.js                 # Popup logic
├── content/
│   ├── content.js               # Content script (runs on LinkedIn pages)
│   └── content.css              # Optional styling for overlays
├── background/
│   ├── background.js            # Service worker for API calls
│   └── storage.js               # Data management
├── utils/
│   ├── extractor.js             # Email/phone extraction logic
│   ├── matcher.js               # Keyword matching logic
│   └── googleSheets.js          # Google Sheets API integration
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── config/
    └── constants.js             # Configuration constants
```

## Core Features

### 2. Manifest Configuration (manifest.json)
- **Manifest Version**: V3
- **Permissions**:
  - `activeTab` - Access current tab
  - `storage` - Store keywords and settings
  - `identity` - Google OAuth
  - `scripting` - Inject content scripts
- **Host Permissions**:
  - `https://www.linkedin.com/*`
  - `https://sheets.googleapis.com/*`
- **Content Scripts**: Auto-inject on LinkedIn pages
- **Background Service Worker**: Handle API calls and data processing

### 3. Popup Interface (popup.html + popup.js)

#### Features:
1. **Keyword Management**
   - Add/remove keywords
   - Display list of active keywords
   - Import/export keyword lists
   - Case-sensitive toggle

2. **Google Sheets Configuration**
   - Google account authentication
   - Sheet selection dropdown
   - Test connection button
   - Auto-sync toggle

3. **Statistics Dashboard**
   - Total leads found
   - Emails extracted
   - Phone numbers extracted
   - Last sync time

4. **Settings**
   - Scan interval (real-time vs manual)
   - Auto-export toggle
   - Notification preferences
   - Data retention settings

### 4. Content Script (content.js)

#### Responsibilities:
1. **Page Monitoring**
   - Detect LinkedIn feed posts
   - Monitor for new posts (infinite scroll)
   - Handle dynamic content loading

2. **Post Scanning**
   - Extract post text content
   - Match against keyword list
   - Identify post author
   - Extract post URL and timestamp

3. **Contact Extraction**
   - Scan post text for emails (regex)
   - Scan post text for phone numbers (regex)
   - Scan comments if available
   - Extract from "Contact Info" sections

4. **Visual Feedback**
   - Highlight matched posts
   - Show badge/icon on matched posts
   - Display extraction status

#### Implementation Details:
```javascript
// Example structure
class LinkedInScanner {
  constructor(keywords) {
    this.keywords = keywords;
    this.observer = null;
    this.scannedPosts = new Set();
  }

  init() {
    // Start MutationObserver
    // Scan existing posts
    // Listen for new posts
  }

  scanPost(postElement) {
    // Extract post data
    // Check keywords
    // Extract contacts
    // Send to background script
  }
}
```

### 5. Background Service Worker (background.js)

#### Responsibilities:
1. **Message Handling**
   - Receive extracted data from content script
   - Process and validate data
   - Manage data queue

2. **Storage Management**
   - Store leads in Chrome storage
   - Prevent duplicates
   - Manage cache

3. **Google Sheets Integration**
   - Authenticate with Google
   - Batch write to sheets
   - Handle API rate limits
   - Retry failed requests

4. **Notifications**
   - Alert user of new leads
   - Report export status
   - Error notifications

### 6. Data Extraction (extractor.js)

#### Email Extraction:
```javascript
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
```

#### Phone Number Extraction:
```javascript
// Multiple formats support
const phoneRegexes = [
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,  // US format
  /\+?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,     // International
];
```

#### Data Validation:
- Verify email format
- Validate phone number length
- Remove false positives
- Check against blacklist

### 7. Keyword Matching (matcher.js)

#### Features:
- Case-sensitive/insensitive matching
- Whole word matching
- Partial matching support
- Multiple keyword OR logic
- Keyword grouping (AND logic)
- Regex pattern support

#### Example:
```javascript
function matchKeywords(text, keywords, options) {
  const { caseSensitive, wholeWord } = options;

  return keywords.some(keyword => {
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();

    if (wholeWord) {
      const regex = new RegExp(`\\b${searchKeyword}\\b`, 'g');
      return regex.test(searchText);
    }

    return searchText.includes(searchKeyword);
  });
}
```

### 8. Google Sheets Integration (googleSheets.js)

#### Setup:
1. **Google Cloud Console**
   - Create project
   - Enable Google Sheets API
   - Create OAuth 2.0 credentials
   - Set redirect URI: `https://<extension-id>.chromiumapp.org/`

2. **Authentication Flow**
   - Use Chrome Identity API
   - Get OAuth token
   - Store token securely
   - Handle token refresh

#### Sheet Structure:
```
| Timestamp | Post URL | Author | Keyword Matched | Post Content | Email | Phone | Status |
|-----------|----------|--------|-----------------|--------------|-------|-------|--------|
```

#### API Operations:
```javascript
class GoogleSheetsService {
  async authenticate() {
    // OAuth flow
  }

  async appendRows(data) {
    // Batch append to sheet
    // Handle rate limits
  }

  async checkDuplicates(email) {
    // Query existing data
  }
}
```

### 9. Data Model

#### Lead Object:
```javascript
{
  id: "unique-id",
  timestamp: "2024-01-15T10:30:00Z",
  postUrl: "https://linkedin.com/posts/...",
  authorName: "John Doe",
  authorProfile: "https://linkedin.com/in/johndoe",
  keywordMatched: ["hiring", "developer"],
  postContent: "Full post text...",
  email: "john@example.com",
  phone: "+1-234-567-8900",
  exported: true,
  exportedAt: "2024-01-15T10:31:00Z"
}
```

### 10. Storage Strategy

#### Chrome Storage Sync:
- Keywords list
- Settings/preferences
- Google Sheet ID
- Max 100KB

#### Chrome Storage Local:
- Leads data (cached)
- Export queue
- Session data
- Max 10MB (can request unlimited)

#### IndexedDB (optional):
- Large datasets
- Full lead history
- Offline support

## Implementation Phases

### Phase 1: Basic Extension Setup (Week 1)
- [ ] Create manifest.json with basic permissions
- [ ] Build popup UI with keyword input
- [ ] Implement keyword storage
- [ ] Create basic content script
- [ ] Scan visible posts for keywords

### Phase 2: Content Extraction (Week 1-2)
- [ ] Implement email extraction
- [ ] Implement phone number extraction
- [ ] Build data validation
- [ ] Add duplicate detection
- [ ] Test extraction accuracy

### Phase 3: Google Sheets Integration (Week 2)
- [ ] Set up Google Cloud project
- [ ] Implement OAuth authentication
- [ ] Build Sheets API service
- [ ] Test data export
- [ ] Handle API errors and rate limits

### Phase 4: Advanced Features (Week 3)
- [ ] Add MutationObserver for infinite scroll
- [ ] Implement visual feedback on posts
- [ ] Add statistics dashboard
- [ ] Build notification system
- [ ] Create export queue management

### Phase 5: Polish & Testing (Week 3-4)
- [ ] Error handling and recovery
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] User acceptance testing
- [ ] Documentation

## Technical Considerations

### Security:
- Store OAuth tokens securely
- Sanitize extracted data
- Validate all inputs
- Use HTTPS for all API calls
- Implement CSP in manifest

### Performance:
- Debounce scroll events
- Batch API requests
- Use efficient DOM queries
- Lazy load components
- Limit cache size

### Privacy:
- Clear data disclosure
- User consent for data export
- Option to clear data
- Comply with LinkedIn ToS
- No data sent to third parties (except Google Sheets)

### Rate Limiting:
- LinkedIn scraping limits
- Google Sheets API quota (100 requests/100 seconds)
- Implement exponential backoff
- Queue management

### Error Handling:
- Network failures
- LinkedIn page structure changes
- Google Sheets API errors
- Storage quota exceeded
- Invalid credentials

## Dependencies

### Required:
- Chrome Extensions API (built-in)
- Google Sheets API v4
- No external libraries (vanilla JS preferred)

### Optional:
- jQuery (if needed for DOM manipulation)
- Papa Parse (CSV export fallback)
- Luxon (date/time handling)

## Testing Strategy

### Unit Tests:
- Email/phone extraction functions
- Keyword matching logic
- Data validation

### Integration Tests:
- Content script ↔ Background script communication
- Google Sheets API integration
- Storage operations

### Manual Testing:
- Different LinkedIn page layouts
- Various post formats
- Edge cases (special characters, multiple emails, etc.)
- Performance with large datasets

## Deployment

### Chrome Web Store:
1. Create developer account ($5 fee)
2. Prepare assets (screenshots, description)
3. Submit for review
4. Address review feedback
5. Publish

### Updates:
- Version management
- Changelog
- User notifications
- Backward compatibility

## Potential Challenges

1. **LinkedIn DOM Changes**: LinkedIn frequently updates their UI
   - Solution: Use flexible selectors, implement fallbacks

2. **Rate Limiting**: Too many requests to Google Sheets
   - Solution: Batch operations, implement queue

3. **False Positives**: Extracting incorrect emails/phones
   - Solution: Strict regex, validation, manual review option

4. **Privacy Concerns**: Scraping user data
   - Solution: Clear ToS, user consent, ethical usage guidelines

5. **Content Script Performance**: Heavy DOM monitoring
   - Solution: Debouncing, efficient observers, lazy loading

## Future Enhancements

- Export to multiple destinations (CSV, Airtable, CRM)
- AI-powered lead qualification
- Advanced filtering (job titles, locations)
- Bulk operations
- Team collaboration features
- Analytics and reporting
- Custom field mapping
- Webhook support
- Browser extension for Firefox/Edge

## Success Metrics

- Extraction accuracy (>95%)
- Performance (scan without lag)
- Export reliability (>99%)
- User retention
- Positive reviews

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [LinkedIn Developer Policies](https://www.linkedin.com/legal/l/api/li-api-terms-of-use)

---

## Notes

- Always respect LinkedIn's Terms of Service
- Consider rate limiting to avoid detection
- Provide clear value to users
- Focus on ethical use cases
- Build with privacy in mind
