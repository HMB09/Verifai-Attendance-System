import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from '../services/api';
import DashboardNav from '../components/DashboardNav';
import { GraduationCap, Calendar, CheckCircle, XCircle, TrendingUp, BookOpen } from "lucide-react";

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

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total:0, present:0, percentage:0 });
  const [courseAttendance, setCourseAttendance] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/student/profile');
      setStudent(profileRes.data.student);
      const attRes = await api.get('/student/attendance');
      setAttendance(attRes.data.records||[]);
      setStats(attRes.data.stats||{total:0,present:0,percentage:0});
      setCourseAttendance(attRes.data.courseAttendance||[]);
    } catch (err) { toast.error('Failed to fetch dashboard data'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const pctColor = (p) => p>=75?'text-green-400':p>=50?'text-amber-400':'text-red-400';

  return (
    <div className="min-h-screen relative" style={{background:'#06060f'}}>
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="relative z-10">
        <DashboardNav user={user} icon={GraduationCap} title="Student Dashboard" subtitle="View your attendance records" onLogout={handleLogout} />

        <main className="container mx-auto px-6 py-7 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-in-up">
            <StatCard label="Total Classes"   value={stats.total}           icon={Calendar}   colorClass="stat-violet" iconClass="icon-violet" iconColor="text-violet-400" />
            <StatCard label="Present"         value={stats.present}         icon={CheckCircle} colorClass="stat-green"  iconClass="icon-green"  iconColor="text-green-400" />
            <StatCard label="Attendance Rate" value={`${stats.percentage}%`} icon={TrendingUp}  colorClass={stats.percentage>=75?'stat-green':stats.percentage>=50?'stat-amber':'stat-blue'} iconClass={stats.percentage>=75?'icon-green':stats.percentage>=50?'icon-amber':'icon-blue'} iconColor={stats.percentage>=75?'text-green-400':stats.percentage>=50?'text-amber-400':'text-blue-400'} />
          </div>

          {/* Student Info */}
          {student && (
            <Card className="rounded-2xl fade-in-up-2">
              <CardHeader className="px-6 pt-5 pb-3">
                <CardTitle className="text-sm font-semibold text-white">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    {label:'Student ID', value:student.studentId},
                    {label:'Department', value:student.department},
                    {label:'Year',       value:student.year},
                    {label:'Section',    value:student.section},
                  ].map(({label,value})=>(
                    <div key={label} className="rounded-xl p-3" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
                      <p className="text-xs text-white/35 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Attendance */}
          <Card className="rounded-2xl fade-in-up-3">
            <CardHeader className="px-6 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-white">Course Attendance</CardTitle>
              <p className="text-xs text-white/35">Your attendance percentage for each course</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2].map(i=><Skeleton key={i} className="h-36 rounded-2xl"/>)}
                </div>
              ) : courseAttendance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseAttendance.map(course => (
                    <div key={course.courseId} className="rounded-2xl p-5"
                      style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{course.courseName}</h3>
                          <span className="badge-teacher px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">{course.courseCode}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${pctColor(course.percentage)}`}>{course.percentage}%</div>
                          <p className="text-xs text-white/30">attendance</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full mb-3" style={{background:'rgba(255,255,255,0.07)'}}>
                        <div className={`h-full rounded-full transition-all`}
                          style={{
                            width:`${course.percentage}%`,
                            background: course.percentage>=75
                              ? 'linear-gradient(90deg,#10b981,#34d399)'
                              : course.percentage>=50
                              ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                              : 'linear-gradient(90deg,#ef4444,#f87171)'
                          }} />
                      </div>

                      <Separator style={{background:'rgba(255,255,255,0.06)'}} />
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-xs text-white/35">Total Sessions</p>
                          <p className="font-bold text-white text-lg">{course.totalSessions}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/35">Attended</p>
                          <p className="font-bold text-green-400 text-lg">{course.attended}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-12 h-12 rounded-2xl icon-violet border flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">No Courses Found</p>
                  <p className="text-xs text-white/30 max-w-xs mx-auto">No courses are currently assigned to your department, year, and section</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card className="rounded-2xl fade-in-up-4">
            <CardHeader className="px-6 pt-5 pb-3">
              <CardTitle className="text-sm font-semibold text-white">Attendance History</CardTitle>
              <p className="text-xs text-white/35">Your recent attendance records</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-12 rounded-xl"/>)}</div>
              ) : attendance.length > 0 ? (
                <Card className="rounded-2xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map(record => (
                        <TableRow key={record._id}>
                          <TableCell className="text-sm font-medium text-white">{record.sessionId?.courseId?.name||'N/A'}</TableCell>
                          <TableCell className="text-sm text-white/45">{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                          <TableCell className="text-sm text-white/45">{new Date(record.timestamp).toLocaleTimeString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${record.status==='PRESENT'?'badge-active':''}`}
                              style={record.status!=='PRESENT'?{background:'rgba(239,68,68,0.12)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.25)'}:{}}>
                              {record.status==='PRESENT'?<CheckCircle className="w-3 h-3"/>:<XCircle className="w-3 h-3"/>}
                              {record.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-student">{record.markedBy}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <div className="text-center py-14">
                  <div className="w-12 h-12 rounded-2xl icon-violet border flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">No Attendance Records</p>
                  <p className="text-xs text-white/30">Your records will appear here once you start attending classes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
