# LinkedIn Lead Finder - Chrome Extension

## Overview for AI Assistants

This document provides a comprehensive guide to the LinkedIn Lead Finder Chrome extension codebase. It's designed to help AI assistants understand the project structure, development conventions, and key implementation details.

## Project Status

**Status**: ✅ Fully Functional Chrome Extension
**Version**: 1.0.0
**Manifest Version**: V3
**Total Lines of Code**: ~3,500

### Implemented Features

✅ **Core Functionality**
- Keyword-based post scanning on LinkedIn
- Email and phone number extraction
- Google Sheets export integration
- Real-time post monitoring with MutationObserver
- Visual feedback (post highlighting, badges, stats counter)
- Chrome storage for keywords, settings, and leads

✅ **Advanced Features** (Recently Added)
- **AI-Powered Lead Relevance Filtering**: Uses OpenRouter API to assess if leads match company profile
- **AI Keyword Generation**: Automatically generates search keywords based on company profile
- **Automated Search**: Cycles through keywords automatically, navigating LinkedIn search
- **Auto-scroll and scan**: Scrolls through search results to find more leads
- **Post expansion**: Automatically expands truncated LinkedIn posts before extraction

✅ **UI Features**
- Multi-tab popup interface (Keywords, Google Sheets, Statistics, Settings, AI Features)
- Real-time statistics dashboard
- Connection status indicators
- Settings with multiple scan modes and options

## Architecture

### Directory Structure

```
lli/
├── manifest.json              # Extension manifest (OAuth config, permissions)
├── popup/
│   ├── popup.html            # Popup UI with tab interface
│   ├── popup.css             # Styling for popup
│   └── popup.js              # Popup controller (~950 lines)
├── content/
│   ├── content.js            # LinkedIn scanner (~880 lines)
│   └── content.css           # Visual feedback styles
├── background/
│   ├── background.js         # Service worker (~380 lines)
│   └── storage.js            # Storage management utilities
├── utils/
│   ├── extractor.js          # Email/phone extraction (~150 lines)
│   ├── matcher.js            # Keyword matching (~100 lines)
│   └── googleSheets.js       # Google Sheets API integration (~500 lines)
├── config/
│   └── constants.js          # Configuration constants
├── icons/                     # Extension icons (16x16, 48x48, 128x128)
├── test-utils.html           # Standalone utility tester
├── icon-generator.html       # Icon generator tool
├── README.md                 # User documentation
├── SETUP_GUIDE.md           # Setup instructions
└── NEXT_STEPS.md            # Getting started guide
```

## Key Files and Responsibilities

### 1. manifest.json
**Purpose**: Extension configuration and permissions
**Key Details**:
- OAuth 2.0 client ID for Google Sheets API
- Host permissions: LinkedIn, Google Sheets API, OpenRouter AI
- Content scripts inject on all LinkedIn pages
- Service worker: `background/background.js`

**Important**: When modifying permissions or host_permissions, extension must be reloaded.

### 2. content/content.js - LinkedInScanner Class
**Purpose**: Main content script that scans LinkedIn posts
**Key Responsibilities**:
- Initialize and configure scanner with keywords and settings
- Monitor DOM for new posts using MutationObserver
- Extract post data (content, author, URL)
- Match keywords using KeywordMatcher
- Extract contacts using ContactExtractor
- AI relevance filtering (if enabled)
- Visual feedback (highlighting, badges)
- Auto-search functionality (navigate to keywords, scroll, scan)

**Important Methods**:
- `init()`: Initialize scanner and load config
- `scanPost(postElement)`: Scan a single post for matches
- `expandPostContent(postElement)`: Click "see more" buttons to expand truncated posts
- `extractPostData(postElement)`: Extract content, author, URL from post
- `evaluateLeadWithAI(lead)`: Send lead to AI for relevance check
- `processAutoSearchState()`: Handle automated search cycling
- `navigateToKeyword(keyword)`: Navigate to LinkedIn search for keyword

**State Management**:
- `scannedPosts`: Set of post IDs already scanned (prevents duplicates)
- `leads`: Array of found leads
- `stats`: Stats object (totalLeads, emailsFound, phonesFound)

**LinkedIn DOM Selectors**:
The extension uses multiple selectors as fallbacks since LinkedIn frequently changes their HTML structure. See `collectPostElements()` for the full list.

**Convention**: Always use multiple selector fallbacks when querying LinkedIn DOM elements.

