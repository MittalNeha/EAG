# Quick Setup Guide

## Step 1: Google Cloud Console Setup (5 minutes)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create/Select Project**
   - Click "Select a project" → "New Project"
   - Name: "Email Categorizer Extension"
   - Click "Create"

3. **Enable Gmail API**
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Chrome extension"
   - Name: "Email Categorizer"
   - Click "Create"

5. **Get Your Client ID**
   - Copy the Client ID (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - Open `manifest.json` in this folder
   - Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID

## Step 2: Install Extension (2 minutes)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Turn on "Developer mode" (top right toggle)

2. **Load Extension**
   - Click "Load unpacked"
   - Navigate to this folder: `C:\Work\EAG\Session 1\email-categorizer-extension`
   - Click "Select Folder"

3. **Pin Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Email Categorizer & Daily Report"
   - Click the pin icon to keep it visible

## Step 3: First Use (1 minute)

1. **Click Extension Icon**
   - Click the extension icon in Chrome toolbar

2. **Authenticate**
   - Click "Fetch Today's Emails"
   - Sign in with your Google account
   - Grant permissions when prompted

3. **View Results**
   - See categorized email counts
   - Click categories to view details
   - Check the daily report

## What the Extension Does

### Categories Your Emails Into:
- **Account Maintenance** (passwords, security, billing)
- **Newsletters** (marketing, blogs, promotions)  
- **Trip Planning** (flights, hotels, travel)
- **Redundant Info** (bank debits, investments)

### Features:
- ✅ Processes only today's emails
- ✅ Caches results locally (no repeated API calls)
- ✅ Auto-refreshes every hour
- ✅ Clickable categories for details
- ✅ Daily report with summaries
- ✅ Free Gmail API usage

## Troubleshooting

**"No access token available"**
- Make sure you replaced the Client ID in manifest.json
- Try clicking "Fetch Today's Emails" again

**"Gmail API error: 403"**
- Check that Gmail API is enabled in Google Cloud Console
- Verify OAuth credentials are set up correctly

**Extension won't load**
- Make sure all files are in the correct folder
- Check that manifest.json has valid JSON syntax

## Next Steps

Once working, you can:
- Customize categorization rules in `background.js`
- Add new email categories
- Modify the UI in `popup.html` and `popup.css`
- Add more sophisticated AI summarization

The extension is designed to be privacy-focused - all data stays on your device!



