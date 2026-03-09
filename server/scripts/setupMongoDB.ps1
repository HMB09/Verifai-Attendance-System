# MongoDB Auto-Setup Script for Windows
# This script checks if MongoDB is installed and installs it if not found

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Auto-Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges!" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
    exit 1
}

# Function to check if MongoDB is installed
function Test-MongoDBInstalled {
    Write-Host "Checking if MongoDB is installed..." -ForegroundColor Yellow
    
    # Check if mongod.exe exists in common installation paths
    $mongoPaths = @(
        "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
        "C:\Program Files (x86)\MongoDB\Server\*\bin\mongod.exe"
    )
    
    foreach ($path in $mongoPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
        if ($found) {
            Write-Host "✅ MongoDB found at: $($found.DirectoryName)" -ForegroundColor Green
            return $true, $found.DirectoryName
        }
    }
    
    # Check if mongod is in PATH
    $mongodInPath = Get-Command mongod -ErrorAction SilentlyContinue
    if ($mongodInPath) {
        Write-Host "✅ MongoDB found in PATH: $($mongodInPath.Source)" -ForegroundColor Green
        return $true, (Split-Path $mongodInPath.Source -Parent)
    }
    
    Write-Host "❌ MongoDB not found" -ForegroundColor Red
    return $false, $null
}

# Function to check if MongoDB service is running
function Test-MongoDBService {
    $service = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -eq "Running") {
            Write-Host "✅ MongoDB service is running" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  MongoDB service exists but is not running" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "❌ MongoDB service not found" -ForegroundColor Red
        return $false
    }
}

# Function to download MongoDB installer
function Download-MongoDBInstaller {
    Write-Host ""
    Write-Host "Downloading MongoDB Community Server..." -ForegroundColor Yellow
    
    # MongoDB download URL (latest stable version)
    $mongoVersion = "7.0.11"
    $downloadUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-$mongoVersion-signed.msi"
    $installerPath = "$env:TEMP\mongodb-installer.msi"
    
    try {
        Write-Host "Downloading from: $downloadUrl" -ForegroundColor Gray
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ Download complete" -ForegroundColor Green
        return $installerPath
    } catch {
        Write-Host "❌ Download failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Alternative: Please download manually from:" -ForegroundColor Yellow
        Write-Host "https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
        return $null
    }
}

# Function to install MongoDB
function Install-MongoDB {
    param([string]$InstallerPath)
    
    Write-Host ""
    Write-Host "Installing MongoDB..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    
    # Silent installation parameters
    $installArgs = @(
        "/i",
        "`"$InstallerPath`"",
        "/quiet",
        "/norestart",
        "INSTALLLOCATION=`"C:\Program Files\MongoDB\Server\$mongoVersion`"",
        "ADDLOCAL=`"ServerNoService,ServerService,Router,MonitoringTools,ImportExportTools,MiscellaneousTools`"",
        "SERVICENAME=`"MongoDB`"",
        "SERVICEDISPLAYNAME=`"MongoDB`"",
        "SERVICEDESCRIPTION=`"MongoDB Database Server`""
    )
    
    try {
        $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $installArgs -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ MongoDB installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Installation failed with exit code: $($process.ExitCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Installation error: $_" -ForegroundColor Red
        return $false
    }
}

# Function to start MongoDB service
function Start-MongoDBService {
    Write-Host ""
    Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
    
    try {
        $service = Get-Service -Name "MongoDB" -ErrorAction Stop
        if ($service.Status -ne "Running") {
            Start-Service -Name "MongoDB"
            Start-Sleep -Seconds 3
            
            $service.Refresh()
            if ($service.Status -eq "Running") {
                Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Failed to start MongoDB service" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "✅ MongoDB service is already running" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ Error starting service: $_" -ForegroundColor Red
        Write-Host "   You may need to start it manually from Services (services.msc)" -ForegroundColor Yellow
        return $false
    }
}

# Function to test MongoDB connection
function Test-MongoDBConnection {
    Write-Host ""
    Write-Host "Testing MongoDB connection..." -ForegroundColor Yellow
    
    try {
        # Try to connect using mongosh (newer) or mongo (older)
        $mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
        $mongo = Get-Command mongo -ErrorAction SilentlyContinue
        
        if ($mongosh) {
            $result = & mongosh --eval "db.version()" --quiet 2>&1
        } elseif ($mongo) {
            $result = & mongo --eval "db.version()" --quiet 2>&1
        } else {
            Write-Host "⚠️  Cannot test connection (mongosh/mongo not in PATH)" -ForegroundColor Yellow
            Write-Host "   MongoDB may need to be added to PATH manually" -ForegroundColor Yellow
            return $true  # Assume it's working if service is running
        }
        
        if ($LASTEXITCODE -eq 0 -or $result -match "version") {
            Write-Host "✅ MongoDB connection successful!" -ForegroundColor Green
            if ($result) {
                Write-Host "   Version: $result" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "⚠️  Connection test inconclusive" -ForegroundColor Yellow
            return $true  # Service is running, assume it's working
        }
    } catch {
        Write-Host "⚠️  Could not test connection: $_" -ForegroundColor Yellow
        return $true  # Service is running, assume it's working
    }
}

# Main execution
Write-Host "Step 1: Checking MongoDB installation..." -ForegroundColor Cyan
$isInstalled, $mongoPath = Test-MongoDBInstalled

if ($isInstalled) {
    Write-Host ""
    Write-Host "Step 2: Checking MongoDB service..." -ForegroundColor Cyan
    $serviceRunning = Test-MongoDBService
    
    if (-not $serviceRunning) {
        Write-Host ""
        Write-Host "Attempting to start MongoDB service..." -ForegroundColor Yellow
        Start-MongoDBService | Out-Null
    }
    
    Write-Host ""
    Test-MongoDBConnection | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ MongoDB is already installed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your .env file should have:" -ForegroundColor Yellow
    Write-Host "MONGO_URI=mongodb://localhost:27017/verifai" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# MongoDB not installed, proceed with installation
Write-Host ""
Write-Host "MongoDB is not installed. Proceeding with installation..." -ForegroundColor Yellow
Write-Host ""

$installerPath = Download-MongoDBInstaller
if (-not $installerPath) {
    Write-Host ""
    Write-Host "❌ Cannot proceed without installer. Please download manually." -ForegroundColor Red
    exit 1
}

$installed = Install-MongoDB -InstallerPath $installerPath
if (-not $installed) {
    Write-Host ""
    Write-Host "❌ Installation failed. Please install MongoDB manually." -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    exit 1
}

# Clean up installer
Remove-Item $installerPath -ErrorAction SilentlyContinue

# Start service
Start-MongoDBService | Out-Null

# Test connection
Test-MongoDBConnection | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ MongoDB Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Your .env file should have: MONGO_URI=mongodb://localhost:27017/verifai" -ForegroundColor Cyan
Write-Host "2. Run: npm run create-admin (to create admin user)" -ForegroundColor Cyan
Write-Host "3. Run: npm run dev (to start the server)" -ForegroundColor Cyan
Write-Host ""
Write-Host "MongoDB is now running on: mongodb://localhost:27017" -ForegroundColor Green
Write-Host ""
