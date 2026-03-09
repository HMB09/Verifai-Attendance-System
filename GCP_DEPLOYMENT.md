# GCP VM Server Deployment Guide (No Docker)

## Prerequisites

1. Google Cloud Platform account with project created
2. Git installed on the GCP VM
3. Node.js 18+ installed on the GCP VM
4. MongoDB Atlas account with connection string

---

## Step 1: Create GCP VM Instance

### Using GCP Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Compute Engine** → **VM Instances**
3. Click **"Create Instance"**

### VM Configuration:

| Setting | Value |
|---------|-------|
| **Name** | `verifai-server` |
| **Region** | Choose closest to your users (e.g., `us-central1`) |
| **Zone** | Auto or `us-central1-a` |
| **Machine Type** | `e2-medium` (1 vCPU, 4GB RAM) |
| **Boot Disk** | Ubuntu 22.04 LTS, 20GB |
| **Firewall** | ✅ Allow HTTP, ✅ Allow HTTPS |

4. Click **"Create"**

---

## Step 2: Connect to VM via SSH

1. In GCP Console, click **SSH** button next to your instance
2. Once connected, you'll see a terminal

---

## Step 3: Install Prerequisites on VM

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
git --version
```

---

## Step 4: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/sushmithainjeti/Verifai-Attendance-System.git

# Navigate to server directory
cd Verifai-Attendance-System/server
```

---

## Step 5: Setup Environment Variables

```bash
# Create .env file
nano .env
```

**Paste the following and update with your values:**
```env
# MongoDB Connection
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/verifai?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AES Encryption Key (256-bit, base64 encoded)
EMBEDDING_AES_KEY=iqjWEDwwf1iIglV+lrlySVLIPXy9kusaz3mHD/q4K0I=

# Server Configuration
PORT=5000
NODE_ENV=production

# Face Recognition Threshold
FACE_RECOGNITION_THRESHOLD=0.6
```

**To save in nano:**
1. Press `Ctrl + X`
2. Press `Y`
3. Press `Enter`

---

## Step 6: Install Dependencies

```bash
npm install
```

---

## Step 7: Create Admin User

```bash
npm run create-admin
```

This will create the default admin:
- Email: `admin@verifai.com`
- Password: `admin123`

---

## Step 8: Start the Server

### Option A: Temporary (for testing)
```bash
npm start
```

Your server will run at `http://your-vm-ip:5000`

**Get your VM's external IP:**
- Go to GCP Console → Compute Engine → VM Instances
- Copy the **External IP** (e.g., 35.192.123.45)

### Option B: Permanent (using PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server with PM2
pm2 start npm --name "verifai-server" -- start

# Setup startup script
pm2 startup
pm2 save

# View logs
pm2 logs verifai-server
```

---

## Step 9: Configure Firewall & Port Security

```bash
# Allow port 5000 through VM firewall
sudo ufw allow 5000
```

Or in GCP Console:
1. Go to **VPC Network** → **Firewall Rules**
2. Create new rule allowing traffic on port 5000

---

## Step 10: Update Vercel Environment Variable

Once your server is running:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_BASE_URL`:
   ```
   VITE_API_BASE_URL = http://your-vm-external-ip:5000/api/v1
   ```
   Example: `http://35.192.123.45:5000/api/v1`

5. Redeploy the Vercel project (or it will auto-deploy on next git push)

---

## Step 11: Enable HTTPS (Optional but Recommended)

### Using Let's Encrypt with Nginx:

```bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

**Replace content with:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## Updating Server Code

When you push updates to GitHub:

```bash
cd ~/Verifai-Attendance-System/server

# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Restart server
pm2 restart verifai-server
```

Or create a auto-update script and cron job for automatic deployments.

---

## Troubleshooting

### Server won't start?
```bash
# Check for port conflicts
sudo lsof -i :5000

# Check error logs
pm2 logs verifai-server
```

### MongoDB connection fails?
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 or your VM's IP)

### Can't connect from Vercel?
- Verify GCP firewall allows port 5000
- Check if server is running: `pm2 status`
- Test locally: `curl http://your-vm-ip:5000/api/v1/health` (if health endpoint exists)

### CORS errors in Vercel?
- Verify backend CORS middleware is configured in `src/index.js`
- Add Vercel domain to allowed origins
