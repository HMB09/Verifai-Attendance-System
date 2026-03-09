# VerifAI Attendance System – Technical Requirements Document (TRD)

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React App (Vite)                                       │ │
│  │  ├── Pages (Login, Dashboards, Registration, etc.)     │ │
│  │  ├── Components (UI building blocks)                   │ │
│  │  ├── Context (Auth state management)                   │ │
│  │  ├── Services (API client with Axios)                  │ │
│  │  └── face-api.js (Face detection & embeddings)         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS (REST API with JWT)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Layer                                              │ │
│  │  ├── Routes (auth, face, attendance, admin)            │ │
│  │  ├── Controllers (business logic)                      │ │
│  │  ├── Middleware (auth, RBAC, error handling)           │ │
│  │  ├── Models (Mongoose schemas)                         │ │
│  │  └── Utils (crypto, JWT, helpers)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │ MongoDB Wire Protocol
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                MongoDB Database (Atlas/Local)                │
│  ├── users                (User accounts)                    │
│  ├── students             (Student profiles)                 │
│  ├── courses              (Course definitions)               │
│  ├── enrollments          (Student-Course mappings)          │
│  ├── faceEmbeddings       (Encrypted embeddings)             │
│  ├── attendanceSessions   (Live sessions)                    │
│  └── attendanceRecords    (Attendance entries)               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.21
- **Routing**: React Router DOM 6.30.3
- **HTTP Client**: Axios 1.13.2
- **Face Recognition**: face-api.js 0.22.2
- **Language**: JavaScript (ES6+)

#### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.21.1
- **Database ODM**: Mongoose 8.8.4
- **Authentication**: jsonwebtoken 9.0.2
- **Password Hashing**: bcrypt 6.0.0
- **Environment**: dotenv 16.4.7
- **Dev Tool**: nodemon 3.1.9

#### Database
- **Database**: MongoDB 7.0+ (Atlas or local)
- **Driver**: MongoDB Node Driver 7.0.0

#### Security & Crypto
- **Encryption**: Node.js built-in `crypto` module (AES-256-GCM)
- **JWT**: HS256 algorithm
- **Password**: bcrypt with 10 salt rounds

---

## 2. Database Schema

### 2.1 Collections and Schemas

