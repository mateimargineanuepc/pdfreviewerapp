# Firebase Storage Setup Guide

This guide explains how to set up Firebase Storage for the PDF Review Application.

## Prerequisites

1. A Firebase project (create one at [Firebase Console](https://console.firebase.google.com/))
2. Firebase Storage enabled in your Firebase project
3. A Service Account Key (JSON file) downloaded from Firebase

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Firebase Storage

1. In your Firebase project, go to **Storage** in the left sidebar
2. Click "Get started"
3. Choose "Start in test mode" (for development) or set up security rules
4. Select a location for your storage bucket
5. Click "Done"

## Step 3: Get Service Account Key

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to the **Service Accounts** tab
3. Click "Generate new private key"
4. Download the JSON file (this is your service account key)
5. **Important**: Keep this file secure and never commit it to version control

## Step 4: Configure Environment Variables

You have two options for providing the service account:

### Option 1: JSON String (Recommended for deployment)

Add the entire JSON content as a single-line string to your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

### Option 2: File Path (Recommended for local development)

1. Place the service account JSON file in a secure location (e.g., `server/config/firebase-service-account.json`)
2. Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Note**: Make sure to add the service account file to `.gitignore`!

## Step 5: Upload PDF Files

1. In Firebase Console, go to **Storage**
2. Click "Upload file"
3. Upload your PDF files (up to 30 files as per requirements)
4. Note the file names - you'll need them for the API

## Step 6: Verify Setup

Once configured, the following endpoints will be available:

- `GET /api/files` - List all PDF files (requires authentication)
- `GET /api/files/:filename` - Get signed URL for a specific PDF (requires authentication)

## Security Notes

- Service account keys have full access to your Firebase project
- Never commit service account keys to version control
- Use environment variables for production deployments
- Signed URLs expire after 1 hour for security
- All file endpoints require JWT authentication

## Troubleshooting

### Error: "Firebase service account not configured"
- Make sure `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_PATH` is set in `.env`
- Verify the JSON format is correct

### Error: "File not found"
- Check that the file exists in Firebase Storage
- Verify the filename matches exactly (case-sensitive)
- Ensure the file has been uploaded to the storage bucket

### Error: "Permission denied"
- Verify your service account has Storage Admin permissions
- Check Firebase Storage security rules

