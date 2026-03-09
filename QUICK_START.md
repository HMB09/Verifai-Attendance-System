# 🚀 Quick Start Guide

## TL;DR - Get Running in 5 Minutes

### 1. Backend Setup (2 min)
```bash
cd server
npm install

# Setup MongoDB Atlas (free cloud database - required)
# Follow detailed instructions in SETUP.md section 1.5
# Quick link: https://www.mongodb.com/cloud/atlas/register

copy .env.example .env
# Edit .env with your MongoDB URI and generate AES key:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm run create-admin
npm run dev
```

### 2. Frontend Setup (2 min)
```bash
cd client
npm install
# Download models (PowerShell):
.\scripts\downloadModels.ps1
# OR (Bash):
bash scripts/downloadModels.sh
npm run dev
```

### 3. Login
- Open: http://localhost:3000
- Email: `admin@verifai.com`
- Password: `admin123`

---

## 📋 What Was Created

### Backend (`server/`)
- ✅ Express API server
- ✅ MongoDB models (User, Student, Course, Enrollment, FaceEmbedding, AttendanceSession, AttendanceRecord)
- ✅ JWT authentication & RBAC middleware
- ✅ AES encryption for face embeddings
- ✅ Attendance recognition & reporting endpoints
- ✅ Admin CRUD endpoints

### Frontend (`client/`)
- ✅ React + Vite setup
- ✅ Authentication pages (Login)
- ✅ Role-based dashboards (Student, Teacher, Admin)
- ✅ Face registration page (with face-api.js)
- ✅ Live attendance page
- ✅ Protected routes with role checking

---

## 🔑 Key Files to Configure

1. **`server/.env`** - Backend configuration
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Random secret for JWT
   - `EMBEDDING_AES_KEY` - 256-bit base64 key (generate with command above)

2. **`client/public/models/`** - Face recognition models
   - Download using provided scripts

---

## 📝 Default Admin Credentials

- **Email**: `admin@verifai.com`
- **Password**: `admin123`
- ⚠️ **Change immediately after first login!**

---

## 🎯 Next Steps After Setup

1. **Create Users** (via Admin dashboard or API)
   - Create a Teacher user
   - Create Student users

2. **Create Course**
   - Add course via Admin dashboard
   - Assign teacher to course

3. **Enroll Students**
   - Enroll students in courses

4. **Student Face Registration**
   - Students login and register their faces

5. **Take Attendance**
   - Teacher starts session
   - System recognizes faces automatically

---

## 🛠️ Common Commands

```bash
# Backend
cd server
npm run dev          # Start dev server
npm run create-admin # Create admin user
npm start            # Production start

# Frontend
cd client
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 📚 Full Documentation

- **Detailed Setup**: See `SETUP.md`
- **Project Overview**: See `README.md`
- **API Documentation**: See `README.md` API Endpoints section

---

## ⚡ Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection error | Check `MONGO_URI` in `.env` |
| Models not loading | Run download script or manually download models |
| Camera not working | Check browser permissions, use HTTPS in production |
| JWT errors | Verify `JWT_SECRET` is set in `.env` |
| Face recognition fails | Check threshold, ensure good lighting, verify embeddings exist |

---

## 🎉 You're Ready!

Once both servers are running:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Start by logging in as admin and creating your first users!