#### User Collection
```javascript
{
  _id: ObjectId,
  name: String,              // Full name
  email: String,             // Unique, lowercase, trimmed
  passwordHash: String,      // bcrypt hashed password
  role: String,              // Enum: 'ADMIN', 'TEACHER', 'STUDENT'
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

**Indexes:**
- `email`: unique, ascending
- `role`: ascending (for filtering)

**Validation:**
- email: required, unique, valid email format
- passwordHash: required, min 8 characters before hashing
- role: required, must be one of ADMIN/TEACHER/STUDENT

---

#### Student Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // Reference to User._id
  studentId: String,         // College/University roll number (unique)
  department: String,        // e.g., "Computer Science"
  year: Number,              // Academic year (1-4)
  section: String,           // Section identifier (A, B, C, etc.)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: unique, ascending
- `studentId`: unique, ascending
- `department, year, section`: compound index for filtering

**Validation:**
- userId: required, must reference valid User
- studentId: required, unique
- year: required, integer between 1-5

---

#### Course Collection
```javascript
{
  _id: ObjectId,
  code: String,              // Course code (e.g., "CS101")
  name: String,              // Course name
  department: String,        // Department offering the course
  year: Number,              // Target year
  section: String,           // Target section
  teacherId: ObjectId,       // Reference to User._id (role: TEACHER)
  credits: Number,           // Course credits (optional)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `code`: unique, ascending
- `teacherId`: ascending
- `department, year, section`: compound index

**Validation:**
- code: required, unique
- name: required
- teacherId: required, must reference User with role TEACHER

---

#### Enrollment Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,        // Reference to Course._id
  studentId: ObjectId,       // Reference to Student._id
  enrolledAt: Date,          // Enrollment timestamp
  status: String,            // Enum: 'ACTIVE', 'DROPPED', 'COMPLETED'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `courseId, studentId`: compound unique index (prevent duplicates)
- `studentId`: ascending (for student queries)
- `courseId`: ascending (for course queries)

**Validation:**
- courseId: required, must reference valid Course
- studentId: required, must reference valid Student
- No duplicate enrollments for same course-student pair

---

#### FaceEmbedding Collection
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,       // Reference to Student._id (unique)
  embeddingEncrypted: String,// Base64-encoded AES-GCM ciphertext
  iv: String,                // Initialization vector (base64)
  authTag: String,           // Authentication tag for GCM (base64)
  model: String,             // Model used: "face-api.js-resnet"
  version: String,           // Model version for future migrations
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `studentId`: unique, ascending (one embedding per student)

**Validation:**
- studentId: required, unique, must reference valid Student
- embeddingEncrypted: required
- iv, authTag: required for GCM mode

**Security Notes:**
- Embedding is 128-D float array, encrypted before storage
- AES key stored in environment variable `EMBEDDING_AES_KEY`
- Never expose decrypted embedding via API

---

#### AttendanceSession Collection
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,        // Reference to Course._id
  teacherId: ObjectId,       // Teacher who created session
  startTime: Date,           // Session start timestamp
  endTime: Date,             // Session end timestamp (null while active)
  status: String,            // Enum: 'ACTIVE', 'CLOSED'
  location: String,          // Optional location/room info
  metadata: Object,          // Additional session metadata
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `courseId, startTime`: compound index for filtering
- `status`: ascending (to find active sessions)
- `teacherId`: ascending

**Validation:**
- courseId: required
- teacherId: required, must match Course.teacherId or be admin
- status: required, default 'ACTIVE'
- endTime: must be after startTime when set

**Business Rules:**
- Only one ACTIVE session per course at a time
- Teacher can only create session for assigned courses

---

#### AttendanceRecord Collection
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,       // Reference to AttendanceSession._id
  studentId: ObjectId,       // Reference to Student._id
  timestamp: Date,           // When marked present
  status: String,            // Enum: 'PRESENT', 'ABSENT', 'LATE'
  markedBy: String,          // Enum: 'AUTO', 'MANUAL'
  confidence: Number,        // Recognition confidence (0-1, if AUTO)
  notes: String,             // Optional teacher notes
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `sessionId, studentId`: compound unique index (one record per student per session)
- `studentId`: ascending
- `sessionId`: ascending
- `timestamp`: descending (for chronological queries)

**Validation:**
- sessionId: required, must reference valid AttendanceSession
- studentId: required, must reference valid Student
- status: required, default 'PRESENT'
- markedBy: required
- confidence: optional, between 0 and 1

**Business Rules:**
- One attendance record per student per session
- AUTO marking requires confidence score
- MANUAL marking must have teacherId in notes/metadata

---

### 2.2 Relationships

```
User (1) ─────────── (1) Student
  │
  ├─ (1) ──────── (many) Course [as Teacher]
  │
  └─ (many) ───── (many) AttendanceRecord [as Teacher marking]

Student (1) ────────── (1) FaceEmbedding
  │
  └─ (many) ──────── (many) Course [via Enrollment]
       │
       └─ (many) ── (many) AttendanceRecord [via Sessions]

Course (1) ─────────── (many) Enrollment
  │
  └─ (1) ──────────── (many) AttendanceSession
       │
       └─ (1) ────── (many) AttendanceRecord
```

---

## 3. API Endpoints (v1)

Base URL: `/api/v1`

### 3.1 Authentication Endpoints

#### POST /auth/register
**Description**: Register a new user (Admin only)  
**Auth**: JWT required, role: ADMIN  
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "STUDENT"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT"
    }
  }
}
```

#### POST /auth/login
**Description**: Login with email and password  
**Auth**: None  
**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT"
    }
  }
}
```

