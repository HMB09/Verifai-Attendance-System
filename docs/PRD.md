# VerifAI Attendance System – Product Requirements Document (PRD)

## 1. Vision and Goals

VerifAI is a **web-based** attendance system that uses AI‑powered face recognition to automate attendance while preserving biometric privacy through encrypted face embeddings instead of raw images.

### Primary Goals

- **Eliminate manual processes**: Remove the need for manual roll calls and prevent proxy attendance in classrooms
- **Ensure biometric privacy**: Secure handling of biometric data via AES encryption, HTTPS, JWT, and RBAC
- **Simplify attendance management**: Provide intuitive dashboards for students, teachers, and admins to manage attendance and records
- **Achieve accuracy**: Maintain high recognition accuracy while minimizing false positives/negatives
- **Scale efficiently**: Support multiple concurrent classes and large institutions

---

## 2. Target Users and Roles

### 2.1 Student
**Primary Use Cases:**
- Register face embedding once during onboarding
- View personal attendance history per course
- See attendance percentage and statistics
- Receive notifications for low attendance

**Permissions:**
- Can only view own attendance data
- Can register/update own face embedding
- Cannot modify attendance records

### 2.2 Teacher / Faculty
**Primary Use Cases:**
- Start and stop live attendance sessions for assigned classes
- View who is present/absent in real-time during sessions
- Manually correct or override attendance when needed
- Generate and export attendance reports for courses
- View class-level attendance statistics

**Permissions:**
- Can manage attendance for assigned courses only
- Can manually mark/unmark students
- Can view enrolled students' attendance
- Cannot modify user accounts or system settings

### 2.3 Admin
**Primary Use Cases:**
- Manage users, roles, and permissions
- Create and manage courses, sections, and enrollments
- Configure system settings (recognition threshold, etc.)
- View institution-level reports and analytics
- Handle system maintenance and troubleshooting

**Permissions:**
- Full CRUD access to all entities
- Can create/modify/delete users, courses, enrollments
- Can view all attendance data
- Can configure system parameters

---

## 3. Core Use Cases

### 3.1 Student Registration with Face Embedding

**Flow:**
1. Student account is created by admin (or self-registration based on config)
2. Student logs in with email/password credentials
3. Student navigates to "Face Registration" page
4. System requests webcam permission
5. Student allows webcam access
6. System captures multiple frames (face detection active)
7. For each valid face detection:
   - Generate 128-dimensional face embedding using face-api.js
   - Store temporarily in browser
8. Average multiple embeddings for better accuracy
9. Send averaged embedding to backend API
10. Backend encrypts embedding with AES-256-GCM
11. Encrypted embedding stored in database
12. Success confirmation shown to student

**Edge Cases:**
- No face detected: Show guidance message
- Multiple faces detected: Ask student to be alone in frame
- Poor lighting: Suggest better lighting
- Embedding already exists: Option to update/replace

### 3.2 Teacher Takes Attendance in Class

**Pre-requisites:**
- Course, section, and enrollments are created
- Students have registered their face embeddings
- Teacher is assigned to the course

**Flow:**
1. Teacher logs in and navigates to "Take Attendance"
2. Teacher selects course, section, and date (defaults to today)
3. Teacher clicks "Start Attendance Session"
4. System creates AttendanceSession record (status: ACTIVE)
5. Teacher's device camera activates (laptop/phone browser)
6. For each frame captured:
   - Detect faces in frame
   - Generate embeddings for detected faces
   - Send to backend for recognition
7. Backend processing per embedding:
   - Fetch all enrolled students' encrypted embeddings
   - Decrypt each embedding
   - Calculate cosine similarity
   - If similarity > threshold (default 0.6), mark as match
   - Create AttendanceRecord (status: PRESENT, markedBy: AUTO)
8. Frontend shows real-time list of recognized students
9. Teacher can manually mark/unmark students
10. Teacher clicks "End Session"
11. System closes AttendanceSession (status: CLOSED)
12. Summary displayed with present/absent counts

**Edge Cases:**
- Same student recognized multiple times: Mark only once per session
- Unrecognized face: Show "unknown" alert, teacher can manually identify
- Poor recognition: Teacher can manually mark attendance
- Network issues: Queue recognition requests and retry

### 3.3 Admin and Teacher Reporting

**Student Report:**
- View own attendance across all enrolled courses
- Filter by date range, course
- See attendance percentage per course
- Visual charts (line, bar graphs)

