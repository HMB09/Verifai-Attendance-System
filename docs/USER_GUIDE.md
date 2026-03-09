# VerifAI User Guide - Simplified Workflow

## 📚 Understanding the System

### What is each component?

**Course** = A class/subject (like "CS101 - Introduction to Programming")
- Has a teacher assigned to it
- Students are enrolled in courses to attend classes

**Student** = A person who attends courses
- Has login credentials (email/password)
- Has a student profile (student ID, department, year, section)
- Can register their face for automatic attendance
- Can only VIEW their own attendance

**Teacher** = A person who teaches courses
- Has login credentials (email/password)
- Can take attendance for their assigned courses
- Can view course enrollment details

**Admin** = System administrator
- Can create courses and assign teachers
- Can create student accounts
- Can enroll students in courses
- Full system access

---

## 🔄 Complete Workflow

### Step 1: Admin Creates the Course
**Who:** Admin  
**Where:** Admin Dashboard → Courses Tab  
**What to do:**
1. Click "Add Course"
2. Enter course code (e.g., "CS101")
3. Enter course name (e.g., "Introduction to Programming")
4. Enter teacher's user ID (MongoDB ID of the teacher)
5. Optionally add schedule (e.g., "Mon/Wed 10:00-11:30")
6. Click "Create Course"

**Result:** Course is created and assigned to the teacher

---

### Step 2: Admin Creates Student Accounts
**Who:** Admin  
**Where:** Admin Dashboard → Students & Users Tab  
**What to do:**
1. Click "Add Student"
2. Fill in user details:
   - Full name
   - Email address
   - Password
   - Role: STUDENT
3. Fill in student details:
   - Student ID (e.g., "S2024001")
   - Department (e.g., "Computer Science")
   - Year (1, 2, 3, or 4)
   - Section (e.g., "A")
4. Click "Create User"

**Result:** Student account is created (both User + Student profile)

**Repeat this** for all students you want to add

---

### Step 3: Admin/Teacher Enrolls Students in Course
**Who:** Admin or Teacher  
**Where:** Currently requires direct API call or database entry  
**What to do:**
1. Go to Admin Dashboard → Enrollments (backend API)
2. Create enrollment:
   - Student ID (MongoDB _id from student record)
   - Course ID (MongoDB _id from course record)

**Result:** Student is now enrolled in the course

**Note:** This step will be simplified in future updates with a UI button

---

### Step 4: Student Registers Face
**Who:** Student  
**Where:** Student Dashboard → "Register Face" button  
**What to do:**
1. Student logs in with email/password
2. Clicks "Register Face" button on dashboard
3. Allows camera access
4. Click "Start Camera"
5. Position face in front of camera
6. Click "Register Face" to capture
7. System processes and saves encrypted face data

**Result:** Student's face is registered for automatic attendance

**Important:** 
- Face data is encrypted and secure
- Students can only do this ONCE (or update if needed)
- This is required before attendance can be marked automatically

---

### Step 5: Teacher Takes Attendance
**Who:** Teacher  
**Where:** Teacher Dashboard → Course Card → "Take Attendance"  
**What to do:**
1. Teacher logs in
2. Sees list of their courses
3. Clicks "Take Attendance" on a course
4. System redirects to Live Attendance page
5. Course is pre-selected (or select from dropdown)
6. Click "Start Session"
7. Allow camera access
8. Point camera at students in the classroom
9. System automatically recognizes and marks students present
10. When done, click "End Session"

**Result:** 
- Students who were recognized are marked PRESENT
- Attendance records are saved in database
- Session is closed

**How Recognition Works:**
- Camera scans for faces every 1.5 seconds
- Compares each face to registered student faces
- If match found (similarity > 60%), marks student present
- Each student can only be marked once per session
- Toast notification shows when student is recognized

---

### Step 6: Student Views Attendance
**Who:** Student  
**Where:** Student Dashboard  
**What to do:**
1. Student logs in
2. Automatically sees their dashboard
3. Views:
   - Total classes attended
   - Present count
   - Attendance percentage
   - Detailed attendance history table

**Result:** Student can track their own attendance

**Student Permissions:**
- Can ONLY view their own attendance
- CANNOT modify any records
- CANNOT see other students' attendance
- CANNOT take attendance

---

## 🎯 Key Points to Remember

### For Admins:
- You create everything: courses, students, enrollments
- You assign teachers to courses
- Students must be enrolled in courses to attend
- You have full system access

### For Teachers:
- You can only see and manage YOUR courses
- You take attendance using the camera
- Students must have registered faces for automatic recognition
- You can view who's enrolled in your courses

### For Students:
- You must register your face ONCE
- You can only VIEW your attendance
- You cannot modify anything
- Your face data is encrypted and secure

---

## 🔐 Security & Privacy

**Face Data:**
- Encrypted with AES-256-GCM
- NOT stored as images
- Stored as mathematical vectors (128 numbers)
- Cannot be reverse-engineered to recreate your face

**Passwords:**
- Hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Cannot be recovered (only reset)

**Access Control:**
- Students: View only their own data
- Teachers: Manage only their courses
- Admins: Full system access
- Enforced by JWT tokens and role-based permissions

---

## 📊 Data Flow Summary

```
1. Admin creates Course → Assigns Teacher

2. Admin creates Student accounts → User + Student profile created

3. Admin/Teacher enrolls Students in Course → Links Students ↔ Course

4. Student logs in → Registers face → Encrypted data saved

5. Teacher starts attendance session → Camera recognizes faces → Marks present

6. Student views attendance → Sees their records only
```

---

## 🐛 Troubleshooting

### "No face detected"
- Ensure good lighting
- Face should be clearly visible
- Look directly at camera
- Remove glasses/mask if recognition fails

### "Session not starting"
- Check if course is selected
- Ensure camera permissions are granted
- Check if models are loaded (may take 10-20 seconds)

### "Student not recognized"
- Ensure student has registered their face
- Check if student is enrolled in the course
- Ensure face is clearly visible
- May need to re-register face

### "Cannot see courses" (Teacher)
- Ensure admin assigned you as teacher to courses
- Check if `teacherId` in course matches your user ID
- Contact admin if courses don't appear

### "Cannot see attendance" (Student)
- Ensure you're enrolled in courses
- Check if attendance sessions have been conducted
- Attendance only shows after teacher takes it

---

## 🚀 Future Improvements

**Planned Features:**
- [ ] Simplified enrollment UI (click button to add students to course)
- [ ] Manual attendance marking (for students without face registration)
- [ ] Attendance reports and analytics
- [ ] Email notifications for low attendance
- [ ] Bulk student import via CSV
- [ ] Course-level attendance statistics for teachers
- [ ] Attendance edit/correction by teachers

---

## 📞 Support

For issues:
1. Check this guide first
2. Check `docs/TROUBLESHOOTING.md`
3. Contact system administrator
4. Report bugs in GitHub issues

**Last Updated:** January 23, 2026
