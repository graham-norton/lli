# Quick Setup Guide - LinkedIn Lead Finder

Follow these steps to get your LinkedIn Lead Finder extension up and running in about 15 minutes.

## Part 1: Google Cloud Setup (5 minutes)

### 1. Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**
3. Enter project name: "LinkedIn Lead Finder"
4. Click **Create**

### 2. Enable Google Sheets API

1. In the search bar, type "Google Sheets API"
2. Click on "Google Sheets API"
3. Click **Enable**

### 3. Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: "LinkedIn Lead Finder"
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Skip Scopes
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Chrome Extension**
   - Name: "LinkedIn Lead Finder"
   - Click **Create**

5. **SAVE YOUR CLIENT ID** - it looks like:
   ```
   123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```

## Part 2: Extension Setup (5 minutes)

### 1. Download Extension Files

Make sure you have all the extension files in a folder.

### 2. Configure manifest.json

1. Open `manifest.json` in a text editor
2. Find line with `"client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"`
3. Replace with your actual Client ID from step above
4. Save the file

### 3. Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **Developer mode** ON (top-right)
4. Click **Load unpacked**
5. Select the folder with your extension files
6. Extension should now be loaded

### 4. Update OAuth with Extension ID

1. After loading, you'll see an **Extension ID** like: `abcdefghijklmnop`
2. Go back to Google Cloud Console > Credentials
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", click **+ ADD URI**
5. Enter: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
   (Replace `YOUR_EXTENSION_ID` with the actual ID from step 1)
6. Click **Save**

## Part 3: Google Sheets Setup (3 minutes)

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click **+ Blank** to create new sheet
3. Name it "LinkedIn Leads"
4. Copy the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
   The SHEET_ID is the long string between `/d/` and `/edit`

### 2. Connect Extension to Sheet

1. Click the extension icon in Chrome toolbar
2. Go to **Google Sheets** tab
3. Click **Connect Google Account**
4. Sign in and authorize the extension
5. Paste your Sheet ID in the input field
6. Click **Save**
7. Click **Test Connection** - should show success

## Part 4: Start Using (2 minutes)

### 1. Add Keywords

1. Click extension icon
2. Go to **Keywords** tab
3. Add keywords like:
   - "hiring"
   - "looking for"
   - "need developer"
   - "open position"
4. Click **Add** for each keyword

### 2. Configure Settings

1. Go to **Settings** tab
2. Make sure "Automatic (Real-time)" is selected
3. Enable "Auto-sync to Google Sheets"
4. Enable other options as desired

### 3. Start Scanning

1. Go to [LinkedIn](https://www.linkedin.com/feed/)
2. Scroll through your feed
3. Watch for highlighted posts with badges
4. Check your Google Sheet - data should appear automatically!

## Troubleshooting

### "Authentication failed"

- Check that Client ID is correct in manifest.json
- Verify redirect URI is added in Google Cloud Console
- Try removing and re-adding extension

### "Sheet not found"

- Verify Sheet ID is correct
- Make sure you have edit access to the sheet
- Check that Google Sheets API is enabled

### "No posts being scanned"

- Make sure you added keywords
- Check that Scan Mode is "Automatic"
- Refresh the LinkedIn page
- Check browser console (F12) for errors

### "Extension not appearing"

- Make sure all files are in the folder
- Check for errors in `chrome://extensions/`
- Verify manifest.json syntax is correct

## Icon Setup (Optional)

The extension needs icons but can work without them. To add icons:

1. Create 3 PNG images:
   - icon16.png (16x16 pixels)
   - icon48.png (48x48 pixels)
   - icon128.png (128x128 pixels)

2. Save them in the `icons/` folder

3. Use online tools:
   - [Favicon.io](https://favicon.io/) - Free icon generator
   - [Canva](https://www.canva.com/) - Design custom icons

## Quick Test

1. Go to LinkedIn
2. Look for a post with words like "hiring" or "email"
3. If the post contains an email, it should:
   - Get highlighted with a blue border
   - Show a badge with matched keywords
   - Appear in your Google Sheet

## Next Steps

- Fine-tune your keywords
- Check Statistics tab for metrics
- Customize settings to your preference
- Export data regularly

## Support

If you encounter issues:
1. Check browser console for errors (F12 > Console)
2. Check extension service worker logs (chrome://extensions/ > Inspect views)
3. Verify all setup steps were completed
4. Refer to README.md for detailed documentation

---

Happy lead hunting! 🎯