### 3. popup/popup.js - PopupController Class
**Purpose**: Manages popup UI and user interactions
**Key Responsibilities**:
- Render and manage 5 tabs: Keywords, Google Sheets, Statistics, Settings, AI Features
- Load/save keywords and settings to Chrome storage
- Handle Google authentication flow
- Display real-time statistics
- Configure AI features (relevance filtering, keyword generation)
- Trigger auto-search

**Important Methods**:
- `init()`: Initialize popup, load data, setup listeners
- `addKeyword()`: Add keyword to list
- `removeKeyword(index)`: Remove keyword
- `handleAuth()`: Authenticate with Google OAuth
- `testConnection()`: Test Google Sheets connection
- `exportNow()`: Manually trigger export
- `generateKeywords()`: Call AI to generate keywords
- `enableAutoSearch()`: Start automated search

**Storage Keys**:
- `chrome.storage.sync`: keywords, settings (synced across devices)
- `chrome.storage.local`: leads, stats, googleToken, sheetId (local only)

### 4. background/background.js - Service Worker
**Purpose**: Handle background tasks and API calls
**Key Responsibilities**:
- Google OAuth token management
- Google Sheets API calls (export, test connection)
- OpenRouter AI API calls (relevance filtering, keyword generation)
- Lead queue management
- Auto-export functionality

**Message Types** (listen for these from content/popup):
- `NEW_LEAD`: New lead found, potentially auto-export
- `AUTHENTICATE_GOOGLE`: Trigger OAuth flow
- `TEST_SHEET_CONNECTION`: Test Sheets connection
- `EXPORT_NOW`: Export all pending leads
- `ASSESS_LEAD_RELEVANCE`: Send lead to AI for filtering
- `GENERATE_KEYWORDS`: Generate keywords with AI

**API Integrations**:
- Google Sheets API v4 (via googleSheets.js)
- OpenRouter API (for AI features)

### 5. utils/extractor.js - ContactExtractor Class
**Purpose**: Extract emails and phone numbers from text
**Methods**:
- `extractEmails(text)`: Returns array of emails
- `extractPhones(text)`: Returns array of phone numbers
- `extractAll(text)`: Returns `{emails: [], phones: []}`

