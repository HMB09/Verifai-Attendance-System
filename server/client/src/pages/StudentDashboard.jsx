import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from '../services/api';
import {
  GraduationCap,
  LogOut,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  BookOpen
} from "lucide-react";

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });
  const [courseAttendance, setCourseAttendance] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('[StudentDashboard] fetchData called');
    setLoading(true);
    try {
      // Get student profile
      console.log('[StudentDashboard] Fetching student profile...');
      const profileRes = await api.get('/student/profile');
      const studentData = profileRes.data.student;
      console.log('[StudentDashboard] Student profile:', studentData);
      setStudent(studentData);

      // Get attendance records with stats
      console.log('[StudentDashboard] Fetching attendance records...');
      const attendanceRes = await api.get('/student/attendance');
      const records = attendanceRes.data.records || [];
      const statsData = attendanceRes.data.stats || { total: 0, present: 0, percentage: 0 };
      const courseAttendanceData = attendanceRes.data.courseAttendance || [];
      console.log('[StudentDashboard] Attendance records:', records.length);
      console.log('[StudentDashboard] Stats:', statsData);
      console.log('[StudentDashboard] Course attendance:', courseAttendanceData);
      
      setAttendance(records);
      setStats(statsData);
      setCourseAttendance(courseAttendanceData);

    } catch (error) {
      console.error('[StudentDashboard] Error fetching data:', error.response?.data || error);
      toast.error('Failed to fetch dashboard data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black bg-white">
                <GraduationCap className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">Student Dashboard</h1>
                <p className="text-sm text-gray-600">View your attendance records</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarFallback className="bg-gray-100 text-black">
                    {user?.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-black">{user?.name}</p>
                  <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">Student</Badge>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <h3 className="text-2xl font-bold text-black">{stats.total}</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <Calendar className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <h3 className="text-2xl font-bold text-black">{stats.present}</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <CheckCircle className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <h3 className="text-2xl font-bold text-black">{stats.percentage}%</h3>
                </div>
                <div className="p-3 rounded-lg border border-gray-200 bg-white">
                  <TrendingUp className="w-5 h-5 text-black" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Info */}
        {student && (
          <Card className="border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-black">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Student ID</p>
                  <p className="font-semibold text-black">{student.studentId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-black">{student.department}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold text-black">{student.year}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Section</p>
                  <p className="font-semibold text-black">{student.section}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course-wise Attendance */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-black">Course Attendance</CardTitle>
            <CardDescription className="text-gray-600">Your attendance percentage for each course</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : courseAttendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courseAttendance.map((course) => (
                  <Card key={course.courseId} className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-black text-lg">{course.courseName}</h3>
                            <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs mt-2">
                              {course.courseCode}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              course.percentage >= 75 ? 'text-green-600' : 
                              course.percentage >= 50 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {course.percentage}%
                            </div>
                            <p className="text-xs text-gray-600 mt-1">Attendance</p>
                          </div>
                        </div>
                        <Separator className="bg-gray-100" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Sessions</p>
                            <p className="font-semibold text-black text-lg">{course.totalSessions}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Attended</p>
                            <p className="font-semibold text-green-600 text-lg">{course.attended}</p>
                          </div>
                        </div>
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
                  <h4 className="text-lg font-semibold text-black">No Courses Found</h4>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    No courses are currently assigned to your department, year, and section
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-black">Attendance History</CardTitle>
            <CardDescription className="text-gray-600">Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : attendance.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="text-black font-semibold">Course</TableHead>
                      <TableHead className="text-black font-semibold">Date</TableHead>
                      <TableHead className="text-black font-semibold">Time</TableHead>
                      <TableHead className="text-black font-semibold">Status</TableHead>
                      <TableHead className="text-black font-semibold">Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record._id} className="border-gray-100">
                        <TableCell className="font-medium text-black">
                          {record.sessionId?.courseId?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={record.status === 'PRESENT' ? 'border-gray-300 text-black bg-gray-50' : 'border-gray-300 text-gray-600'}
                          >
                            {record.status === 'PRESENT' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                            {record.markedBy}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full border border-gray-200 bg-gray-50">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-black">No Attendance Records</h4>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    Your attendance records will appear here once you start attending classes
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
