import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as faceapi from 'face-api.js';
import api from '../services/api';
import DashboardNav from '../components/DashboardNav';
import { Users, BookOpen, UserPlus, GraduationCap, Settings, Activity, Loader2, X, Trash2, Camera } from "lucide-react";

const StatCard = ({ label, value, icon: Icon, colorClass, iconClass, iconColor }) => (
  <Card className={`rounded-2xl ${colorClass}`}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white/45 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${iconClass}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [userForm, setUserForm] = useState({ name:'', email:'', password:'', role:'STUDENT' });
  const [studentForm, setStudentForm] = useState({ studentId:'', department:'', year:1, section:'' });
  const [courseForm, setCourseForm] = useState({ code:'', name:'', department:'', year:1, section:'', teacherId:'' });
  const [enrollmentForm, setEnrollmentForm] = useState({ studentId:'', courseId:'' });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [faceEmbedding, setFaceEmbedding] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { loadFaceModels(); }, []);
  useEffect(() => {
    if (activeTab==='users') fetchUsers();
    else if (activeTab==='courses') fetchCourses();
    else if (activeTab==='enrollments') fetchEnrollments();
    else if (activeTab==='overview') fetchStats();
  }, [activeTab]);

  const loadFaceModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setModelsLoaded(true);
    } catch { toast.error('Face recognition models not loaded'); }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [uR, sR, cR] = await Promise.all([api.get('/admin/users'), api.get('/admin/students'), api.get('/admin/courses')]);
      setUsers(uR.data.users||[]); setStudents(sR.data.students||[]); setCourses(cR.data.courses||[]);
    } catch { toast.error('Failed to fetch statistics'); } finally { setLoading(false); }
  };
  const fetchUsers = async () => { setLoading(true); try { const r=await api.get('/admin/users'); setUsers(r.data.users||[]); } catch { toast.error('Failed'); } finally { setLoading(false); }};
  const fetchCourses = async () => { setLoading(true); try { const r=await api.get('/admin/courses'); setCourses(r.data.courses||[]); } catch { toast.error('Failed'); } finally { setLoading(false); }};
  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const r=await api.get('/admin/enrollments'); setEnrollments(r.data.enrollments||[]);
      const [sR,cR]=await Promise.all([api.get('/admin/students'),api.get('/admin/courses')]);
      setStudents(sR.data.students||[]); setCourses(cR.data.courses||[]);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const captureFace = async () => {
    if (!modelsLoaded) { toast.error('Face models not loaded yet'); return; }
    setShowFaceCapture(true); setCapturingFace(true);
    await new Promise(r=>setTimeout(r,100));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video:{width:640,height:480}});
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setCapturingFace(false); toast.success('Camera ready'); };
      }
    } catch { toast.error('Failed to access camera.'); setShowFaceCapture(false); setCapturingFace(false); }
  };

  const processFaceCapture = async () => {
    if (!videoRef.current) { toast.error('Video not ready'); return; }
    setCapturingFace(true);
    try {
      const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
      if (!det) { toast.error('No face detected. Try again.'); setCapturingFace(false); return; }
      const embedding = Array.from(det.descriptor);
      if (editingUser) {
        await api.post('/admin/face/register', {userId:editingUser.id||editingUser._id, embedding});
        toast.success('Face updated!'); setEditingUser(null);
      } else { setFaceEmbedding(embedding); toast.success('Face captured!'); }
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
      setShowFaceCapture(false); setCapturingFace(false);
    } catch (err) { toast.error('Failed: '+err.message); setCapturingFace(false); }
  };

  const cancelFaceCapture = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t=>t.stop());
    setShowFaceCapture(false); setCapturingFace(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (userForm.role==='STUDENT' && !faceEmbedding) { toast.error('Please capture student face'); return; }
    setLoading(true);
    try {
      const payload = {...userForm};
      if (userForm.role==='STUDENT' && studentForm.studentId) payload.studentData = studentForm;
      const r = await api.post('/admin/users', payload);
      if (userForm.role==='STUDENT' && faceEmbedding) {
        try { await api.post('/admin/face/register',{userId:r.data.user.id,embedding:faceEmbedding}); toast.success('Student created & face registered'); }
        catch { toast.error('Student created but face failed'); }
      } else { toast.success('User created'); }
      setShowUserForm(false);
      setUserForm({name:'',email:'',password:'',role:'STUDENT'});
      setStudentForm({studentId:'',department:'',year:1,section:''});
      setFaceEmbedding(null); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error||'Failed to create user'); }
    finally { setLoading(false); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/admin/courses', courseForm); toast.success('Course created'); setShowCourseForm(false); setCourseForm({code:'',name:'',department:'',year:1,section:'',teacherId:''}); fetchCourses(); }
    catch (err) { toast.error(err.response?.data?.error||'Failed'); } finally { setLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('Deleted'); fetchUsers(); }
    catch (err) { toast.error('Failed: '+(err.response?.data?.error||err.message)); }
  };
  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    try { await api.delete(`/admin/courses/${id}`); toast.success('Deleted'); fetchCourses(); }
    catch { toast.error('Failed'); }
  };
  const handleLogout = () => { logout(); navigate('/login'); };

  const stats = [
    {label:'Total Students', value:students.length, icon:GraduationCap, colorClass:'stat-violet', iconClass:'icon-violet', iconColor:'text-violet-400'},
    {label:'Total Teachers', value:users.filter(u=>u.role==='TEACHER').length, icon:Users, colorClass:'stat-blue', iconClass:'icon-blue', iconColor:'text-blue-400'},
    {label:'Total Courses', value:courses.length, icon:BookOpen, colorClass:'stat-green', iconClass:'icon-green', iconColor:'text-green-400'},
    {label:'Active Sessions', value:0, icon:Activity, colorClass:'stat-amber', iconClass:'icon-amber', iconColor:'text-amber-400'},
  ];

  const roleBadge = {ADMIN:'badge-admin',TEACHER:'badge-teacher',STUDENT:'badge-student'};

  return (
    <div className="min-h-screen relative" style={{background:'#06060f'}}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="relative z-10">
        <DashboardNav user={user} icon={Settings} title="Admin Dashboard" subtitle="VerifAI System Management" onLogout={handleLogout} />

        <main className="container mx-auto px-6 py-7 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in-up">
            {stats.map((s,i) => <StatCard key={i} {...s} />)}
          </div>

          {/* Tabs Card */}
          <Card className="rounded-2xl fade-in-up-2">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-sm font-semibold text-white">System Management</CardTitle>
              <p className="text-xs text-white/35">Manage users and courses</p>
            </CardHeader>
            <CardContent className="p-6 pt-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Students & Users</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                </TabsList>

                {/* OVERVIEW */}
                <TabsContent value="overview" className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">Quick Actions</h3>
                      <Separator />
                      <div className="space-y-2">
                        <Button className="w-full justify-start h-10 rounded-xl text-sm font-semibold"
                          onClick={()=>{setActiveTab("users");setShowUserForm(true);}}>
                          <UserPlus className="w-4 h-4 mr-2" />Create Student User
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-10 rounded-xl text-sm"
                          onClick={()=>{setActiveTab("courses");setShowCourseForm(true);}}>
                          <BookOpen className="w-4 h-4 mr-2" />Create New Course
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-white/60 uppercase tracking-widest">System Summary</h3>
                      <Separator />
                      {[['Total Users',users.length],['Total Students',students.length],['Total Courses',courses.length],['Total Teachers',users.filter(u=>u.role==='TEACHER').length]].map(([l,v])=>(
                        <div key={l} className="flex justify-between py-2 border-b text-sm" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                          <span className="text-white/45">{l}</span>
                          <span className="font-bold text-white">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* USERS */}
                <TabsContent value="users" className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Students & Users</h3>
                      <p className="text-xs text-white/35">Create accounts and manage roles</p>
                    </div>
                    {!showUserForm && (
                      <Button className="h-9 rounded-xl text-xs font-semibold" onClick={()=>setShowUserForm(true)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />Add User
                      </Button>
                    )}
                  </div>
                  <Separator />

                  {showUserForm && (
                    <Card className="rounded-2xl">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-white">Create New User</CardTitle>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={()=>setShowUserForm(false)}><X className="w-3.5 h-3.5"/></Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label>Full Name</Label><Input value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} placeholder="Enter full name" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} placeholder="email@example.com" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} placeholder="Enter password" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Role</Label>
                              <Select value={userForm.role} onValueChange={v=>setUserForm({...userForm,role:v})}>
                                <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue/></SelectTrigger>
                                <SelectContent><SelectItem value="STUDENT">Student</SelectItem><SelectItem value="TEACHER">Teacher</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
                              </Select>
                            </div>
                          </div>

                          {userForm.role==='STUDENT' && (<>
                            <Separator/>
                            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Student Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5"><Label>Student ID</Label><Input value={studentForm.studentId} onChange={e=>setStudentForm({...studentForm,studentId:e.target.value})} placeholder="e.g. 2024001" required className="h-9 rounded-xl text-sm"/></div>
                              <div className="space-y-1.5"><Label>Department</Label><Input value={studentForm.department} onChange={e=>setStudentForm({...studentForm,department:e.target.value})} placeholder="e.g. Computer Science" required className="h-9 rounded-xl text-sm"/></div>
                              <div className="space-y-1.5"><Label>Year</Label>
                                <Select value={studentForm.year.toString()} onValueChange={v=>setStudentForm({...studentForm,year:parseInt(v)})}>
                                  <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue/></SelectTrigger>
                                  <SelectContent>{['1st','2nd','3rd','4th'].map((y,i)=><SelectItem key={i} value={String(i+1)}>{y} Year</SelectItem>)}</SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5"><Label>Section</Label><Input value={studentForm.section} onChange={e=>setStudentForm({...studentForm,section:e.target.value})} placeholder="e.g. A" required className="h-9 rounded-xl text-sm"/></div>
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between">
                              <div><p className="text-xs font-medium text-white/65">Face Registration</p><p className="text-xs text-white/30 mt-0.5">Required for AI attendance recognition</p></div>
                              {faceEmbedding
                                ? <span className="badge-student px-2 py-0.5 rounded text-xs font-semibold">✓ Captured</span>
                                : <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.25)'}}>Not Captured</span>
                              }
                            </div>
                            <Button type="button" variant="outline" className="w-full h-9 rounded-xl text-sm" onClick={captureFace} disabled={!modelsLoaded||capturingFace}>
                              <Camera className="w-3.5 h-3.5 mr-2"/>{faceEmbedding?'Re-capture Face':'Capture Face'}
                            </Button>
                          </>)}

                          <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={loading} className="h-9 rounded-xl text-sm font-semibold">
                              {loading?<><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin"/>Creating...</>:'Create User'}
                            </Button>
                            <Button type="button" variant="outline" className="h-9 rounded-xl text-sm" onClick={()=>setShowUserForm(false)}>Cancel</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {loading ? (
                    <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 rounded-xl"/>)}</div>
                  ) : users.length > 0 ? (
                    <Card className="rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {users.map(u=>(
                            <TableRow key={u._id}>
                              <TableCell><div className="flex items-center gap-2.5"><Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{u.name?.charAt(0)}</AvatarFallback></Avatar><span className="text-sm font-medium text-white">{u.name}</span></div></TableCell>
                              <TableCell className="text-sm text-white/45">{u.email}</TableCell>
                              <TableCell><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${roleBadge[u.role]||''}`}>{u.role}</span></TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {u.role==='STUDENT'&&(<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/35 hover:text-violet-400" onClick={()=>{setEditingUser(u);captureFace();}}><Camera className="w-3.5 h-3.5"/></Button>)}
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/35 hover:text-red-400" onClick={()=>handleDeleteUser(u._id)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ) : !showUserForm && (
                    <div className="text-center py-14">
                      <div className="w-12 h-12 rounded-2xl icon-violet border flex items-center justify-center mx-auto mb-3"><Users className="w-5 h-5 text-violet-400"/></div>
                      <p className="text-sm font-semibold text-white mb-1">No Users Yet</p>
                      <p className="text-xs text-white/30 mb-4">Create your first user to get started</p>
                      <Button className="h-9 rounded-xl text-sm font-semibold" onClick={()=>setShowUserForm(true)}><UserPlus className="w-3.5 h-3.5 mr-2"/>Create First User</Button>
                    </div>
                  )}
                </TabsContent>

                {/* COURSES */}
                <TabsContent value="courses" className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-sm font-semibold text-white">Course Management</h3><p className="text-xs text-white/35">Create courses, assign teachers, enroll students</p></div>
                    {!showCourseForm&&(<Button className="h-9 rounded-xl text-xs font-semibold" onClick={()=>setShowCourseForm(true)}><BookOpen className="w-3.5 h-3.5 mr-1.5"/>Add Course</Button>)}
                  </div>
                  <Separator/>

                  {showCourseForm && (
                    <Card className="rounded-2xl">
                      <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm text-white">Create New Course</CardTitle><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={()=>setShowCourseForm(false)}><X className="w-3.5 h-3.5"/></Button></div></CardHeader>
                      <CardContent>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label>Course Code</Label><Input value={courseForm.code} onChange={e=>setCourseForm({...courseForm,code:e.target.value})} placeholder="e.g. CS101" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Course Name</Label><Input value={courseForm.name} onChange={e=>setCourseForm({...courseForm,name:e.target.value})} placeholder="e.g. Introduction to Programming" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Department</Label><Input value={courseForm.department} onChange={e=>setCourseForm({...courseForm,department:e.target.value})} placeholder="e.g. Computer Science" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Section</Label><Input value={courseForm.section} onChange={e=>setCourseForm({...courseForm,section:e.target.value})} placeholder="e.g. A" required className="h-9 rounded-xl text-sm"/></div>
                            <div className="space-y-1.5"><Label>Year</Label>
                              <Select value={courseForm.year.toString()} onValueChange={v=>setCourseForm({...courseForm,year:parseInt(v)})}>
                                <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue/></SelectTrigger>
                                <SelectContent>{['1st','2nd','3rd','4th'].map((y,i)=><SelectItem key={i} value={String(i+1)}>{y} Year</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Assign Teacher</Label>
                              <Select value={courseForm.teacherId} onValueChange={v=>setCourseForm({...courseForm,teacherId:v})}>
                                <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue placeholder="Select teacher"/></SelectTrigger>
                                <SelectContent>{users.filter(u=>u.role==='TEACHER').map(t=><SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={loading} className="h-9 rounded-xl text-sm font-semibold">{loading?<><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin"/>Creating...</>:'Create Course'}</Button>
                            <Button type="button" variant="outline" className="h-9 rounded-xl text-sm" onClick={()=>setShowCourseForm(false)}>Cancel</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {loading?(
                    <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 rounded-xl"/>)}</div>
                  ):courses.length>0?(
                    <Card className="rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Dept</TableHead><TableHead>Year/Sec</TableHead><TableHead>Teacher</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {courses.map(c=>{
                            const t=users.find(u=>u._id===c.teacherId);
                            return(<TableRow key={c._id}>
                              <TableCell className="font-bold text-violet-300 text-sm">{c.code}</TableCell>
                              <TableCell className="text-sm text-white/75">{c.name}</TableCell>
                              <TableCell className="text-sm text-white/45">{c.department}</TableCell>
                              <TableCell className="text-sm text-white/45">Y{c.year}·§{c.section}</TableCell>
                              <TableCell className="text-sm text-white/45">{t?.name||<span className="text-white/20">Unassigned</span>}</TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/35 hover:text-red-400" onClick={()=>handleDeleteCourse(c._id)}><Trash2 className="w-3.5 h-3.5"/></Button></TableCell>
                            </TableRow>);
                          })}
                        </TableBody>
                      </Table>
                    </Card>
                  ):!showCourseForm&&(
                    <div className="text-center py-14">
                      <div className="w-12 h-12 rounded-2xl icon-green border flex items-center justify-center mx-auto mb-3"><BookOpen className="w-5 h-5 text-green-400"/></div>
                      <p className="text-sm font-semibold text-white mb-1">No Courses Yet</p>
                      <p className="text-xs text-white/30 mb-4">Create your first course to begin</p>
                      <Button className="h-9 rounded-xl text-sm font-semibold" onClick={()=>setShowCourseForm(true)}><BookOpen className="w-3.5 h-3.5 mr-2"/>Create First Course</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Face Modal */}
      {showFaceCapture&&(
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background:'rgba(0,0,0,0.8)',backdropFilter:'blur(12px)'}}>
          <Card className="w-full max-w-md rounded-2xl">
            <CardHeader className="border-b pb-4" style={{borderColor:'rgba(255,255,255,0.07)'}}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white">Capture Student Face</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={cancelFaceCapture}><X className="w-3.5 h-3.5"/></Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black" style={{aspectRatio:'4/3'}}>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"/>
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"/>
                {capturingFace&&(
                  <div className="absolute inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.65)'}}>
                    <div className="text-center"><Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-2"/><p className="text-xs text-white/50">Starting camera...</p></div>
                  </div>
                )}
                {!capturingFace&&(
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-44 rounded-full border-2 border-dashed border-violet-400/40"/>
                  </div>
                )}
              </div>
              <p className="text-xs text-center text-white/35">{capturingFace?'Initializing camera...':'Position face within the circle and press Capture'}</p>
              <div className="flex gap-2">
                <Button onClick={processFaceCapture} disabled={capturingFace} className="flex-1 h-9 rounded-xl text-sm font-semibold"><Camera className="w-3.5 h-3.5 mr-2"/>Capture Face</Button>
                <Button variant="outline" onClick={cancelFaceCapture} className="flex-1 h-9 rounded-xl text-sm">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