---

### 3.2 Face Registration Endpoints

#### POST /face/register
**Description**: Register face embedding for authenticated student  
**Auth**: JWT required, role: STUDENT  
**Request Body**:
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],  // 128-element array
  "model": "face-api.js-resnet",
  "version": "0.22.2"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Face registered successfully",
  "data": {
    "faceEmbedding": {
      "_id": "...",
      "studentId": "...",
      "model": "face-api.js-resnet",
      "createdAt": "2026-01-23T..."
    }
  }
}
```

**Processing Flow**:
1. Validate embedding (128 floats)
2. Encrypt embedding with AES-256-GCM
3. Store encrypted data with IV and authTag
4. Return success (never return embedding back)

#### GET /face/status
**Description**: Check if student has registered face  
**Auth**: JWT required, role: STUDENT  
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "registered": true,
    "model": "face-api.js-resnet",
    "registeredAt": "2026-01-20T..."
  }
}
```

---

### 3.3 Attendance Session Endpoints

#### POST /attendance/session
**Description**: Create new attendance session  
**Auth**: JWT required, role: TEACHER  
**Request Body**:
```json
{
  "courseId": "...",
  "location": "Room 101"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "message": "Attendance session created",
  "data": {
    "session": {
      "_id": "...",
      "courseId": "...",
      "teacherId": "...",
      "startTime": "2026-01-23T10:00:00Z",
      "status": "ACTIVE"
    }
  }
}
```

**Business Logic**:
1. Verify teacher is assigned to course
2. Check no other ACTIVE session exists for course
3. Create session with status ACTIVE
4. Return session details

#### PATCH /attendance/session/:id/close
**Description**: Close active attendance session  
**Auth**: JWT required, role: TEACHER  
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Session closed successfully",
  "data": {
    "session": {
      "_id": "...",
      "endTime": "2026-01-23T11:00:00Z",
      "status": "CLOSED",
      "summary": {
        "totalEnrolled": 50,
        "present": 45,
        "absent": 5,
        "attendancePercentage": 90
      }
    }
  }
}
```

**Business Logic**:
1. Verify session belongs to teacher
2. Set endTime to current timestamp
3. Update status to CLOSED
4. Calculate summary statistics
5. Return updated session

---

### 3.4 Attendance Recognition Endpoint

#### POST /attendance/recognize
**Description**: Recognize face and mark attendance  
**Auth**: JWT required, role: TEACHER  
**Request Body**:
```json
{
  "sessionId": "...",
  "embedding": [0.123, -0.456, ...]  // 128-element array
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Student recognized and marked present",
  "data": {
    "match": {
      "studentId": "...",
      "studentName": "John Doe",
      "confidence": 0.85,
      "alreadyMarked": false
    },
    "record": {
      "_id": "...",
      "sessionId": "...",
      "studentId": "...",
      "timestamp": "2026-01-23T10:05:00Z",
      "status": "PRESENT",
      "markedBy": "AUTO"
    }
  }
}
```

**Response** (404 Not Found - No match):
```json
{
  "success": false,
  "message": "No matching student found",
  "data": {
    "match": null
  }
}
```

**Processing Flow**:
1. Validate session is ACTIVE and belongs to teacher's course
2. Get all enrolled students for the course
3. For each enrolled student:
   - Fetch encrypted embedding from database
   - Decrypt embedding using AES key
   - Calculate cosine similarity with provided embedding
4. Find best match above threshold (default 0.6)
5. If match found:
   - Check if already marked in this session
   - If not marked, create AttendanceRecord (status: PRESENT, markedBy: AUTO)
   - Return match details and record
6. If no match, return 404

**Performance Optimization**:
- Cache decrypted embeddings per session (in-memory)
- Parallel similarity calculations
- Early termination if high-confidence match found

---

### 3.5 Attendance Query Endpoints

#### GET /attendance/student/:studentId
**Description**: Get attendance records for a student  
**Auth**: JWT required  
- STUDENT: can only access own records
- TEACHER: can access students in their courses
- ADMIN: can access all  
**Query Params**:
- `from`: Start date (ISO string)
- `to`: End date (ISO string)
- `courseId`: Filter by course (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "...",
      "name": "John Doe",
      "studentId": "CS2023001"
    },
    "records": [
      {
        "date": "2026-01-23",
        "course": "Introduction to AI",
        "status": "PRESENT",
        "timestamp": "2026-01-23T10:05:00Z"
      },
      ...
    ],
    "summary": {
      "totalSessions": 20,
      "present": 18,
      "absent": 2,
      "attendancePercentage": 90
    }
  }
}
```