**Regex Patterns**:
- Email: `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
- Phone (multiple patterns for US and international formats)

**Filtering**: Includes blacklists for common false positives (e.g., example.com, 1234567890)

### 6. utils/matcher.js - KeywordMatcher Class
**Purpose**: Match keywords against text
**Options**:
- `caseSensitive`: Match exact case
- `wholeWord`: Match complete words only

**Method**:
- `match(text)`: Returns `{matched: boolean, keywords: []}`

### 7. utils/googleSheets.js - GoogleSheetsService Class
**Purpose**: Google Sheets API integration
**Methods**:
- `setAuth(token)`: Set OAuth token
- `testConnection(sheetId)`: Test if sheet is accessible
- `getSheetInfo(sheetId)`: Get sheet metadata
- `appendLeads(sheetId, leads)`: Append leads to sheet
- `ensureHeaders(sheetId)`: Ensure headers exist in sheet

**Sheet Format**:
```
| Timestamp | Post URL | Author | Keywords Matched | Post Content | Emails | Phone Numbers | Status |
```

## Data Models

### Lead Object
```javascript
{
  id: "unique-post-id",
  timestamp: "2024-01-15T10:30:00Z",
  postUrl: "https://linkedin.com/posts/...",
  authorName: "John Doe",
  authorProfile: "https://linkedin.com/in/johndoe",
  keywordMatched: ["hiring", "developer"],
  postContent: "Full post text...",
  emails: ["john@example.com"],
  phones: ["+1-234-567-8900"],
  exported: false,
  aiDecision: {
    relevant: true,
    reason: "Matches company profile",
    score: 0.85
  }
}
```

### Settings Object
```javascript
{
  caseSensitive: false,
  wholeWord: false,
  autoSync: true,
  scanMode: 'auto',  // 'auto' or 'manual'
  enableNotifications: true,
  highlightPosts: true,
  scanComments: false,
  scanIntervalMs: 15000,
  autoSearchEnabled: false,
  autoSearchDelay: 20000,
  autoScrollEnabled: true,
  autoScrollCycles: 6,
  autoScrollDelay: 1500,
  aiRelevanceEnabled: false,
  companyProfile: '',
  openRouterModel: 'openrouter/openai/gpt-4o-mini'
}
```

## Development Workflows

### Adding a New Feature

1. **Plan the feature**: Understand what needs to be changed in which files
2. **Update manifest.json**: Add any new permissions or host_permissions
3. **Implement in appropriate file**:
   - Content script logic → `content/content.js`
   - UI/popup logic → `popup/popup.js` + `popup/popup.html`
   - Background processing → `background/background.js`
   - Utility functions → `utils/*.js`
4. **Update settings**: If new setting, add to `getDefaultSettings()` in both content.js and popup.js
5. **Update UI**: Add controls to popup.html if needed
6. **Test**: Load unpacked extension, test on LinkedIn
7. **Update documentation**: Update README.md if user-facing

### Testing the Extension

**Manual Testing**:
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `lli` directory
5. Navigate to LinkedIn and test functionality

**Utility Testing**:
- Open `test-utils.html` in browser to test extraction and matching utilities standalone

**Debugging**:
- Content script: Press F12 on LinkedIn page
- Popup: Right-click extension icon → "Inspect popup"
- Background: Go to `chrome://extensions/` → "Inspect views: service worker"

### Common Tasks

**Adding a keyword**:
1. User types keyword in popup
2. `popup.js` adds to `keywords` array
3. Save to `chrome.storage.sync`
4. Storage listener in `content.js` updates matcher
5. Scanner rescans visible posts

**Finding a lead**:
1. Content script detects new post (MutationObserver)
2. Expand post content if truncated
3. Extract post data (content, author, URL)
4. Match keywords
5. If matched: extract contacts
6. If AI enabled: assess relevance
7. If relevant: save lead, highlight post, update stats
8. If auto-sync: background exports to Sheets

**Exporting to Sheets**:
1. User clicks "Export Now" or auto-export triggers
2. Message sent to background: `EXPORT_NOW`
3. Background retrieves leads from storage
4. Authenticates with Google OAuth
5. Calls `googleSheets.appendLeads()`
6. Marks leads as exported
7. Updates stats

## AI Features (OpenRouter Integration)

### AI Lead Relevance Filtering

**How it works**:
1. User enables "AI Relevance Filtering" in AI Features tab
2. User provides company profile (what kind of leads they want)
3. When lead is found, send to OpenRouter API via background script
4. AI evaluates if lead matches profile
5. If not relevant, lead is discarded (not saved or exported)

**API Endpoint**: `https://openrouter.ai/api/v1/chat/completions`

**Prompt Template** (in background.js):
```
You are a lead qualification assistant. Determine if this LinkedIn post is relevant...
Company Profile: [user's profile]
Post Content: [post text]
Return: {relevant: boolean, reason: string, score: number}
```

**Models**: Free models from OpenRouter (46 available, see popup.js)

### AI Keyword Generation

**How it works**:
1. User clicks "Generate Keywords" in AI Features tab
2. Sends company profile to OpenRouter API
3. AI generates 10-15 relevant search keywords
4. Keywords automatically added to keyword list
5. If auto-search enabled, starts searching immediately

**Convention**: AI features should gracefully degrade if API unavailable (default to relevant=true)

## Key Conventions for AI Assistants

### Code Style
- Use ES6+ JavaScript (classes, async/await, arrow functions)
- Use descriptive variable names
- Add comments for complex logic
- Use `console.log()` for debugging (visible in respective contexts)

### Chrome Extension Patterns
- **Message Passing**: Use `chrome.runtime.sendMessage()` for content ↔ background communication
- **Storage**: Use `chrome.storage.sync` for settings, `chrome.storage.local` for data
- **Storage Listeners**: Listen for changes with `chrome.storage.onChanged`
- **OAuth**: Use `chrome.identity.launchWebAuthFlow()` for Google OAuth
- **Permissions**: Always check if new APIs require additional permissions

### LinkedIn DOM Handling
- **Always use multiple selectors**: LinkedIn changes DOM frequently
- **Normalize elements**: Use `closest()` to find parent post element
- **Check visibility**: Use `offsetParent !== null` before clicking buttons
- **Debounce**: Don't scan the same post twice (use `scannedPosts` Set)
- **Expand content**: Always try to expand "see more" before extraction

### Error Handling
- Wrap async operations in try-catch
- Log errors with context: `console.error('Error scanning post:', error)`
- Fail gracefully: If one post fails, continue with others
- Provide user feedback: Use notifications or status messages

### Storage Management
- **Sync storage limits**: Max 100KB (use for keywords, settings)
- **Local storage limits**: Max 10MB (use for leads, cache)
- **Clear old data**: Provide "Clear All Data" option
- **Batch operations**: Don't save on every change, batch when possible

### API Rate Limiting
- **Google Sheets**: 100 requests per 100 seconds
- **OpenRouter**: Varies by model and plan
- **Implement delays**: Wait between batch operations
- **Queue management**: Queue leads, export in batches

### Security Considerations
- **No sensitive data in code**: OAuth client ID is public, but token stored securely
- **Sanitize inputs**: Validate user inputs (keywords, sheet IDs)
- **CSP compliance**: No inline scripts, use external files
- **LinkedIn ToS**: Respect rate limits, don't spam

## Recent Development History

Based on recent commits:

1. **e52d0d3**: Fix to trigger auto search immediately after AI keyword generation
2. **de37229**: Added AI auto-search trigger and keyword generator
3. **cf6289c**: Added automatic post expansion before scanning
4. **efd5541**: Auto-populated free OpenRouter models in dropdown
5. **b80c032**: Expanded OpenRouter model options
6. **0d9c7ae**: Added automated LinkedIn search and AI relevance filtering

**Development Trend**: Focus on AI-powered automation and improved content extraction

## Important Files for Quick Reference

| File | Lines | Key Responsibility |
|------|-------|-------------------|
| `content/content.js` | ~880 | LinkedIn scanning, DOM interaction |
| `popup/popup.js` | ~950 | UI management, user interactions |
| `utils/googleSheets.js` | ~500 | Google Sheets API integration |
| `background/background.js` | ~380 | Service worker, API orchestration |
| `utils/extractor.js` | ~150 | Email/phone extraction |
| `utils/matcher.js` | ~100 | Keyword matching |
| `config/constants.js` | ~187 | Configuration constants |

## Testing Checklist

When making changes, test these flows:

- [ ] Add/remove keywords in popup
- [ ] Keywords sync to content script
- [ ] Posts are scanned and highlighted
- [ ] Emails and phones are extracted correctly
- [ ] Google authentication works
- [ ] Google Sheets export works
- [ ] Statistics update in real-time
- [ ] Settings persist across sessions
- [ ] Auto-search navigates through keywords
- [ ] AI relevance filtering works (if enabled)
- [ ] AI keyword generation works
- [ ] Extension works after browser restart

## Troubleshooting Common Issues

### Extension not loading
- Check manifest.json syntax (valid JSON)
- Check for console errors in background service worker
- Verify all files are present

### Posts not being scanned
- Check if keywords are added
- Check scan mode is set to "auto"
- Check LinkedIn selectors (may need update if LinkedIn changes)
- Refresh LinkedIn page after changing settings

### Google Sheets not working
- Verify OAuth client ID in manifest.json
- Check redirect URI matches extension ID
- Test connection in popup
- Check Google Sheets API is enabled in Google Cloud Console

### AI features not working
- Check OpenRouter API is accessible
- Verify model ID is valid
- Check network tab for API errors
- Ensure API key (if needed) is configured

## Future Enhancement Ideas

Based on current architecture, these would be natural next steps:

- [ ] Support for other data sources (Twitter, Facebook)
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Custom field mapping for Google Sheets
- [ ] Lead scoring based on multiple criteria
- [ ] Email templates for outreach
- [ ] Analytics dashboard
- [ ] Team collaboration features
- [ ] Export to CSV/Excel
- [ ] Scheduled scanning
- [ ] Webhook notifications

## Important Notes for AI Development

1. **Always test changes in a live Chrome extension environment** - Don't assume code will work
2. **LinkedIn's DOM is fragile** - Use multiple fallback selectors
3. **Respect rate limits** - Batch operations, add delays
4. **Maintain backward compatibility** - Settings should have defaults
5. **User privacy** - No data sent to third parties except Google Sheets and OpenRouter
6. **Error recovery** - If one feature breaks, others should continue working
7. **Documentation** - Update README.md for user-facing changes
8. **Chrome APIs change** - Test on latest Chrome version

## Resources

- [Chrome Extensions Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [OpenRouter API](https://openrouter.ai/docs)
- [MutationObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)

## Contact & Support

For issues or questions about the codebase:
- Check browser console for error messages
- Review recent commits for context
- Test in isolated environment (test-utils.html)
- Verify Chrome extension fundamentals first

---

**Last Updated**: 2025-11-17
**Current Branch**: `claude/claude-md-mi3a47bh6emkt243-01TAopG7dvkaQd15vzBB3NvN`
**Status**: Production-ready, actively maintained
