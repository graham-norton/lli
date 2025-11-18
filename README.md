# LinkedIn Lead Finder - Chrome Extension

A powerful Chrome extension that automatically finds LinkedIn posts matching your keywords, extracts contact information (emails and phone numbers), and exports them to Google Sheets.

## 🚀 NEW: Intelligent Co-Pilot Mode

Transform your LinkedIn into an intelligent lead extraction system! The Co-Pilot automatically analyzes any LinkedIn page and extracts leads based on your goals.

### 6 Extraction Goals:
- **📋 Job Applicants** - Extract applicant profiles and download resumes from your job postings
- **💬 Comment Mining** - Mine emails and contacts from post comments
- **❤️ Post Engagement** - Find people who liked/commented on relevant posts
- **👥 People Discovery** - Extract profiles from search results matching your criteria
- **🏢 Company Intel** - Gather employee lists and identify decision makers
- **🔍 Keyword Hunting** - Enhanced keyword-based extraction with AI

**[📖 Read the Complete Co-Pilot Guide →](CO_PILOT_GUIDE.md)**

### Quick Start with Co-Pilot:
1. Click extension icon → Go to **Co-Pilot** tab
2. Click **🔍 Analyze Page** to see what can be extracted
3. Select a goal card (e.g., "💬 Comment Mining")
4. Click **🚀 Start Co-Pilot** and watch it work!

---

## Features

- **Keyword Matching**: Monitor LinkedIn feed for posts containing specific keywords
- **Contact Extraction**: Automatically extract emails and phone numbers from posts
- **Google Sheets Integration**: Export leads directly to Google Sheets
- **Real-time Scanning**: Monitor posts as you scroll through your LinkedIn feed
- **Visual Feedback**: Highlight matched posts with badges showing contact info
- **Statistics Dashboard**: Track total leads, emails, and phone numbers found
- **Auto-sync**: Automatically export new leads to Google Sheets
- **Customizable Settings**: Configure scanning behavior, notifications, and more

## Installation

### Prerequisites

1. Google Chrome browser (version 88 or higher)
2. A Google account
3. A Google Sheet to export data to

### Step 1: Download the Extension

1. Clone or download this repository
2. Extract the files to a folder on your computer

### Step 2: Create Google Cloud Project

