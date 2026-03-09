#!/bin/bash
# MongoDB Auto-Setup Script for Linux/Mac
# This script checks if MongoDB is installed and installs it if not found

echo "========================================"
echo "MongoDB Auto-Setup Script"
echo "========================================"
echo ""

# Check if running as root (for Linux) or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "⚠️  This script requires root/sudo privileges!"
   echo "Please run with: sudo bash setupMongoDB.sh"
   exit 1
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
    else
        DISTRO="unknown"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
else
    echo "❌ Unsupported operating system"
    exit 1
fi

# Function to check if MongoDB is installed
check_mongodb_installed() {
    echo "Checking if MongoDB is installed..."
    
    if command -v mongod &> /dev/null; then
        MONGO_VERSION=$(mongod --version | head -n 1)
        echo "✅ MongoDB found: $MONGO_VERSION"
        return 0
    fi
    
    echo "❌ MongoDB not found"
    return 1
}

# Function to check if MongoDB service is running
check_mongodb_service() {
    if [ "$OS" == "linux" ]; then
        if systemctl is-active --quiet mongod 2>/dev/null || systemctl is-active --quiet mongodb 2>/dev/null; then
            echo "✅ MongoDB service is running"
            return 0
        else
            echo "⚠️  MongoDB service is not running"
            return 1
        fi
    elif [ "$OS" == "mac" ]; then
        if brew services list | grep -q "mongodb-community.*started"; then
            echo "✅ MongoDB service is running"
            return 0
        else
            echo "⚠️  MongoDB service is not running"
            return 1
        fi
    fi
}

# Function to install MongoDB on Debian/Ubuntu
install_mongodb_debian() {
    echo ""
    echo "Installing MongoDB on Debian/Ubuntu..."
    
    # Import MongoDB public GPG key
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    
    # Create list file
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    
    # Update and install
    apt-get update
    apt-get install -y mongodb-org
    
    # Start and enable service
    systemctl start mongod
    systemctl enable mongod
    
    echo "✅ MongoDB installed successfully"
}

# Function to install MongoDB on RHEL/CentOS
install_mongodb_redhat() {
    echo ""
    echo "Installing MongoDB on RHEL/CentOS..."
    
    # Create repo file
    cat > /etc/yum.repos.d/mongodb-org-7.0.repo << EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF
    
    # Install
    yum install -y mongodb-org
    
    # Start and enable service
    systemctl start mongod
    systemctl enable mongod
    
    echo "✅ MongoDB installed successfully"
}

# Function to install MongoDB on Mac
install_mongodb_mac() {
    echo ""
    echo "Installing MongoDB on macOS..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is required. Install from: https://brew.sh"
        exit 1
    fi
    
    # Tap MongoDB tap
    brew tap mongodb/brew
    
    # Install MongoDB
    brew install mongodb-community
    
    # Start service
    brew services start mongodb-community
    
    echo "✅ MongoDB installed successfully"
}

# Function to start MongoDB service
start_mongodb_service() {
    echo ""
    echo "Starting MongoDB service..."
    
    if [ "$OS" == "linux" ]; then
        systemctl start mongod 2>/dev/null || systemctl start mongodb
        systemctl enable mongod 2>/dev/null || systemctl enable mongodb
    elif [ "$OS" == "mac" ]; then
        brew services start mongodb-community
    fi
    
    sleep 2
    
    if check_mongodb_service; then
        echo "✅ MongoDB service started"
        return 0
    else
        echo "⚠️  Service may need manual start"
        return 1
    fi
}

# Function to test MongoDB connection
test_mongodb_connection() {
    echo ""
    echo "Testing MongoDB connection..."
    
    if mongosh --eval "db.version()" --quiet 2>/dev/null || mongo --eval "db.version()" --quiet 2>/dev/null; then
        echo "✅ MongoDB connection successful!"
        return 0
    else
        echo "⚠️  Could not test connection, but service appears to be running"
        return 0
    fi
}

# Main execution
echo "Step 1: Checking MongoDB installation..."
if check_mongodb_installed; then
    echo ""
    echo "Step 2: Checking MongoDB service..."
    if ! check_mongodb_service; then
        start_mongodb_service
    fi
    
    test_mongodb_connection
    
    echo ""
    echo "========================================"
    echo "✅ MongoDB is already installed!"
    echo "========================================"
    echo ""
    echo "Your .env file should have:"
    echo "MONGO_URI=mongodb://localhost:27017/verifai"
    echo ""
    exit 0
fi

# MongoDB not installed, proceed with installation
echo ""
echo "MongoDB is not installed. Proceeding with installation..."
echo ""

if [ "$OS" == "linux" ]; then
    if [ "$DISTRO" == "debian" ]; then
        install_mongodb_debian
    elif [ "$DISTRO" == "redhat" ]; then
        install_mongodb_redhat
    else
        echo "❌ Unsupported Linux distribution"
        echo "Please install MongoDB manually: https://www.mongodb.com/docs/manual/installation/"
        exit 1
    fi
elif [ "$OS" == "mac" ]; then
    install_mongodb_mac
fi

# Test connection
test_mongodb_connection

echo ""
echo "========================================"
echo "✅ MongoDB Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Your .env file should have: MONGO_URI=mongodb://localhost:27017/verifai"
echo "2. Run: npm run create-admin (to create admin user)"
echo "3. Run: npm run dev (to start the server)"
echo ""
echo "MongoDB is now running on: mongodb://localhost:27017"
echo ""
