# MongoDB Atlas Cloud Setup Guide

## Overview

This guide walks you through setting up MongoDB Atlas (cloud database) for the VerifAI Attendance System. MongoDB Atlas provides a free tier (M0) with 512MB storage, perfect for development and small deployments.

---

## Step 1: Create MongoDB Atlas Account

1. **Navigate to MongoDB Atlas**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Or use: https://account.mongodb.com/account/register

2. **Sign Up**
   - Enter your email address
   - Create a strong password
   - Fill in required details (name, company, etc.)
   - Click "Sign Up"

3. **Verify Email**
   - Check your inbox for verification email
   - Click the verification link
   - This activates your account

4. **Complete Profile (Optional)**
   - Choose your experience level
   - Select your goal (e.g., "Learn MongoDB")
   - Choose preferred language (JavaScript/Node.js)

---

## Step 2: Create a Free Cluster

1. **Start Cluster Creation**
   - After login, you'll see "Build a Database" button
   - Click "Build a Database"

2. **Select Deployment Type**
   - Choose **"Shared"** (Free tier)
   - Click on **"M0 FREE"** option
   - Features:
     - 512 MB storage
     - Shared RAM
     - No credit card required
     - Perfect for development

3. **Choose Cloud Provider & Region**
   - **Provider**: AWS, Google Cloud, or Azure (any works)
   - **Region**: Choose closest to your location for better latency
     - Example: `ap-south-1` for India
     - Example: `us-east-1` for US East Coast
     - Example: `eu-west-1` for Europe
   - **Note**: Free tier is available in most regions

4. **Cluster Name**
   - Default: `Cluster0`
   - You can rename it to something meaningful like `VerifAI-Cluster`
   - Or keep the default

5. **Additional Settings**
   - MongoDB Version: Leave default (latest stable)
   - Backup: Not available in M0 free tier
   - Click **"Create Deployment"** or **"Create"**

6. **Wait for Cluster Deployment**
   - Takes 3-5 minutes to provision
   - You'll see a progress indicator
   - Status will change from "Creating" to "Active"

---

## Step 3: Create Database User

**Important**: This is NOT your Atlas account login. This is a separate database user for your application.

1. **Navigate to Database Access**
   - On left sidebar, click **"Database Access"** under "Security"

2. **Add New Database User**
   - Click **"+ ADD NEW DATABASE USER"** button

3. **Authentication Method**
   - Select **"Password"** (default)

4. **User Credentials**
   - **Username**: `verifai` (or any username you prefer)
   - **Password**: Click "Autogenerate Secure Password" or create your own
     - **IMPORTANT**: Copy and save this password securely!
     - You'll need it for the connection string
   - Example password: `vamsi123` (use something stronger in production)

5. **Database User Privileges**
   - Select **"Built-in Role"**
   - Choose one of:
     - **"Read and write to any database"** (Recommended for development)
     - **"Atlas admin"** (Full access, good for testing)
   - For production, create specific privileges

6. **Restrict Access (Optional)**
   - "Restrict Access to Specific Clusters/Federated Database Instances"
   - Leave default (all clusters) for now

7. **Temporary User (Optional)**
   - Set expiration date if needed
   - Leave blank for permanent user

8. **Save**
   - Click **"Add User"**
   - User will be created in a few seconds

---

## Step 4: Configure Network Access (IP Whitelist)

MongoDB Atlas requires you to whitelist IP addresses that can connect to your database.

1. **Navigate to Network Access**
   - On left sidebar, click **"Network Access"** under "Security"

2. **Add IP Address**
   - Click **"+ ADD IP ADDRESS"** button

3. **Choose IP Whitelist Option**

   **Option A: Allow Access from Anywhere (Development)**
   - Click **"ALLOW ACCESS FROM ANYWHERE"**
   - IP: `0.0.0.0/0`
   - **Warning**: This allows any IP to connect (not recommended for production)
   - **Use Case**: Development, testing, or if you have dynamic IP
   - Click **"Confirm"**

   **Option B: Add Current IP Address (Recommended for Local Dev)**
   - Click **"ADD CURRENT IP ADDRESS"**
   - Your IP will be auto-detected
   - Give it a description (e.g., "Home Network")
   - Click **"Confirm"**
   - **Note**: If your IP changes (e.g., different WiFi), you'll need to add the new IP

   **Option C: Add Specific IP Address**
   - Enter IP address manually
   - Format: `192.168.1.100/32` (single IP) or `192.168.1.0/24` (range)
   - Add description
   - Click **"Confirm"**

4. **Wait for Activation**
   - Status will change from "Pending" to "Active"
   - Takes ~30 seconds

---

## Step 5: Get Connection String

1. **Navigate to Database**
   - Click **"Database"** on left sidebar (home icon)
   - You'll see your cluster listed

2. **Connect to Your Cluster**
   - Click **"Connect"** button on your cluster

