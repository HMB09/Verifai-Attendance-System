# VerifAI Attendance System

A web-based attendance system using AI-powered face recognition with encrypted face embeddings for biometric privacy.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (running locally or MongoDB Atlas connection string)
- **npm** or **yarn**

### 1. Clone and Setup

```bash
# Navigate to project directory
cd face-recognition
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env
# On Linux/Mac: cp .env.example .env

# Edit .env file with your configuration:
# - MONGO_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string
# - EMBEDDING_AES_KEY: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Generate AES Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copy the output and paste it as `EMBEDDING_AES_KEY` in your `.env` file.

### 3. Frontend Setup

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install

# Download face-api.js models
# Create a public/models folder and download models from:
# https://github.com/justadudewhohacks/face-api.js-models
# Or use the script below
```

**Download Face-API.js Models:**

You need to download the face-api.js models. Create the models directory and download:

```bash
# From client directory
mkdir -p public/models

# Download models (you can use curl or wget, or download manually)
# Models needed:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
# - face_recognition_model-shard2

# Or download from: https://github.com/justadudewhohacks/face-api.js-models/tree/master/weights
```

**Quick download script (PowerShell):**
```powershell
cd client/public
New-Item -ItemType Directory -Path models -Force
cd models
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/tiny_face_detector_model-weights_manifest.json" -OutFile "tiny_face_detector_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/tiny_face_detector_model-shard1" -OutFile "tiny_face_detector_model-shard1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_landmark_68_model-weights_manifest.json" -OutFile "face_landmark_68_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_landmark_68_model-shard1" -OutFile "face_landmark_68_model-shard1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_recognition_model-weights_manifest.json" -OutFile "face_recognition_model-weights_manifest.json"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_recognition_model-shard1" -OutFile "face_recognition_model-shard1"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/weights/face_recognition_model-shard2" -OutFile "face_recognition_model-shard2"
```

### 4. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:3000`

### 5. Initial Setup (Create Admin User)

You'll need to create an admin user first. You can do this by:

1. **Using MongoDB directly:**
   - Connect to your MongoDB database
   - Insert a user document manually (password will be hashed on first save)

2. **Using a script (recommended):**
   Create `server/scripts/createAdmin.js`:
   ```javascript
   import mongoose from 'mongoose';
   import User from '../src/models/User.model.js';
   import dotenv from 'dotenv';
   dotenv.config();

   const createAdmin = async () => {
     await mongoose.connect(process.env.MONGO_URI);
     const admin = new User({
       name: 'Admin',
       email: 'admin@verifai.com',
       passwordHash: 'admin123', // Will be hashed
       role: 'ADMIN'
     });
     await admin.save();
     console.log('Admin created:', admin.email);
     process.exit(0);
   };

   createAdmin();
   ```
   Run: `node server/scripts/createAdmin.js`

3. **Using API (after starting server):**
   - First, you'll need to manually create one admin user in the database
   - Then use that admin to create other users via `/api/v1/admin/users`

## 📁 Project Structure

```
face-recognition/
├── server/                 # Backend (Node.js/Express)
│   ├── src/
│   │   ├── config/        # Database, constants
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, error handling
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Crypto, JWT utilities
│   │   └── index.js      # Entry point
│   ├── .env.example
│   └── package.json
│
└── client/                 # Frontend (React + Vite)
    ├── public/
    │   └── models/        # face-api.js model files
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── context/      # Auth context
    │   ├── pages/        # Page components
    │   ├── services/     # API service
    │   ├── config/       # Configuration
    │   └── main.jsx      # Entry point
    └── package.json
```

## 🔐 Security Features

- **AES-256-GCM encryption** for face embeddings
- **JWT authentication** with role-based access control
- **bcrypt password hashing** (10 salt rounds)
- **No raw face images stored** - only encrypted embeddings

## 🎯 Features

- ✅ User authentication (JWT)
- ✅ Role-based access (Admin, Teacher, Student)
- ✅ Face registration with encryption
- ✅ Live attendance sessions
- ✅ Attendance reports and CSV export
- ✅ User, course, and enrollment management

## 📝 API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register user (Admin only)
- `POST /api/v1/auth/login` - Login

### Face Registration
- `POST /api/v1/face/register` - Register face embedding (Student)

### Attendance
- `POST /api/v1/attendance/session` - Create session (Teacher)
- `PATCH /api/v1/attendance/session/:id/close` - Close session (Teacher)
- `POST /api/v1/attendance/recognize` - Recognize and mark (Teacher)
- `GET /api/v1/attendance/student/:studentId` - Get student attendance
- `GET /api/v1/attendance/course/:courseId` - Get course attendance
- `GET /api/v1/attendance/export` - Export CSV

### Admin
- `POST /api/v1/admin/users` - Create user
- `GET /api/v1/admin/users` - List users
- `POST /api/v1/admin/courses` - Create course
- `POST /api/v1/admin/enrollments` - Create enrollment
- ... (full CRUD for users, students, courses, enrollments)

## 🛠️ Development

### Environment Variables

**Backend (.env):**
```env
MONGO_URI=mongodb://localhost:27017/verifai
JWT_SECRET=your-secret-key
EMBEDDING_AES_KEY=your-256-bit-base64-key
PORT=5000
NODE_ENV=development
FACE_RECOGNITION_THRESHOLD=0.6
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 📚 Next Steps

1. **Create admin user** (see Initial Setup above)
2. **Create courses and enrollments** via admin dashboard
3. **Students register their faces** via face registration page
4. **Teachers start attendance sessions** and mark attendance
5. **View reports** and export data

## 🐛 Troubleshooting

- **Models not loading**: Ensure face-api.js models are in `client/public/models/`
- **Camera not working**: Check browser permissions and HTTPS (required for getUserMedia)
- **MongoDB connection error**: Verify MONGO_URI in `.env` file
- **JWT errors**: Ensure JWT_SECRET is set in `.env`

## 📄 License

ISC