#### GET /attendance/course/:courseId
**Description**: Get attendance for a course  
**Auth**: JWT required, role: TEACHER or ADMIN  
**Query Params**:
- `from`: Start date
- `to`: End date
- `sessionId`: Filter by specific session (optional)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "...",
      "code": "CS101",
      "name": "Introduction to AI"
    },
    "sessions": [
      {
        "sessionId": "...",
        "date": "2026-01-23",
        "startTime": "10:00",
        "endTime": "11:00",
        "present": 45,
        "absent": 5,
        "attendancePercentage": 90
      },
      ...
    ],
    "students": [
      {
        "studentId": "...",
        "name": "John Doe",
        "totalSessions": 20,
        "present": 18,
        "attendancePercentage": 90
      },
      ...
    ]
  }
}
```

#### GET /attendance/export
**Description**: Export attendance as CSV  
**Auth**: JWT required, role: TEACHER or ADMIN  
**Query Params**:
- `courseId`: Required
- `from`: Start date (optional)
- `to`: End date (optional)

**Response** (200 OK):
```csv
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance_CS101_2026-01-23.csv"

Student ID,Name,Total Sessions,Present,Absent,Attendance %
CS2023001,John Doe,20,18,2,90
CS2023002,Jane Smith,20,20,0,100
...
```

---

### 3.6 Admin CRUD Endpoints

#### Users
- `POST /admin/users` - Create user
- `GET /admin/users` - List users (with pagination)
- `GET /admin/users/:id` - Get user details
- `PATCH /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user

#### Students
- `POST /admin/students` - Create student profile
- `GET /admin/students` - List students
- `GET /admin/students/:id` - Get student details
- `PATCH /admin/students/:id` - Update student
- `DELETE /admin/students/:id` - Delete student

#### Courses
- `POST /admin/courses` - Create course
- `GET /admin/courses` - List courses
- `GET /admin/courses/:id` - Get course details
- `PATCH /admin/courses/:id` - Update course
- `DELETE /admin/courses/:id` - Delete course

#### Enrollments
- `POST /admin/enrollments` - Create enrollment
- `GET /admin/enrollments` - List enrollments
- `DELETE /admin/enrollments/:id` - Remove enrollment

---

## 4. Security Implementation

### 4.1 Encryption (AES-256-GCM)

**Key Management**:
```javascript
// Environment variable (server/.env)
EMBEDDING_AES_KEY=<base64-encoded-32-byte-key>

// Generate key:
// node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Encryption Function**:
```javascript
import crypto from 'crypto';

export function encryptEmbedding(embedding) {
  const key = Buffer.from(process.env.EMBEDDING_AES_KEY, 'base64');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const embeddingBuffer = Buffer.from(JSON.stringify(embedding));
  const encrypted = Buffer.concat([
    cipher.update(embeddingBuffer),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    embeddingEncrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}
```

**Decryption Function**:
```javascript
export function decryptEmbedding(embeddingEncrypted, iv, authTag) {
  const key = Buffer.from(process.env.EMBEDDING_AES_KEY, 'base64');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(embeddingEncrypted, 'base64')),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString());
}
```

### 4.2 JWT Authentication

**Token Generation**:
```javascript
import jwt from 'jsonwebtoken';