To use the Google Sheets integration, you need to set up a Google Cloud project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Chrome Extension" as application type
   - Add your extension ID (you'll get this after loading the extension)
   - Click "Create"

5. Copy the **Client ID** - you'll need this in the next step

### Step 3: Configure the Extension

1. Open the `manifest.json` file in a text editor
2. Find the `oauth2` section
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID from Google Cloud Console

```json
"oauth2": {
  "client_id": "YOUR_ACTUAL_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
}
```

### Step 4: Add Icons (Optional but Recommended)

The extension needs icons in the `icons` folder:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can create simple icons using online tools like:
- [Favicon.io](https://favicon.io/)
- [Canva](https://www.canva.com/)

Or use placeholder icons for testing.

### Step 5: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the folder containing the extension files
5. The extension should now appear in your extensions list

### Step 6: Get Extension ID and Update OAuth

1. After loading the extension, you'll see an Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz`)
2. Go back to Google Cloud Console > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add to "Authorized redirect URIs":
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   (Replace `YOUR_EXTENSION_ID` with your actual extension ID)

## Usage

### 1. Configure Keywords

1. Click the extension icon in Chrome toolbar
2. Go to the **Keywords** tab
3. Add keywords you want to monitor (e.g., "hiring", "looking for", "need developer")
4. Configure matching options:
   - **Case sensitive**: Match exact case
   - **Whole word only**: Match complete words only

### 2. Connect Google Sheets

1. Go to the **Google Sheets** tab
2. Click **Connect Google Account**
3. Authorize the extension to access your Google Sheets
4. Create a new Google Sheet or use an existing one
5. Copy the Sheet URL or ID and paste it in the extension
6. Click **Save** and then **Test Connection** to verify

### 3. Start Scanning

1. Navigate to [LinkedIn](https://www.linkedin.com/feed/)
2. The extension will automatically start scanning posts
3. Matched posts will be highlighted with badges
4. Contact information will be extracted automatically

### 4. View Statistics

1. Click the extension icon
2. Go to the **Statistics** tab
3. View:
   - Total leads found
   - Emails extracted
   - Phone numbers extracted
   - Export status

### 5. Export to Google Sheets

**Auto-export** (recommended):
- Enable "Auto-sync to Google Sheets" in the Google Sheets tab
- Leads will be exported automatically as they're found

**Manual export**:
- Go to the Statistics tab
- Click **Export Now**

## Google Sheets Format

Exported data will be organized in the following columns:

| Timestamp | Post URL | Author | Keywords Matched | Post Content | Emails | Phone Numbers | Status |
|-----------|----------|--------|------------------|--------------|--------|---------------|--------|

## Settings

Configure the extension behavior in the **Settings** tab:

- **Scan Mode**:
  - Automatic (Real-time): Scan posts as you scroll
  - Manual: Only scan when triggered manually

- **Enable notifications**: Get browser notifications for new leads
- **Highlight matched posts**: Visual indication on LinkedIn feed
- **Scan comments**: Also search for contacts in post comments

## Privacy & Ethics

### Important Notes

- This extension is for **legitimate business use only**
- Always comply with LinkedIn's Terms of Service
- Respect user privacy and data protection regulations (GDPR, CCPA, etc.)
- Only use for authorized lead generation activities
- Do not spam or harass contacts found through this tool

### Data Storage

- Keywords and settings are stored locally in Chrome sync storage
- Leads are stored locally in Chrome local storage
- Data is only sent to your personal Google Sheet
- No data is sent to third-party servers

### LinkedIn Terms of Service

Be aware that automated scraping may violate LinkedIn's Terms of Service. Use this tool responsibly and at your own risk.

## Troubleshooting

### Extension Not Scanning

- Make sure you've added keywords in the Keywords tab
- Check that Scan Mode is set to "Automatic"
- Refresh the LinkedIn page after changing settings
- Check browser console for errors (F12 > Console)

### Google Sheets Not Working

- Verify you're authenticated (green indicator in Google Sheets tab)
- Test the connection using "Test Connection" button
- Make sure the Sheet ID is correct
- Check that your Google account has edit access to the sheet
- Verify OAuth credentials in manifest.json

### No Contact Information Found

- Contacts are only extracted if they're publicly visible in posts
- Not all posts contain email addresses or phone numbers
- Check that extraction is working by viewing the browser console

### Authentication Errors

- Clear the stored token: Go to Statistics tab > Clear All Data
- Reconnect your Google account
- Verify OAuth client ID in manifest.json
- Check that redirect URI is correctly configured in Google Cloud Console

## Development

### Project Structure

```
linkedin-lead-finder/
├── manifest.json           # Extension configuration
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styling
│   └── popup.js           # Popup logic
├── content/
│   ├── content.js         # LinkedIn page scanner
│   └── content.css        # Visual feedback styles
├── background/
│   ├── background.js      # Service worker
│   └── storage.js         # Storage management
├── utils/
│   ├── extractor.js       # Email/phone extraction
│   ├── matcher.js         # Keyword matching
│   └── googleSheets.js    # Google Sheets API
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Technologies Used

- **Chrome Extensions Manifest V3**
- **Google Sheets API v4**
- **Chrome Identity API** (for OAuth)
- **Chrome Storage API**
- **MutationObserver API** (for real-time scanning)
- **Vanilla JavaScript** (no external dependencies)

### Testing

1. Load the extension in Chrome developer mode
2. Navigate to LinkedIn and scroll through feed
3. Check browser console for logs
4. Verify data appears in Google Sheets

### Debugging

Enable extension debugging:
1. Go to `chrome://extensions/`
2. Find "LinkedIn Lead Finder"
3. Click "Inspect views: service worker" for background script
4. Right-click extension icon > "Inspect popup" for popup debugging
5. Press F12 on LinkedIn page to debug content script

## Limitations

- **LinkedIn Rate Limiting**: LinkedIn may rate-limit requests if too many actions are performed
- **Google Sheets API Quota**: 100 requests per 100 seconds per user
- **Content Script Compatibility**: LinkedIn frequently updates their UI, which may break selectors
- **Contact Extraction Accuracy**: Depends on content format and visibility

## Future Enhancements

- [ ] Export to CSV, Airtable, or CRM systems
- [ ] AI-powered lead qualification
- [ ] Advanced filtering (job titles, locations, company size)
- [ ] Bulk operations and lead management
- [ ] Team collaboration features
- [ ] Analytics and reporting dashboard
- [ ] Custom field mapping
- [ ] Webhook support
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is provided as-is for educational and personal use.

## Disclaimer

This extension is not affiliated with, endorsed by, or sponsored by LinkedIn Corporation. Use at your own risk and ensure compliance with LinkedIn's Terms of Service and applicable laws.

## Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Made with ❤️ for efficient lead generation**