3. **Choose Connection Method**
   - Click **"Connect your application"**
   - (Other options: Compass GUI, MongoDB Shell, etc.)

4. **Select Driver and Version**
   - **Driver**: Node.js
   - **Version**: 4.1 or later (or select latest)

5. **Copy Connection String**
   - You'll see a connection string like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Click the **Copy** button

6. **Understand the Connection String Parts**
   ```
   mongodb+srv://verifai:<password>@cluster0.hvdfdgh.mongodb.net/?appName=Cluster0
   ```
   - `mongodb+srv://` - Protocol (SRV for automatic replica set discovery)
   - `verifai` - Your database username (from Step 3)
   - `<password>` - **REPLACE THIS** with your actual password
   - `cluster0.hvdfdgh.mongodb.net` - Your cluster hostname
   - `?retryWrites=true&w=majority` - Connection options

---

## Step 6: Configure Your Application

### 6.1 For VerifAI Server

1. **Navigate to Server Directory**
   ```bash
   cd c:\Users\anemv\Documents\face-recognition\server
   ```

2. **Open `.env` File**
   - Use any text editor (VS Code, Notepad++, etc.)

3. **Update MONGO_URI**
   - Find the line: `MONGO_URI=...`
   - Replace with your connection string
   - **IMPORTANT**: Replace `<password>` with your actual database user password
   - Add database name after the hostname

   **Example**:
   ```env
   # Before (template from Atlas)
   MONGO_URI=mongodb+srv://verifai:<password>@cluster0.hvdfdgh.mongodb.net/?retryWrites=true&w=majority

   # After (with actual password and database name)
   MONGO_URI=mongodb+srv://verifai:vamsi123@cluster0.hvdfdgh.mongodb.net/verifai?retryWrites=true&w=majority
   ```

   **Important Notes**:
   - Remove the angle brackets `< >` around the password
   - Add database name `/verifai` before the `?` query parameters
   - No spaces or line breaks in the connection string

4. **Handle Special Characters in Password**
   
   If your password contains special characters like `@`, `:`, `/`, `?`, `#`, `%`, `[`, `]`, etc., you must URL-encode them:

   | Character | URL Encoded |
   |-----------|-------------|
   | `@`       | `%40`       |
   | `:`       | `%3A`       |
   | `/`       | `%2F`       |
   | `?`       | `%3F`       |
   | `#`       | `%23`       |
   | `%`       | `%25`       |
   | `[`       | `%5B`       |
   | `]`       | `%5D`       |

   **Example**:
   ```env
   # If password is: MyPass@123!
   # Encoded password: MyPass%40123%21
   MONGO_URI=mongodb+srv://verifai:MyPass%40123%21@cluster0.hvdfdgh.mongodb.net/verifai?retryWrites=true&w=majority
   ```

   **Quick Encoding in Node.js**:
   ```javascript
   const password = "MyPass@123!";
   const encoded = encodeURIComponent(password);
   console.log(encoded); // MyPass%40123%21
   ```

5. **Save the `.env` File**

---

## Step 7: Test Connection

1. **Start Your Server**
   ```bash
   cd server
   npm run dev
   ```

2. **Look for Success Message**
   ```
   ✅ MongoDB Connected: cluster0.hvdfdgh.mongodb.net
   🚀 Server running on port 5000
   📊 Environment: development
   ```

3. **If You See Errors**

   **Error: `MongoServerError: bad auth : authentication failed`**
   - ❌ Wrong username or password
   - ❌ Password not URL-encoded properly
   - ✅ Double-check database user credentials
   - ✅ Ensure no `< >` brackets in password
   - ✅ Verify user has correct privileges

   **Error: `MongoServerError: IP address not whitelisted`**
   - ❌ Your IP is not in Network Access list
   - ✅ Add your current IP in Atlas Network Access
   - ✅ Or use "Allow access from anywhere" for development

   **Error: `MongooseServerSelectionError: connect ECONNREFUSED`**
   - ❌ Connection string is incorrect
   - ❌ Network connectivity issues
   - ✅ Verify connection string format
   - ✅ Check internet connection
   - ✅ Ensure cluster is running (not paused)

   **Error: `Invalid connection string`**
   - ❌ Malformed URI
   - ✅ Ensure no line breaks or extra spaces
   - ✅ Check for proper encoding of special characters

---

## Step 8: Verify Database in Atlas

1. **Go to Database View**
   - Click "Database" on left sidebar

2. **Browse Collections**
   - Click "Browse Collections" button on your cluster
   - You should see the `verifai` database (will appear after first data insert)

3. **View Collections**
   - After running the app, you'll see collections like:
     - `users`
     - `students`
     - `courses`
     - `faceembeddings`
     - `attendancesessions`
     - `attendancerecords`

4. **Explore Documents**
   - Click on any collection to view documents
   - You can manually edit/delete documents here

---

## Step 9: Create Admin User

After successful connection, create your first admin user:

1. **Run Create Admin Script**
   ```bash
   cd server
   npm run create-admin
   ```

