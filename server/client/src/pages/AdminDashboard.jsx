import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as faceapi from 'face-api.js';
import api from '../services/api';
import {
  Users,
  BookOpen,
  UserPlus,
  GraduationCap,
  LogOut,
  Settings,
  Activity,
  Loader2,
  X,
  Edit,
  Trash2,
  Camera,
  Video
} from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [studentForm, setStudentForm] = useState({ studentId: '', department: '', year: 1, section: '' });
  const [courseForm, setCourseForm] = useState({ code: '', name: '', department: '', year: 1, section: '', teacherId: '' });
  const [enrollmentForm, setEnrollmentForm] = useState({ studentId: '', courseId: '' });
  
  // Face capture states
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadFaceModels();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'courses') fetchCourses();
    else if (activeTab === 'enrollments') fetchEnrollments();
    else if (activeTab === 'overview') fetchStats();
  }, [activeTab]);

  const loadFaceModels = async () => {
    console.log('[AdminDashboard] Loading face-api.js models...');
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      console.log('[AdminDashboard] Face models loaded successfully');
    } catch (error) {
      console.error('[AdminDashboard] Error loading face models:', error);
      toast.error('Face recognition models not loaded');
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [usersRes, studentsRes, coursesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/students'),
        api.get('/admin/courses')
      ]);
      setUsers(usersRes.data.users || []);
      setStudents(studentsRes.data.students || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    console.log('[AdminDashboard] fetchUsers called');
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      console.log('[AdminDashboard] Fetched', response.data.users?.length || 0, 'users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('[AdminDashboard] Error fetching users:', error.response?.data || error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/enrollments');
      setEnrollments(response.data.enrollments || []);
      
      const [studentsRes, coursesRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/admin/courses')
      ]);
      setStudents(studentsRes.data.students || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const captureFace = async () => {
    console.log('[AdminDashboard] captureFace called, modelsLoaded:', modelsLoaded);
    
    if (!modelsLoaded) {
      console.error('[AdminDashboard] Face models not loaded');
      toast.error('Face recognition models not loaded yet');
      return;
    }

    console.log('[AdminDashboard] Opening face capture modal...');
    setShowFaceCapture(true);
    setCapturingFace(true);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      console.log('[AdminDashboard] Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480 
        } 
      });
      
      console.log('[AdminDashboard] Camera access granted, stream:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('[AdminDashboard] Video metadata loaded, playing video...');
          videoRef.current.play();
          setCapturingFace(false);
          toast.success('Camera ready - position face in center');
        };
      } else {
        console.error('[AdminDashboard] videoRef.current is null');
      }
    } catch (error) {
      console.error('[AdminDashboard] Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setShowFaceCapture(false);
      setCapturingFace(false);
    }
  };

  const processFaceCapture = async () => {
    console.log('[AdminDashboard] processFaceCapture called, videoRef.current:', videoRef.current);
    
    if (!videoRef.current) {
      console.error('[AdminDashboard] Video not ready');
      toast.error('Video not ready');
      return;
    }

    setCapturingFace(true);
    toast.info('Processing face...');
    console.log('[AdminDashboard] Starting face detection...');
    
    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      console.log('[AdminDashboard] Face detection result:', detections ? 'Face found' : 'No face');
      
      if (!detections) {
        console.warn('[AdminDashboard] No face detected in frame');
        toast.error('No face detected. Please position face clearly and try again.');
        setCapturingFace(false);
        return;
      }

      const embedding = Array.from(detections.descriptor);
      console.log('[AdminDashboard] Face embedding created, length:', embedding.length);
      
      // If editing existing user, update their face immediately
      if (editingUser) {
        console.log('[AdminDashboard] Updating face for existing user:', editingUser.email);
        try {
          const response = await api.post('/admin/face/register', {
            userId: editingUser.id || editingUser._id,
            embedding: embedding
          });
          console.log('[AdminDashboard] Face update response:', response.data);
          toast.success('Face updated successfully!');
        } catch (error) {
          console.error('[AdminDashboard] Error updating face:', error.response?.data || error);
          toast.error('Failed to update face: ' + (error.response?.data?.error || error.message));
        }
        setEditingUser(null);
      } else {
        console.log('[AdminDashboard] Storing embedding for new user creation');
        // For new user creation, store embedding
        setFaceEmbedding(embedding);
        toast.success('Face captured successfully!');
      }
      
      // Stop video stream
      if (videoRef.current.srcObject) {
        console.log('[AdminDashboard] Stopping video stream...');
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      setShowFaceCapture(false);
      setCapturingFace(false);
      console.log('[AdminDashboard] Face capture process completed');
    } catch (error) {
      console.error('[AdminDashboard] Error processing face:', error);
      toast.error('Failed to process face: ' + error.message);
      setCapturingFace(false);
    }
  };

  const cancelFaceCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowFaceCapture(false);
    setCapturingFace(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    console.log('[AdminDashboard] handleCreateUser called');
    console.log('[AdminDashboard] User form data:', { ...userForm, password: '***' });
    console.log('[AdminDashboard] Student form data:', studentForm);
    console.log('[AdminDashboard] Face embedding exists:', !!faceEmbedding);
    
    // Validate face capture for students
    if (userForm.role === 'STUDENT' && !faceEmbedding) {
      console.error('[AdminDashboard] Student creation blocked: No face embedding');
      toast.error('Please capture student face before creating account');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...userForm };
      
      if (userForm.role === 'STUDENT' && studentForm.studentId) {
        payload.studentData = studentForm;
      }
      
      console.log('[AdminDashboard] Creating user via API...');
      const response = await api.post('/admin/users', payload);
      const createdUser = response.data.user;
      console.log('[AdminDashboard] User created successfully:', createdUser);
      
      // Register face for student
      if (userForm.role === 'STUDENT' && faceEmbedding) {
        console.log('[AdminDashboard] Registering face for student, userId:', createdUser.id);
        try {
          const faceResponse = await api.post('/admin/face/register', {
            userId: createdUser.id,
            embedding: faceEmbedding
          });
          console.log('[AdminDashboard] Face registered successfully:', faceResponse.data);
          toast.success('Student created and face registered successfully');
        } catch (faceError) {
          console.error('[AdminDashboard] Face registration error:', faceError.response?.data || faceError);
          toast.error('Student created but face registration failed');
        }
      } else {
        toast.success('User created successfully');
      }
      
      console.log('[AdminDashboard] Resetting form and fetching users...');
      setShowUserForm(false);
      setUserForm({ name: '', email: '', password: '', role: 'STUDENT' });
      setStudentForm({ studentId: '', department: '', year: 1, section: '' });
      setFaceEmbedding(null);
      fetchUsers();
    } catch (error) {
      console.error('[AdminDashboard] Error creating user:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
      console.log('[AdminDashboard] handleCreateUser completed');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/courses', courseForm);
      toast.success('Course created successfully');
      setShowCourseForm(false);
      setCourseForm({ code: '', name: '', department: '', year: 1, section: '', teacherId: '' });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/enrollments', enrollmentForm);
      toast.success('Enrollment created successfully');
      setShowEnrollmentForm(false);
      setEnrollmentForm({ studentId: '', courseId: '' });
      fetchEnrollments();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    console.log('[AdminDashboard] handleDeleteUser called for userId:', id);
    if (!confirm('Are you sure you want to delete this user?')) {
      console.log('[AdminDashboard] User deletion cancelled');
      return;
    }
    try {
      console.log('[AdminDashboard] Deleting user...');
      const response = await api.delete(`/admin/users/${id}`);
      console.log('[AdminDashboard] Delete response:', response.data);
      toast.success('User deleted successfully');
      console.log('[AdminDashboard] Fetching updated user list...');
      fetchUsers();
    } catch (error) {
      console.error('[AdminDashboard] Error deleting user:', error.response?.data || error);
      toast.error('Failed to delete user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteEnrollment = async (id) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;
    try {
      await api.delete(`/admin/enrollments/${id}`);
      toast.success('Enrollment deleted successfully');
      fetchEnrollments();
    } catch (error) {
      toast.error('Failed to delete enrollment');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = [
    { label: "Total Students", value: students.length.toString(), icon: GraduationCap },
    { label: "Total Teachers", value: users.filter(u => u.role === 'TEACHER').length.toString(), icon: Users },
    { label: "Total Courses", value: courses.length.toString(), icon: BookOpen },
    { label: "Active Sessions", value: "0", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black bg-white">
                <Settings className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">VerifAI System Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarFallback className="bg-gray-100 text-black">
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-black">{user?.name}</p>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">Admin</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-gray-300 hover:bg-gray-100">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-black">{stat.value}</h3>
                  </div>
                  <div className="p-3 rounded-lg border border-gray-200 bg-white">
                    <stat.icon className="w-5 h-5 text-black" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Tabs */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">System Management</CardTitle>
            <CardDescription className="text-gray-600">Manage users and courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black">Overview</TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black">Students & Users</TabsTrigger>
                <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-black">Courses</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">Quick Actions</h3>
                    <Separator className="bg-gray-200" />
                    <div className="space-y-3">
                      <Button className="w-full justify-start bg-black hover:bg-gray-800 text-white" onClick={() => { setActiveTab("users"); setShowUserForm(true); }}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Student User
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-gray-300 hover:bg-gray-100" onClick={() => { setActiveTab("courses"); setShowCourseForm(true); }}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create New Course
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-black">System Summary</h3>
                    <Separator className="bg-gray-200" />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Users</span>
                        <span className="font-semibold text-black">{users.length}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Students</span>
                        <span className="font-semibold text-black">{students.length}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Total Courses</span>
                        <span className="font-semibold text-black">{courses.length}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Total Teachers</span>
                        <span className="font-semibold text-black">{users.filter(u => u.role === 'TEACHER').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-black">Students & Users</h3>
                    <p className="text-sm text-gray-600">Create student accounts and assign them to courses</p>
                  </div>
                  {!showUserForm && (
                    <Button onClick={() => setShowUserForm(true)} className="bg-black hover:bg-gray-800 text-white">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  )}
                </div>
                <Separator className="bg-gray-200" />

                {/* User Creation Form */}
                {showUserForm && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-black">Create New User</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowUserForm(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-black">Full Name</Label>
                            <Input
                              id="name"
                              value={userForm.name}
                              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                              placeholder="Enter full name"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-black">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={userForm.email}
                              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                              placeholder="email@example.com"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-black">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={userForm.password}
                              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                              placeholder="Enter password"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-black">Role</Label>
                            <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="TEACHER">Teacher</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Student-specific fields */}
                        {userForm.role === 'STUDENT' && (
                          <>
                            <Separator className="bg-gray-200" />
                            <h4 className="text-sm font-semibold text-black">Student Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="studentId" className="text-black">Student ID</Label>
                                <Input
                                  id="studentId"
                                  value={studentForm.studentId}
                                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                                  placeholder="e.g., 2024001"
                                  required
                                  className="border-gray-300"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="department" className="text-black">Department</Label>
                                <Input
                                  id="department"
                                  value={studentForm.department}
                                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                                  placeholder="e.g., Computer Science"
                                  required
                                  className="border-gray-300"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="year" className="text-black">Year</Label>
                                <Select value={studentForm.year.toString()} onValueChange={(value) => setStudentForm({ ...studentForm, year: parseInt(value) })}>
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1st Year</SelectItem>
                                    <SelectItem value="2">2nd Year</SelectItem>
                                    <SelectItem value="3">3rd Year</SelectItem>
                                    <SelectItem value="4">4th Year</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="section" className="text-black">Section</Label>
                                <Input
                                  id="section"
                                  value={studentForm.section}
                                  onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                                  placeholder="e.g., A"
                                  required
                                  className="border-gray-300"
                                />
                              </div>
                            </div>
                            
                            <Separator className="bg-gray-200" />
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-black">Face Registration</Label>
                                  <p className="text-xs text-gray-600 mt-1">Required: Capture student's face for attendance</p>
                                </div>
                                {faceEmbedding ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Camera className="w-3 h-3 mr-1" />
                                    Face Captured
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-red-300 text-red-700">
                                    Not Captured
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                onClick={captureFace}
                                disabled={!modelsLoaded || capturingFace}
                                variant="outline"
                                className="w-full border-gray-300 hover:bg-gray-100"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                {faceEmbedding ? 'Re-capture Face' : 'Capture Face'}
                              </Button>
                            </div>
                          </>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create User'
                            )}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowUserForm(false)} className="border-gray-300">
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Users List */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-gray-100" />
                    ))}
                  </div>
                ) : users.length > 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="text-black">Name</TableHead>
                            <TableHead className="text-black">Email</TableHead>
                            <TableHead className="text-black">Role</TableHead>
                            <TableHead className="text-black text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user._id} className="border-gray-200">
                              <TableCell className="font-medium text-black">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-gray-200">
                                    <AvatarFallback className="bg-gray-100 text-black text-xs">
                                      {user.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  {user.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-gray-300 text-gray-700">
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {user.role === 'STUDENT' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingUser(user);
                                        captureFace();
                                      }}
                                      className="text-gray-600 hover:text-black hover:bg-gray-100"
                                      title="Register/Update Face"
                                    >
                                      <Camera className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="text-gray-600 hover:text-black hover:bg-gray-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  !showUserForm && (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full border border-gray-200">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-black">No Users Yet</h4>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                          Create your first user account to get started with the system
                        </p>
                      </div>
                      <Button onClick={() => setShowUserForm(true)} className="bg-black hover:bg-gray-800 text-white">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create First User
                      </Button>
                    </div>
                  )
                )}
              </TabsContent>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-black">Course Management</h3>
                    <p className="text-sm text-gray-600">Create courses, assign teachers, and enroll students</p>
                  </div>
                  {!showCourseForm && (
                    <Button onClick={() => setShowCourseForm(true)} className="bg-black hover:bg-gray-800 text-white">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Add Course
                    </Button>
                  )}
                </div>
                <Separator className="bg-gray-200" />

                {/* Course Creation Form */}
                {showCourseForm && (
                  <Card className="border-gray-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-black">Create New Course</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setShowCourseForm(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="code" className="text-black">Course Code</Label>
                            <Input
                              id="code"
                              value={courseForm.code}
                              onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                              placeholder="e.g., CS101"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="courseName" className="text-black">Course Name</Label>
                            <Input
                              id="courseName"
                              value={courseForm.name}
                              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                              placeholder="e.g., Introduction to Programming"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="courseDepartment" className="text-black">Department</Label>
                            <Input
                              id="courseDepartment"
                              value={courseForm.department}
                              onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                              placeholder="e.g., Computer Science"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="courseYear" className="text-black">Year</Label>
                            <Select value={courseForm.year.toString()} onValueChange={(value) => setCourseForm({ ...courseForm, year: parseInt(value) })}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="courseSection" className="text-black">Section</Label>
                            <Input
                              id="courseSection"
                              value={courseForm.section}
                              onChange={(e) => setCourseForm({ ...courseForm, section: e.target.value })}
                              placeholder="e.g., A"
                              required
                              className="border-gray-300"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="teacherId" className="text-black">Assign Teacher</Label>
                            <Select value={courseForm.teacherId} onValueChange={(value) => setCourseForm({ ...courseForm, teacherId: value })}>
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.filter(u => u.role === 'TEACHER').map((teacher) => (
                                  <SelectItem key={teacher._id} value={teacher._id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800 text-white">
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Course'
                            )}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowCourseForm(false)} className="border-gray-300">
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* Courses List */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-gray-100" />
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="text-black">Code</TableHead>
                            <TableHead className="text-black">Name</TableHead>
                            <TableHead className="text-black">Department</TableHead>
                            <TableHead className="text-black">Year/Section</TableHead>
                            <TableHead className="text-black">Teacher</TableHead>
                            <TableHead className="text-black text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {courses.map((course) => {
                            const teacher = users.find(u => u._id === course.teacherId);
                            return (
                              <TableRow key={course._id} className="border-gray-200">
                                <TableCell className="font-medium text-black">{course.code}</TableCell>
                                <TableCell className="text-gray-600">{course.name}</TableCell>
                                <TableCell className="text-gray-600">{course.department}</TableCell>
                                <TableCell className="text-gray-600">
                                  Year {course.year}, Section {course.section}
                                </TableCell>
                                <TableCell className="text-gray-600">{teacher?.name || 'Unassigned'}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCourse(course._id)}
                                    className="text-gray-600 hover:text-black hover:bg-gray-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  !showCourseForm && (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full border border-gray-200">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-black">No Courses Yet</h4>
                        <p className="text-sm text-gray-600 max-w-md mx-auto">
                          Create your first course to begin managing attendance
                        </p>
                      </div>
                      <Button onClick={() => setShowCourseForm(true)} className="bg-black hover:bg-gray-800 text-white">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create First Course
                      </Button>
                    </div>
                  )
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-black">Capture Student Face</CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelFaceCapture}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  width="640"
                  height="480"
                  className="w-full"
                />
                <canvas
                  ref={canvasRef}
                  width="640"
                  height="480"
                  className="absolute top-0 left-0 w-full"
                />
                {capturingFace && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                      <p className="text-white text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 text-center">
                {capturingFace ? 'Initializing camera...' : 'Position the student\'s face in the center of the frame'}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={processFaceCapture}
                  disabled={capturingFace}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Face
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelFaceCapture}
                  className="flex-1 border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