**Teacher Report:**
- View course-level attendance
- Filter by date range, section
- See per-student attendance within course
- Identify students with low attendance
- Export as CSV

**Admin Report:**
- Institution-wide statistics
- Department-level breakdown
- Course-wise attendance averages
- Identify problematic courses/patterns
- Export comprehensive reports

### 3.4 Security and Privacy

**Data Protection:**
- **No raw face images stored** anywhere in the system
- Only numerical embeddings (128-dimensional vectors) are persisted
- All embeddings AES-256-GCM encrypted at rest
- Encryption keys stored securely in environment variables
- HTTPS enforced for all API communications

**Access Control:**
- JWT-based authentication for all API requests
- Role-based access control (RBAC) for authorization
- Token expiration and refresh mechanism
- Protected routes in frontend with role guards
- Audit logs for sensitive operations

**Compliance:**
- GDPR-ready: Students can request data deletion
- Data minimization: Only store necessary biometric data
- Purpose limitation: Face data used only for attendance
- Transparency: Clear privacy policy for users

---

## 4. Features (MVP)

### 4.1 Authentication & Authorization
- [x] JWT-based login (email/password)
- [x] Password hashing with bcrypt (10 salt rounds)
- [x] Three role types: `ADMIN`, `TEACHER`, `STUDENT`
- [x] Protected API routes with middleware
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Multi-factor authentication (future)

### 4.2 User and Course Management
- [x] Admin CRUD for users
- [x] Admin CRUD for courses
- [x] Admin CRUD for enrollments (student-course mapping)
- [x] Student profiles linked to user accounts
- [x] Department, year, section organization
- [ ] Bulk import via CSV
- [ ] Academic year/semester management

### 4.3 Face Registration
- [x] Webcam capture via browser getUserMedia API
- [x] Local face detection using face-api.js
- [x] Embedding generation (128-D vector)
- [x] Send embedding to backend
- [x] AES encryption and storage
- [x] One embedding per student (with update capability)
- [ ] Multi-image registration for better accuracy
- [ ] Quality assessment before registration

### 4.4 Live Attendance
- [x] Teacher starts session for a course
- [x] Continuous face detection and recognition
- [x] Automatic marking on successful match
- [x] Real-time recognition feedback
- [x] Manual override capability
- [x] Session close functionality
- [ ] Batch processing for large classes
- [ ] Confidence score display
- [ ] Duplicate detection within session

### 4.5 Dashboards & Reports
- [x] Student dashboard: personal attendance view
- [x] Teacher dashboard: course management
- [x] Admin dashboard: system overview
- [x] Date range filtering
- [x] Per-course and per-student reports
- [x] CSV export functionality
- [ ] Visual charts and graphs
- [ ] Attendance alerts/notifications
- [ ] PDF report generation

### 4.6 System Configuration
- [x] Environment-based configuration
- [x] Configurable face recognition threshold
- [x] JWT secret management
- [x] AES encryption key management
- [ ] Admin UI for configuration
- [ ] Logging and monitoring
- [ ] Performance metrics

---

## 5. Non-Functional Requirements

### 5.1 Technology Stack
- **Frontend**: React 18+ with Vite
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: face-api.js (browser-based)
- **Authentication**: JWT with bcrypt
- **Encryption**: AES-256-GCM for embeddings

### 5.2 Performance
- **Recognition latency**: < 500ms per face on typical hardware
- **Session capacity**: Support up to 60 students per class
- **Concurrent sessions**: Multiple teachers can run sessions simultaneously
- **Database queries**: Optimized with indexes on frequent lookups
- **Frontend load time**: < 3 seconds initial load

### 5.3 Security
- **Transport**: HTTPS/TLS for all communications
- **Storage**: AES-256-GCM encryption for embeddings
- **Authentication**: JWT with secure secret, 1-day expiration
- **Authorization**: RBAC enforced at API level
- **Input validation**: All user inputs sanitized
- **XSS protection**: React's built-in protections
- **CSRF protection**: Token-based validation

### 5.4 Scalability
- **Horizontal scaling**: Stateless API design for load balancing
- **Database**: MongoDB with indexing and sharding capability
- **Caching**: Future Redis integration for session data
- **CDN**: Static assets served via CDN in production

