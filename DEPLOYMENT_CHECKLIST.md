# Deployment Checklist - Vercel + GCP VM

## 🔄 Deployment Overview

```
GitHub Repository (Main Source)
    ↓
Vercel Client (Auto-deploys on git push)
    ↓
GCP VM Server (Manual git pull & restart)
```

---

## ✅ Client Deployment - Vercel

### Quick Steps:
- [ ] Make sure code is pushed to GitHub
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New Project"
- [ ] Import: `https://github.com/sushmithainjeti/Verifai-Attendance-System`
- [ ] Set Root Directory: `server/client`
- [ ] Deploy
- [ ] **Copy your Vercel URL** (e.g., `https://verifai-client.vercel.app`)

### Environment Variables (After Backend is Ready):
- [ ] In Vercel → Settings → Environment Variables
- [ ] Add: `VITE_API_BASE_URL = http://YOUR_GCP_VM_IP:5000/api/v1`

---

## ✅ Server Deployment - GCP VM

### Phase 1: GCP VM Setup (15 minutes)

- [ ] Create GCP account at [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create new project
- [ ] Go to Compute Engine → VM Instances
- [ ] Create Instance:
  - Name: `verifai-server`
  - Machine: `e2-medium`
  - OS: `Ubuntu 22.04 LTS`
  - Boot Disk: 20GB
  - Enable: HTTP, HTTPS
- [ ] Click SSH to connect

### Phase 2: Install Tools (5 minutes)

In SSH terminal:
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### Phase 3: Deploy Application (5 minutes)

```bash
cd ~
git clone https://github.com/sushmithainjeti/Verifai-Attendance-System.git
cd Verifai-Attendance-System/server
```

- [ ] Create `.env` file with:
  - [ ] `MONGO_URI` (from MongoDB Atlas)
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `EMBEDDING_AES_KEY` (generated)
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`

```bash
npm install
npm run create-admin
```

### Phase 4: Run Server (Choose One)

**Temporary (Testing):**
```bash
npm start
```

**Permanent (Production - Using PM2):**
```bash
sudo npm install -g pm2
pm2 start npm --name "verifai-server" -- start
pm2 startup
pm2 save
```

- [ ] **Copy your VM's External IP** from GCP Console
  - Example format: `35.192.123.45`

---

## 🔗 Connect Both Deployments

### After Both Are Running:

1. **Update Vercel with Backend URL:**
   - Go to Vercel Dashboard → Your Project
   - Settings → Environment Variables
   - Update `VITE_API_BASE_URL = http://YOUR_GCP_VM_IP:5000/api/v1`
   - Redeploy (Trigger a Vercel build)

2. **Test Connection:**
   - Open your Vercel URL
   - Try logging in with: `admin@verifai.com` / `admin123`
   - Should connect to backend on GCP VM

---

## 📝 Important Values to Save

After deployments, save these:

```
GCP VM External IP: ________________
Backend URL: http://________________:5000/api/v1
Vercel Client URL: https://________________.vercel.app
MongoDB URI: mongodb+srv://...
JWT Secret: ________________________
```

---

## 🔄 Updating Code After Deployment

### Update Client (Automatic):
```bash
# Just push to GitHub
git add .
git commit -m "Latest changes"
git push origin main
# Vercel auto-deploys in 2-3 minutes
```

### Update Server (Manual):
```bash
# SSH to GCP VM
cd ~/Verifai-Attendance-System/server
git pull origin main
npm install  # if new dependencies added
pm2 restart verifai-server  # or manually restart
```

---

## 📚 Detailed Guides

- For detailed Vercel setup → See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- For detailed GCP setup → See [GCP_DEPLOYMENT.md](GCP_DEPLOYMENT.md)

---

## ⚠️ Common Issues & Solutions

### "Cannot reach backend from Vercel"
- [ ] Verify GCP firewall allows port 5000
- [ ] Check server is running: `pm2 status`
- [ ] Verify `VITE_API_BASE_URL` uses correct IP
- [ ] Check CORS is enabled in backend

### "MongoDB connection fails"
- [ ] Test connection string is correct
- [ ] In MongoDB Atlas → Network Access → Whitelist VM IP (or 0.0.0.0/0)
- [ ] Check `.env` MONGO_URI is correct

### "Server won't start"
- [ ] Check port 5000 is available: `sudo lsof -i :5000`
- [ ] View logs: `pm2 logs verifai-server`
- [ ] Verify Node.js version: `node --version` (should be 18+)

---

## 🎯 Final Checklist

- [ ] Client deployed on Vercel
- [ ] Server deployed on GCP VM
- [ ] VITE_API_BASE_URL updated in Vercel
- [ ] Can login with `admin@verifai.com` from Vercel URL
- [ ] Face registration works end-to-end
- [ ] Attendance tracking works end-to-end
