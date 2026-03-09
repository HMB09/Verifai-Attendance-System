# Vercel Client Deployment Guide

## Step 1: Connect GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your account
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Paste your repository URL: `https://github.com/sushmithainjeti/Verifai-Attendance-System`
5. Click **"Import"**

## Step 2: Configure Project Settings

When Vercel asks for configuration:

| Setting | Value |
|---------|-------|
| **Project Name** | `verifai-client` (or your preferred name) |
| **Root Directory** | `server/client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

## Step 3: Add Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

**Add this variable:**
```
VITE_API_BASE_URL = https://your-gcp-vm-ip:5000/api/v1
```

After deploying your GCP VM (see server deployment guide), replace `your-gcp-vm-ip` with your actual GCP VM public IP.

Example: `VITE_API_BASE_URL = http://35.192.123.45:5000/api/v1`

## Step 4: Deploy

1. Click **"Deploy"** button
2. Vercel will build and deploy automatically
3. Your client will be live at: `https://verifai-client.vercel.app` (or custom domain)

## Automatic Deployments

- Any push to your GitHub repository will trigger automatic deployment
- View deployments in Vercel dashboard
- Rollback to previous versions if needed

---

## Troubleshooting

**Build fails with "dist not found"?**
- Check `npm run build` works locally
- Verify `vite.config.js` is correct

**API calls fail in production?**
- Update `VITE_API_BASE_URL` with correct backend URL
- Ensure backend server has CORS enabled for Vercel domain

**Functions timeout?**
- Vercel has 10s timeout on Pro plan
- Keep API responses under this limit