### 5.5 Usability
- **Responsive design**: Works on desktop, tablet, mobile browsers
- **Intuitive UI**: Minimal training required
- **Error handling**: Clear error messages and recovery paths
- **Loading states**: Visual feedback for async operations
- **Accessibility**: WCAG 2.1 AA compliance (future goal)

### 5.6 Maintainability
- **Code organization**: Clear separation of concerns
  - `/models` - Database schemas
  - `/controllers` - Business logic
  - `/routes` - API endpoints
  - `/middleware` - Cross-cutting concerns
  - `/utils` - Helper functions
- **Documentation**: Code comments, API docs, README
- **Version control**: Git with semantic commits
- **Testing**: Unit and integration tests (future)
- **Logging**: Structured logging for debugging

### 5.7 Reliability
- **Error handling**: Graceful degradation
- **Database backups**: Regular automated backups
- **Uptime target**: 99.5% availability
- **Data durability**: MongoDB replication
- **Recovery**: Documented disaster recovery plan

---

## 6. Future Enhancements (Post-MVP)

### Phase 2
- Multi-language support (i18n)
- Email notifications for low attendance
- Mobile app (React Native)
- Improved analytics with charts
- Batch image upload for registration
- Attendance prediction using ML

### Phase 3
- Integration with LMS (Learning Management Systems)
- API gateway for third-party integrations
- Advanced reporting with BI tools
- Facial liveness detection (anti-spoofing)
- Multi-camera support for large venues
- Real-time attendance dashboard (WebSocket)

### Phase 4
- Edge deployment for offline operation
- Python microservice for advanced CV tasks
- Deep learning model fine-tuning
- Multi-factor authentication
- Single Sign-On (SSO) integration
- LDAP/Active Directory integration

---

## 7. Success Metrics

### Adoption Metrics
- Number of active users (students, teachers)
- Number of courses using the system
- Number of attendance sessions conducted
- System uptime percentage

### Performance Metrics
- Average recognition accuracy (target: >95%)
- False positive rate (target: <2%)
- False negative rate (target: <3%)
- Average session duration
- API response times

### User Satisfaction
- User feedback score (target: 4+/5)
- Teacher time saved vs manual attendance
- Student satisfaction with privacy measures
- Admin efficiency improvements

### Security Metrics
- Zero data breaches
- Zero unauthorized access incidents
- 100% encrypted biometric data
- Regular security audits passed

---

## 8. Risks and Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low recognition accuracy | High | Multi-image registration, threshold tuning, manual override |
| Browser compatibility | Medium | Progressive enhancement, fallback UI |
| Network latency | Medium | Offline queue, optimistic UI updates |
| Database scaling | Medium | Indexing, sharding strategy, caching |

### Security Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Data breach | Critical | Encryption at rest, HTTPS, regular audits |
| Spoofing attacks | High | Future: liveness detection, multi-factor auth |
| Unauthorized access | High | JWT with expiration, RBAC, audit logs |
| Key exposure | Critical | Environment variables, key rotation policy |

### Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| User resistance | Medium | Training, clear benefits communication |
| Poor lighting conditions | Medium | User guidance, manual override |
| Privacy concerns | High | Transparency, consent, data minimization |
| System downtime | Medium | Redundancy, backups, monitoring |

---

## 9. Assumptions and Constraints

### Assumptions
- Users have access to devices with webcams
- Users have stable internet connection during attendance
- Institutional support for biometric attendance
- Users consent to face embedding storage
- Browser supports modern JavaScript APIs (getUserMedia, WebRTC)

### Constraints
- Budget: Open-source and free-tier services only for MVP
- Timeline: MVP development within reasonable timeframe
- Hardware: No specialized equipment required
- Compliance: Must adhere to local data protection laws
- Browser: Modern browsers only (Chrome, Firefox, Edge, Safari)

---

## 10. Glossary

- **Face Embedding**: 128-dimensional numerical vector representing unique facial features
- **AES-256-GCM**: Advanced Encryption Standard with 256-bit key and Galois/Counter Mode
- **JWT**: JSON Web Token for stateless authentication
- **RBAC**: Role-Based Access Control for authorization
- **Cosine Similarity**: Metric to measure similarity between two embeddings (0-1 scale)
- **Recognition Threshold**: Minimum similarity score to consider a match (default 0.6)
- **Attendance Session**: Time-bound period during which attendance is marked
- **Enrollment**: Relationship linking a student to a course

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Status**: Living Document (subject to updates based on feedback and requirements changes)