export function generateToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
    issuer: 'verifai-system'
  });
}
```

**Token Verification Middleware**:
```javascript
export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}
```

**Role-Based Access Control**:
```javascript
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
}

// Usage:
// router.post('/session', authMiddleware, requireRole('TEACHER'), createSession);
```

### 4.3 Password Security

**Hashing (bcrypt)**:
```javascript
// In User model pre-save hook
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
  next();
});
```

**Comparison**:
```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};
```

---

## 5. Face Recognition Algorithm

### 5.1 Frontend (face-api.js)

**Model Loading**:
```javascript
import * as faceapi from 'face-api.js';

// Load models once on app init
await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
```

**Face Detection & Embedding**:
```javascript
// Registration: Capture multiple frames
async function registerFace(videoElement) {
  const embeddings = [];
  
  for (let i = 0; i < 5; i++) {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detection) {
      embeddings.push(Array.from(detection.descriptor));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Average embeddings for more robust representation
  const avgEmbedding = averageEmbeddings(embeddings);
  
  // Send to backend
  await api.post('/face/register', { embedding: avgEmbedding });
}
```

### 5.2 Backend (Similarity Calculation)

**Cosine Similarity**:
```javascript
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Recognition Logic**:
```javascript
async function recognizeStudent(embedding, enrolledStudents) {
  const threshold = parseFloat(process.env.FACE_RECOGNITION_THRESHOLD) || 0.6;
  
  let bestMatch = null;
  let highestSimilarity = -1;
  
  for (const student of enrolledStudents) {
    const storedEmbedding = await FaceEmbedding.findOne({
      studentId: student._id
    });
    
    if (!storedEmbedding) continue;
    
    // Decrypt stored embedding
    const decryptedEmbedding = decryptEmbedding(
      storedEmbedding.embeddingEncrypted,
      storedEmbedding.iv,
      storedEmbedding.authTag
    );
    
    // Calculate similarity
    const similarity = cosineSimilarity(embedding, decryptedEmbedding);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = student;
    }
  }
  
  // Return match only if above threshold
  if (highestSimilarity >= threshold) {
    return {
      student: bestMatch,
      confidence: highestSimilarity
    };
  }
  
  return null;
}
```

**Threshold Tuning**:
- Default: 0.6 (balanced)
- More strict: 0.7-0.8 (fewer false positives)
- More lenient: 0.4-0.5 (fewer false negatives)
- Configurable via `FACE_RECOGNITION_THRESHOLD` env variable

---

## 6. Frontend Architecture

### 6.1 Directory Structure

```
client/src/
├── main.jsx                # Entry point
├── App.jsx                 # Root component with routing
├── components/             # Reusable UI components
│   └── ProtectedRoute.jsx  # Route guard for auth
├── pages/                  # Page components
│   ├── Login.jsx           # Login form
│   ├── StudentDashboard.jsx
│   ├── TeacherDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── FaceRegistration.jsx
│   └── LiveAttendance.jsx
├── context/                # React Context for state
│   └── AuthContext.jsx     # Auth state management
├── services/               # API integration
│   └── api.js              # Axios instance with interceptors
└── config/                 # Configuration
    └── api.js              # API base URL, constants
```

### 6.2 State Management

**AuthContext**:
```javascript
// context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and set user
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 6.3 API Service

**Axios Configuration**:
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. Backend Architecture

### 7.1 Directory Structure

```
server/src/
├── index.js                # Entry point, Express setup
├── config/
│   ├── database.js         # MongoDB connection
│   └── constants.js        # App constants (roles, status enums)
├── controllers/            # Request handlers
│   ├── auth.controller.js
│   ├── face.controller.js
│   ├── attendance.controller.js
│   └── admin.controller.js
├── middleware/             # Custom middleware
│   ├── auth.middleware.js  # JWT verification, RBAC
│   └── error.middleware.js # Global error handler
├── models/                 # Mongoose schemas
│   ├── User.model.js
│   ├── Student.model.js
│   ├── Course.model.js
│   ├── Enrollment.model.js
│   ├── FaceEmbedding.model.js
│   ├── AttendanceSession.model.js
│   └── AttendanceRecord.model.js
├── routes/                 # Route definitions
│   ├── auth.routes.js
│   ├── face.routes.js
│   ├── attendance.routes.js
│   └── admin.routes.js
└── utils/                  # Helper functions
    ├── crypto.util.js      # AES encryption/decryption
    └── jwt.util.js         # JWT generation/verification
```

### 7.2 Error Handling

**Global Error Middleware**:
```javascript
// middleware/error.middleware.js
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      field: Object.keys(err.keyPattern)[0]
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}
```

---

## 8. Environment Configuration

### 8.1 Backend (.env)

```bash
# MongoDB Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/verifai?retryWrites=true&w=majority
# For local: mongodb://localhost:27017/verifai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AES Encryption Key for Face Embeddings (256-bit = 32 bytes, base64 encoded)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
EMBEDDING_AES_KEY=your-base64-encoded-32-byte-key

