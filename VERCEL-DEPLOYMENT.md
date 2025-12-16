# Vercel Deployment Guide

## Framework Preset Selection

When deploying to Vercel, select **"Vite"** as the Framework Preset.

## Quick Setup Steps

1. **Install Vercel CLI** (optional, for local testing):
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - **Framework Preset**: Select **"Vite"**
   - **Root Directory**: Set to **`client`** (this is where your frontend code is)
   - **Build Command**: `npm run build` (will run automatically from `client/` directory)
   - **Output Directory**: `dist` (relative to `client/` directory)
   - **Install Command**: `npm install` (will run automatically from `client/` directory)

3. **Environment Variables** (if needed for frontend):
   - Add any frontend environment variables in Vercel dashboard
   - Prefix with `VITE_` for Vite to expose them (e.g., `VITE_API_URL`)

## Important Notes

### Backend Deployment

⚠️ **Vercel is primarily for frontend deployment**. Your Express.js backend needs to be deployed separately:

**Recommended Backend Hosting Options:**
1. **Railway** - Easy Node.js deployment
2. **Render** - Free tier available
3. **Heroku** - Traditional option
4. **VPS** (Hetzner, DigitalOcean) - As per your deployment guide

### Configuration

The `vercel.json` file in the root directory configures:
- Build settings for the Vite frontend
- API rewrites (update `your-backend-url.com` with your actual backend URL)
- Security headers

### Update API URLs

After deploying the backend, update the API base URL in:
- `client/src/api-services/api.js`
- Or use environment variables: `VITE_API_URL`

Example:
```javascript
// client/src/api-services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Backend URL updated in frontend code or environment variables
- [ ] CORS configured on backend to allow Vercel domain
- [ ] Environment variables set in Vercel dashboard
- [ ] Build command and output directory configured correctly
- [ ] Test the deployed application

## Troubleshooting

### Build Fails
- Check that `client/package.json` has correct build script
- Verify Node.js version (Vercel uses Node 18+ by default)

### API Calls Fail
- Verify backend URL is correct
- Check CORS settings on backend
- Ensure backend is accessible from the internet

### PDF Worker Not Loading
- Verify `public/pdf.worker.mjs` is included in build
- Check that worker path is correct in production

