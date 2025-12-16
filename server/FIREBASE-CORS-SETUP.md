# Firebase Storage CORS Configuration

## Problem
The frontend cannot directly access PDF files from Firebase Storage due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution: Configure CORS on Firebase Storage

### Option 1: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **corectareanastasimatar**
3. Go to **Storage** in the left sidebar
4. Click on the **Rules** tab
5. You'll see the Storage Rules, but CORS is configured differently

### Option 2: Using gsutil (Command Line)

1. Create a CORS configuration file:

Create a file named `cors.json`:

```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:3000", "https://your-production-domain.com"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply CORS configuration:

```bash
gsutil cors set cors.json gs://corectareanastasimatar.firebasestorage.app
```

### Option 3: Using Firebase CLI

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login:
```bash
firebase login
```

3. Create `cors.json` (same as above)

4. Apply:
```bash
gsutil cors set cors.json gs://corectareanastasimatar.firebasestorage.app
```

## Quick Fix: Use Backend Proxy

As an alternative, the backend can proxy PDF files to avoid CORS issues. A proxy endpoint has been added to the backend.

Use the proxy endpoint instead of the signed URL:
- Instead of: Direct signed URL from Firebase
- Use: `GET /api/files/:filename/proxy` (returns PDF as stream)

The frontend will automatically use the proxy if CORS is not configured.

## Testing CORS

After configuring CORS, test by:
1. Opening browser DevTools
2. Going to Network tab
3. Loading a PDF
4. Check if the request succeeds without CORS errors