# Server Configuration
PORT=5000
NODE_ENV=development

# Face Recognition Threshold (0.0 to 1.0, lower = more strict)
FACE_RECOGNITION_THRESHOLD=0.6
```

### 8.2 Frontend (.env)

```bash
# API Base URL
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 9. Deployment Considerations

### 9.1 Production Checklist

**Backend**:
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (64+ characters)
- [ ] Rotate `EMBEDDING_AES_KEY` periodically
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up MongoDB Atlas with IP whitelisting
- [ ] Configure CORS for specific frontend origin
- [ ] Add rate limiting middleware
- [ ] Set up logging (Winston, Morgan)
- [ ] Configure process manager (PM2)
- [ ] Set up health check endpoint

**Frontend**:
- [ ] Build optimized production bundle (`npm run build`)
- [ ] Serve via CDN or static hosting
- [ ] Set `VITE_API_BASE_URL` to production API
- [ ] Enable service worker for offline capability (optional)
- [ ] Minify and compress assets

**Database**:
- [ ] Enable MongoDB authentication
- [ ] Set up automated backups
- [ ] Configure replica set for high availability
- [ ] Add database monitoring
- [ ] Create indexes for performance

---

## 10. Performance Optimization

### 10.1 Database Indexing

```javascript
// Recommended indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.students.createIndex({ userId: 1 }, { unique: true });
db.students.createIndex({ studentId: 1 }, { unique: true });
db.courses.createIndex({ code: 1 }, { unique: true });
db.courses.createIndex({ teacherId: 1 });
db.enrollments.createIndex({ courseId: 1, studentId: 1 }, { unique: true });
db.faceEmbeddings.createIndex({ studentId: 1 }, { unique: true });
db.attendanceSessions.createIndex({ courseId: 1, startTime: -1 });
db.attendanceRecords.createIndex({ sessionId: 1, studentId: 1 }, { unique: true });
db.attendanceRecords.createIndex({ timestamp: -1 });
```

### 10.2 Query Optimization

- Use `.lean()` for read-only queries (faster)
- Project only needed fields with `.select()`
- Paginate large result sets
- Avoid N+1 queries with `.populate()`

### 10.3 Caching Strategy (Future)

- Cache decrypted embeddings per session (in-memory)
- Cache course enrollment lists
- Use Redis for session data
- Implement HTTP caching headers

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Crypto utils (encrypt/decrypt round-trip)
- JWT generation and verification
- Password hashing and comparison
- Face recognition algorithm (cosine similarity)

### 11.2 Integration Tests
- Auth flow (register, login, logout)
- Face registration flow
- Attendance session lifecycle
- RBAC enforcement

### 11.3 End-to-End Tests
- Student registration workflow
- Teacher attendance workflow
- Admin management workflow
- Cross-browser compatibility

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Status**: Reference Implementation