2. **Or Create Manually via MongoDB Atlas**
   - Go to "Database" → "Browse Collections"
   - Select `verifai` database
   - Click on `users` collection
   - Click "INSERT DOCUMENT"
   - Paste this (modify as needed):
   ```json
   {
     "name": "Admin User",
     "email": "admin@verifai.com",
     "passwordHash": "$2b$10$...",
     "role": "ADMIN",
     "createdAt": {"$date": "2026-01-23T00:00:00.000Z"},
     "updatedAt": {"$date": "2026-01-23T00:00:00.000Z"}
   }
   ```
   - **Note**: For passwordHash, you'll need to hash the password first
   - Easier to use the script method

---

## Step 10: MongoDB Atlas Best Practices

### Security
- ✅ Use strong passwords for database users
- ✅ Create users with least privileges needed
- ✅ Restrict IP access (avoid 0.0.0.0/0 in production)
- ✅ Enable audit logs (paid tiers)
- ✅ Regular password rotation

### Performance
- ✅ Create indexes for frequently queried fields
- ✅ Monitor query performance in Atlas UI
- ✅ Use connection pooling (Mongoose default)
- ✅ Enable retryable writes (already in connection string)

### Monitoring
- ✅ Set up alerts for:
   - High CPU usage
   - Storage approaching limit
   - Connection spikes
- ✅ Check "Metrics" tab regularly
- ✅ Review "Performance Advisor" recommendations

### Backup (Paid Tiers)
- ✅ Enable automated backups
- ✅ Test restore procedures
- ✅ Set retention policies

### Cost Management
- ✅ M0 tier is always free (512MB limit)
- ✅ Monitor storage usage in "Metrics"
- ✅ Set up billing alerts
- ✅ Consider M2/M5 for production (paid)

---

## Troubleshooting

### Issue: "Cluster Paused" Message

**Cause**: Free tier clusters pause after 60 days of inactivity

**Solution**:
1. Go to "Database" view in Atlas
2. Click "Resume" button on cluster
3. Wait for cluster to activate (~2 minutes)

### Issue: Connection Timeout

**Possible Causes**:
- Firewall blocking outbound connections
- VPN interfering with connection
- TLS/SSL certificate issues

**Solutions**:
1. Try with VPN disabled
2. Check corporate firewall settings
3. Use `retryWrites=true` in connection string (already included)

### Issue: "Too Many Connections"

**Cause**: Default Mongoose connection pool can cause issues with M0 tier (10 connection limit)

**Solution**: Add connection options in database configuration
```javascript
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 5,
  minPoolSize: 1
});
```

### Issue: Storage Limit Reached (512MB on M0)

**Solutions**:
1. Delete old/unnecessary data
2. Archive old attendance records
3. Upgrade to M2 tier (2GB, $9/month)

---

## Atlas UI Overview

### Key Features

**1. Metrics Tab**
- Real-time cluster performance
- CPU, memory, storage usage
- Query performance stats

**2. Performance Advisor**
- Suggests indexes based on query patterns
- Identifies slow queries

**3. Alerts**
- Set up email/SMS notifications
- Triggers: high CPU, low storage, etc.

**4. Data Explorer**
- Browse and edit documents
- Create indexes
- Aggregation pipeline builder

**5. Charts (Free)**
- Create data visualizations
- Embed in dashboards
- Connect to BI tools

---

## Migration from Local to Atlas

If you were using local MongoDB and want to migrate to Atlas:

### Option 1: Export/Import via mongodump/mongorestore

```bash
# Export from local
mongodump --db verifai --out ./backup

# Import to Atlas
mongorestore --uri "mongodb+srv://verifai:password@cluster0.xxx.mongodb.net/verifai" ./backup/verifai
```

### Option 2: Atlas Live Migration Service

1. In Atlas, go to "Cluster" → "..." → "Migrate Data to this Cluster"
2. Enter source MongoDB connection string
3. Atlas will handle the migration
4. Minimal downtime

---

## Useful Atlas Resources

- **Atlas Documentation**: https://www.mongodb.com/docs/atlas/
- **Connection String Guide**: https://www.mongodb.com/docs/manual/reference/connection-string/
- **Security Checklist**: https://www.mongodb.com/docs/atlas/security-checklist/
- **Free Tier Limits**: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
- **Atlas University** (Free courses): https://university.mongodb.com/

---

## Quick Reference

### Your Connection String Template
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Required Steps Checklist
- [x] Create Atlas account
- [x] Create M0 free cluster
- [x] Create database user (username + password)
- [x] Whitelist IP address (Network Access)
- [x] Get connection string
- [x] Update `.env` file with connection string
- [x] Replace `<password>` with actual password
- [x] Add database name to connection string
- [x] Test connection (`npm run dev`)
- [x] Create admin user (`npm run create-admin`)

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Platform**: MongoDB Atlas (Cloud)  
**Free Tier**: M0 (512MB storage, shared RAM)
