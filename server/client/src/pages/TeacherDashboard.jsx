import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from '../services/api';
import {
  BookOpen,
  LogOut,
  Users,
  Calendar,
  Video,
  BarChart3
} from "lucide-react";

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/teacher/courses');
      const myCourses = response.data.courses || [];
      setCourses(myCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId) => {
    try {
      // Fetch enrollments for this course
      const enrollRes = await api.get('/admin/enrollments');
      const courseEnrollments = enrollRes.data.enrollments?.filter(e => e.courseId === courseId) || [];
      setEnrollments(courseEnrollments);
      
      // Fetch all students
      const studentsRes = await api.get('/admin/students');
      setStudents(studentsRes.data.students || []);
    } catch (error) {
      toast.error('Failed to fetch course students');
    }
  };

  const handleViewCourseDetails = async (course) => {
    setSelectedCourse(course);
    await fetchCourseStudents(course._id);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartAttendance = (courseId) => {
    navigate(`/teacher/attendance?courseId=${courseId}`);
  };

  const handleViewReports = async (course) => {
    console.log('[TeacherDashboard] handleViewReports called for course:', course.code);
    setSelectedCourse(course);
    setShowReports(true);
    setSelectedSession(null);
    setSessionDetails(null);
    await fetchAttendanceSessions(course._id);
  };

  const fetchAttendanceSessions = async (courseId) => {
    console.log('[TeacherDashboard] fetchAttendanceSessions called for courseId:', courseId);
    setLoadingReports(true);
    try {
      const response = await api.get(`/attendance/course/${courseId}/sessions`);
      console.log('[TeacherDashboard] Fetched', response.data.sessions?.length || 0, 'sessions');
      setAttendanceSessions(response.data.sessions || []);
    } catch (error) {
      console.error('[TeacherDashboard] Error fetching sessions:', error);
      toast.error('Failed to fetch attendance sessions');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    console.log('[TeacherDashboard] fetchSessionDetails called for sessionId:', sessionId);
    setLoadingReports(true);
    try {
      const response = await api.get(`/attendance/session/${sessionId}/details`);
      console.log('[TeacherDashboard] Session details:', response.data);
      setSessionDetails(response.data);
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('[TeacherDashboard] Error fetching session details:', error);
      toast.error('Failed to fetch session details');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setSessionDetails(null);
  };

  const handleCloseReports = () => {
    setShowReports(false);
    setSelectedCourse(null);
    setAttendanceSessions([]);
    setSelectedSession(null);
    setSessionDetails(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black bg-white">
                <BookOpen className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your courses and attendance</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarFallback className="bg-gray-100 text-black">
                    {user?.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-black">{user?.name}</p>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">Teacher</Badge>
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <h3 className="text-2xl font-bold text-black">{courses.length}</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <BookOpen className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                  <h3 className="text-2xl font-bold text-black">0</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <Video className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <h3 className="text-2xl font-bold text-black">--</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <BarChart3 className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-black">Your Courses</CardTitle>
                <CardDescription className="text-gray-600">Manage and take attendance for your courses</CardDescription>
              </div>
              <Button onClick={() => navigate('/teacher/attendance')} className="bg-black hover:bg-gray-800 text-white">
                <Video className="w-4 h-4 mr-2" />
                Take Attendance
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Card key={course._id} className="border-gray-200">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg text-black">{course.name}</CardTitle>
                          <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                            {course.code}
                          </Badge>
                        </div>
                        <div className="p-2 rounded-lg border border-gray-200 bg-white">
                          <BookOpen className="w-4 h-4 text-black" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2 text-sm">
                        {course.schedule && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {course.schedule}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>View enrollment details</span>
                        </div>
                      </div>
                      <Separator className="bg-gray-100" />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleStartAttendance(course._id)}
                          className="flex-1 bg-black hover:bg-gray-800 text-white"
                          size="sm"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Take Attendance
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-gray-300 hover:bg-gray-100"
                          onClick={() => handleViewReports(course)}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Reports
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full border border-gray-200 bg-gray-50">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-black">No Courses Assigned</h4>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Contact your administrator to get courses assigned to you
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Guide */}
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-black">Quick Guide</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <span className="text-sm font-semibold text-black">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Select a Course</h4>
                  <p className="text-sm text-gray-600">Choose the course you want to take attendance for</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <span className="text-sm font-semibold text-black">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Start Session</h4>
                  <p className="text-sm text-gray-600">Click "Take Attendance" to start a live attendance session</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <span className="text-sm font-semibold text-black">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Allow Camera Access</h4>
                  <p className="text-sm text-gray-600">The system will use your camera to recognize students' faces</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center">
                  <span className="text-sm font-semibold text-black">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Close Session</h4>
                  <p className="text-sm text-gray-600">When done, close the session to finalize attendance records</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Reports Modal */}
      {showReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-black">
                    {selectedSession ? 'Session Details' : 'Attendance Reports'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCourse?.code} - {selectedCourse?.name}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCloseReports} className="border-gray-300 hover:bg-gray-100">
                  Close
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingReports ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : selectedSession && sessionDetails ? (
                /* Session Details View */
                <div className="space-y-6">
                  <Button variant="outline" size="sm" onClick={handleBackToSessions} className="border-gray-300 hover:bg-gray-100">
                    ← Back to Sessions
                  </Button>

                  {/* Session Info */}
                  <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-black">Session Information</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="font-semibold text-black">
                            {new Date(sessionDetails.session.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="font-semibold text-black">
                            {new Date(sessionDetails.session.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Present</p>
                          <p className="font-semibold text-green-600">{sessionDetails.stats.present}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Absent</p>
                          <p className="font-semibold text-red-600">{sessionDetails.stats.absent}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Students Table */}
                  <Card className="border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                      <CardTitle className="text-black">Student Attendance ({sessionDetails.students.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Student ID</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionDetails.students.map((student) => (
                              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-900">{student.studentId}</td>
                                <td className="py-3 px-4 text-sm text-gray-900">{student.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-600">{student.email}</td>
                                <td className="py-3 px-4 text-center">
                                  <Badge
                                    variant="outline"
                                    className={
                                      student.status === 'PRESENT'
                                        ? 'border-green-300 text-green-700 bg-green-50'
                                        : 'border-red-300 text-red-700 bg-red-50'
                                    }
                                  >
                                    {student.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                  {student.timestamp ? new Date(student.timestamp).toLocaleTimeString() : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* Sessions List View */
                <div className="space-y-4">
                  {attendanceSessions.length > 0 ? (
                    attendanceSessions.map((session) => (
                      <Card
                        key={session.id}
                        className="border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                        onClick={() => fetchSessionDetails(session.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-black bg-white">
                                  <Calendar className="w-6 h-6 text-black" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-black text-lg">
                                    {new Date(session.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {new Date(session.startTime).toLocaleTimeString()} -{' '}
                                    {session.endTime ? new Date(session.endTime).toLocaleTimeString() : 'Ongoing'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 ml-6">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{session.presentCount}</p>
                                <p className="text-xs text-gray-600">Present</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{session.absentCount}</p>
                                <p className="text-xs text-gray-600">Absent</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-black">{session.attendancePercentage}%</p>
                                <p className="text-xs text-gray-600">Attendance</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  session.status === 'ACTIVE'
                                    ? 'border-green-300 text-green-700 bg-green-50'
                                    : 'border-gray-300 text-gray-700'
                                }
                              >
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full border border-gray-200 bg-gray-50">
                          <BarChart3 className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-black">No Attendance Sessions</h4>
                        <p className="text-sm text-gray-600">No attendance has been taken for this course yet</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
