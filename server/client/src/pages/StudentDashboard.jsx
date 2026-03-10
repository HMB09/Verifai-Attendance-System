import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from '../services/api';
import { GraduationCap, LogOut, Calendar, CheckCircle, XCircle, TrendingUp, BookOpen, User } from "lucide-react";

const GlassNav = ({ user, onLogout }) => (
  <header className="sticky top-0 z-40" style={{ background: 'rgba(6,6,16,0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.07)', fontFamily: "'DM Sans', sans-serif" }}>
    <div className="container mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.5), rgba(6,182,212,0.4))', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 16px rgba(16,185,129,0.2)' }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: 'white', letterSpacing: '-0.02em' }}>Student Dashboard</h1>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>View your attendance records</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Avatar className="h-7 w-7"><AvatarFallback style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.5), rgba(6,182,212,0.4))', color: 'white', fontSize: '0.75rem', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{user?.name?.charAt(0) || 'S'}</AvatarFallback></Avatar>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{user?.name}</p>
            <p style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>Student</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} style={{ borderRadius: '10px', fontSize: '0.8rem' }}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
        </Button>
      </div>
    </div>
  </header>
);

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });
  const [courseAttendance, setCourseAttendance] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get('/student/profile');
      setStudent(profileRes.data.student);
      const attendanceRes = await api.get('/student/attendance');
      setAttendance(attendanceRes.data.records || []);
      setStats(attendanceRes.data.stats || { total: 0, present: 0, percentage: 0 });
      setCourseAttendance(attendanceRes.data.courseAttendance || []);
    } catch (e) { toast.error('Failed to fetch dashboard data: ' + (e.response?.data?.error || e.message)); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const statsData = [
    { label: 'Total Classes', value: stats.total, icon: Calendar, iconColor: '#93c5fd', iconBg: 'rgba(59,130,246,0.15)', iconBorder: 'rgba(59,130,246,0.3)' },
    { label: 'Present', value: stats.present, icon: CheckCircle, iconColor: '#6ee7b7', iconBg: 'rgba(16,185,129,0.15)', iconBorder: 'rgba(16,185,129,0.3)' },
    { label: 'Attendance Rate', value: `${stats.percentage}%`, icon: TrendingUp,
      iconColor: stats.percentage >= 75 ? '#6ee7b7' : stats.percentage >= 50 ? '#fcd34d' : '#fca5a5',
      iconBg: stats.percentage >= 75 ? 'rgba(16,185,129,0.15)' : stats.percentage >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
      iconBorder: stats.percentage >= 75 ? 'rgba(16,185,129,0.3)' : stats.percentage >= 50 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)',
    },
  ];

  const getAttendanceColor = (pct) => {
    if (pct >= 75) return { val: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', ring: 'rgba(16,185,129,0.6)' };
    if (pct >= 50) return { val: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', ring: 'rgba(245,158,11,0.6)' };
    return { val: '#fca5a5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', ring: 'rgba(239,68,68,0.5)' };
  };

  return (
    <div className="min-h-screen relative" style={{ background: '#060610', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="orb orb-1" style={{ background: 'rgba(16,185,129,0.1)' }} />
      <div className="orb orb-2" style={{ background: 'rgba(6,182,212,0.08)' }} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <GlassNav user={user} onLogout={handleLogout} />

      <main className="relative z-10 container mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up">
          {statsData.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginBottom: '0.4rem' }}>{s.label}</p>
                    <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.iconBg, border: `1px solid ${s.iconBorder}`, color: s.iconColor }}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Student Info */}
        {student && (
          <Card className="fade-up-1">
            <CardHeader style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: '#6ee7b7' }} />
                <CardTitle style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 700, fontSize: '1rem' }}>Student Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Student ID', value: student.studentId, color: '#a78bfa' },
                  { label: 'Department', value: student.department, color: '#93c5fd' },
                  { label: 'Year', value: student.year, color: '#6ee7b7' },
                  { label: 'Section', value: student.section, color: '#fcd34d' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</p>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: item.color, fontSize: '1rem' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Attendance */}
        <Card className="fade-up-2">
          <CardHeader style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <CardTitle style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 700 }}>Course Attendance</CardTitle>
            <CardDescription style={{ color: 'rgba(255,255,255,0.38)' }}>Your attendance percentage for each course</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : courseAttendance.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {courseAttendance.map(course => {
                  const colors = getAttendanceColor(course.percentage);
                  return (
                    <div key={course.courseId} className="p-5 rounded-2xl" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'white', fontSize: '1rem', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>{course.courseName}</h3>
                          <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600 }}>{course.courseCode}</span>
                        </div>
                        <div className="text-right">
                          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.25rem', color: colors.val, lineHeight: 1, letterSpacing: '-0.04em' }}>{course.percentage}%</div>
                          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Attendance</p>
                        </div>
                      </div>
                      <div className="mb-4" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ width: `${course.percentage}%`, height: '100%', background: colors.val, borderRadius: '100px', boxShadow: `0 0 8px ${colors.ring}` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Total Sessions</p>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>{course.totalSessions}</p>
                        </div>
                        <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Attended</p>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: colors.val, fontSize: '1.1rem' }}>{course.attended}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <BookOpen className="w-8 h-8" style={{ color: '#6ee7b7' }} />
                </div>
                <h4 style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>No Courses Found</h4>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>No courses are assigned to your department, year, and section</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card className="fade-up-3">
          <CardHeader style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <CardTitle style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 700 }}>Attendance History</CardTitle>
            <CardDescription style={{ color: 'rgba(255,255,255,0.38)' }}>Your recent attendance records</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : attendance.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Course</TableHead><TableHead>Date</TableHead>
                    <TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead>Method</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {attendance.map(record => (
                      <TableRow key={record._id}>
                        <TableCell><span style={{ color: 'white', fontWeight: 500 }}>{record.sessionId?.courseId?.name || 'N/A'}</span></TableCell>
                        <TableCell><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{new Date(record.timestamp).toLocaleDateString()}</span></TableCell>
                        <TableCell><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{new Date(record.timestamp).toLocaleTimeString()}</span></TableCell>
                        <TableCell>
                          <span style={record.status === 'PRESENT'
                            ? { background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }
                            : { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {record.status === 'PRESENT' ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 500 }}>{record.markedBy}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Calendar className="w-8 h-8" style={{ color: '#93c5fd' }} />
                </div>
                <h4 style={{ fontFamily: "'Syne', sans-serif", color: 'white', fontWeight: 700, marginBottom: '0.5rem' }}>No Attendance Records</h4>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>Your attendance will appear here once you start attending classes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
