# Setup Scripts

## MongoDB Auto-Setup

Automatically checks if MongoDB is installed and installs it if not found.

### Windows (PowerShell)

**Option 1: Using npm script (recommended)**
```powershell
cd server
npm run setup-mongodb
```

**Option 2: Direct PowerShell**
```powershell
cd server
powershell -ExecutionPolicy Bypass -File scripts/setupMongoDB.ps1
```

**Option 3: Run as Administrator**
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to server directory
4. Run: `.\scripts\setupMongoDB.ps1`

### Linux/Mac (Bash)

```bash
cd server
sudo bash scripts/setupMongoDB.sh
```

## What the Script Does

1. ✅ Checks if MongoDB is already installed
2. ✅ Checks if MongoDB service is running
3. ✅ Downloads MongoDB installer (if not installed)
4. ✅ Installs MongoDB silently
5. ✅ Configures MongoDB as a Windows service
6. ✅ Starts the MongoDB service
7. ✅ Tests the connection

## Requirements

- **Windows**: Administrator privileges
- **Linux/Mac**: Root/sudo access
- Internet connection (for download)

## Troubleshooting

### "Execution Policy" Error (Windows)
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Installation Fails
- Check internet connection
- Ensure you have Administrator/root privileges
- Try manual installation from: https://www.mongodb.com/try/download/community

### Service Won't Start
- Check Windows Services (services.msc) for MongoDB
- Check if port 27017 is already in use
- Review MongoDB logs in: `C:\Program Files\MongoDB\Server\*\log\`
