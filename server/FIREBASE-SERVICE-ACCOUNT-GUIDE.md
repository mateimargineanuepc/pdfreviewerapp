# How to Get Firebase Service Account Key

This guide provides detailed step-by-step instructions for obtaining your Firebase Service Account key.

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

1. Open your web browser
2. Navigate to [Firebase Console](https://console.firebase.google.com/)
3. Sign in with your Google account (if not already signed in)

### Step 2: Select Your Project

1. If you have multiple projects, click on your project name: **corectareanastasimatar**
2. If you don't have a project yet, click "Add project" and create one

### Step 3: Open Project Settings

1. Click on the **gear icon (⚙️)** next to "Project Overview" in the left sidebar
2. Select **"Project settings"** from the dropdown menu

### Step 4: Navigate to Service Accounts Tab

1. In the Project settings page, click on the **"Service accounts"** tab at the top
2. You'll see a section titled "Firebase Admin SDK"

### Step 5: Generate New Private Key

1. You'll see a section that says "Node.js" with a code snippet
2. Click the button that says **"Generate new private key"**
3. A dialog will appear warning you about keeping the key secure
4. Click **"Generate key"** to confirm

### Step 6: Download the JSON File

1. A JSON file will automatically download to your computer
2. The file will be named something like: `corectareanastasimatar-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`
3. **IMPORTANT**: Keep this file secure! It contains sensitive credentials.

## Two Ways to Use the Service Account

You have two options for providing the service account to your application:

### Option 1: Use File Path (Recommended for Local Development)

1. **Move the downloaded JSON file** to your server directory:
   ```bash
   # Move the file to server/config/ directory
   mv ~/Downloads/corectareanastasimatar-firebase-adminsdk-*.json server/config/firebase-service-account.json
   ```

2. **Add to your `.env` file**:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   FIREBASE_STORAGE_BUCKET=corectareanastasimatar.firebasestorage.app
   ```

3. **Verify the file is in `.gitignore`** (it should already be there)

### Option 2: Use JSON String (Recommended for Deployment)

1. **Open the downloaded JSON file** in a text editor
2. **Copy the entire contents** of the file
3. **Convert to a single line** (remove all line breaks and extra spaces)
   - You can use an online JSON minifier or just remove line breaks manually
4. **Add to your `.env` file** as a single line:
   ```env
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"corectareanastasimatar",...}'
   FIREBASE_STORAGE_BUCKET=corectareanastasimatar.firebasestorage.app
   ```

   **Note**: Make sure to wrap the entire JSON in single quotes and escape any single quotes inside the JSON.

## Visual Guide

```
Firebase Console
├── Project: corectareanastasimatar
│   └── ⚙️ Project Settings
│       └── Service accounts tab
│           └── Generate new private key
│               └── Download JSON file
```

## What the JSON File Contains

The service account JSON file contains:
- `type`: "service_account"
- `project_id`: Your Firebase project ID
- `private_key_id`: Unique key identifier
- `private_key`: Private key for authentication
- `client_email`: Service account email
- `client_id`: Client identifier
- `auth_uri`: Authentication URI
- `token_uri`: Token URI
- `auth_provider_x509_cert_url`: Certificate URL
- `client_x509_cert_url`: Client certificate URL

## Security Best Practices

1. ✅ **Never commit** the service account JSON file to version control
2. ✅ **Keep it secure** - treat it like a password
3. ✅ **Use environment variables** in production
4. ✅ **Rotate keys** if they're ever exposed
5. ✅ **Limit permissions** - only grant necessary permissions

## Troubleshooting

### "Firebase service account not configured" Error

- Check that `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH` is set in `.env`
- Verify the JSON file path is correct (if using file path option)
- Ensure the JSON content is valid (if using JSON string option)

### "Permission denied" Error

- Verify the service account has Storage Admin permissions
- Check that the storage bucket name is correct
- Ensure Firebase Storage is enabled in your project

### File Not Found Error

- Verify the file path is relative to the server directory
- Check file permissions (should be readable)
- Ensure the file exists at the specified path

## Quick Reference

**File Path Option** (Easier for local development):
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

**JSON String Option** (Better for deployment):
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

Both options require:
```env
FIREBASE_STORAGE_BUCKET=corectareanastasimatar.firebasestorage.app
```

