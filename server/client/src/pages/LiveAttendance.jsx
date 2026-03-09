import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from '../services/api';
import {
  Video,
  ArrowLeft,
  Play,
  Square,
  Loader2,
  CheckCircle,
  Users,
  Clock
} from "lucide-react";

const LiveAttendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sessionId, setSessionId] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Loading models...');
  const recognitionIntervalRef = useRef(null);

  useEffect(() => {
    loadModels();
    fetchCourses();
    
    // Get courseId from URL params if provided
    const params = new URLSearchParams(location.search);
    const urlCourseId = params.get('courseId');
    if (urlCourseId) {
      setCourseId(urlCourseId);
    }
    
    return () => {
      stopRecognition();
    };
  }, []);

  const loadModels = async () => {
    try {
      console.log('[LiveAttendance] loadModels called');
      setStatus('Loading AI models...');
      const MODEL_URL = '/models';
      console.log('[LiveAttendance] Loading models from:', MODEL_URL);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      console.log('[LiveAttendance] All models loaded successfully');
      setModelsLoaded(true);
      setStatus('Ready to start');
      toast.success('AI models loaded successfully');
    } catch (error) {
      console.error('[LiveAttendance] Error loading models:', error);
      setStatus('Error loading models');
      toast.error('Failed to load AI models');
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await api.get('/teacher/courses');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    }
  };

  const startSession = async () => {
    console.log('[LiveAttendance] startSession called, courseId:', courseId);
    if (!courseId) {
      console.error('[LiveAttendance] No course selected');
      toast.error('Please select a course');
      return;
    }

    setLoading(true);
    try {
      console.log('[LiveAttendance] Creating session...');
      const response = await api.post('/attendance/session', { courseId });
      console.log('[LiveAttendance] Session created:', response.data);
      const newSessionId = response.data.session.id;
      setSessionId(newSessionId);
      setStatus('Session started');
      toast.success('Attendance session started');
      console.log('[LiveAttendance] Starting camera with sessionId:', newSessionId);
      await startCamera(newSessionId);
    } catch (error) {
      console.error('[LiveAttendance] Error starting session:', error.response?.data || error);
      setStatus('Error starting session');
      toast.error(error.response?.data?.error || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (currentSessionId) => {
    console.log('[LiveAttendance] startCamera called with sessionId:', currentSessionId);
    try {
      console.log('[LiveAttendance] Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      console.log('[LiveAttendance] Camera access granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('[LiveAttendance] Video stream attached to videoRef');
      } else {
        console.error('[LiveAttendance] videoRef.current is null!');
      }
      setStatus('Camera active - Scanning for faces...');
      console.log('[LiveAttendance] Starting recognition with sessionId:', currentSessionId);
      startRecognition(currentSessionId);
    } catch (error) {
      console.error('[LiveAttendance] Error accessing camera:', error);
      setStatus('Error accessing camera');
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const startRecognition = (currentSessionId) => {
    console.log('[LiveAttendance] startRecognition called, sessionId:', currentSessionId);
    console.log('[LiveAttendance] modelsLoaded:', modelsLoaded, 'videoRef.current:', !!videoRef.current);
    recognitionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded || !currentSessionId) {
        console.log('[LiveAttendance] Recognition skipped - videoRef:', !!videoRef.current, 'modelsLoaded:', modelsLoaded, 'sessionId:', currentSessionId);
        return;
      }

      try {
        console.log('[LiveAttendance] Detecting face...');
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detections && canvasRef.current) {
          console.log('[LiveAttendance] Face detected, descriptor length:', detections.descriptor.length);
          const canvas = canvasRef.current;
          const displaySize = { width: 640, height: 480 };
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);

          const embedding = Array.from(detections.descriptor);
          console.log('[LiveAttendance] ===== SENDING FACE DATA TO BACKEND =====');
          console.log('[LiveAttendance] Embedding length:', embedding.length);
          console.log('[LiveAttendance] SessionId:', currentSessionId);
          const response = await api.post('/attendance/recognize', {
            sessionId: currentSessionId,
            embedding,
          });

          console.log('[LiveAttendance] ===== BACKEND RESPONSE =====');
          console.log('[LiveAttendance] Student found:', response.data.recognized ? 'YES' : 'NO');
          if (response.data.recognized && response.data.student) {
            const student = response.data.student;
            console.log('[LiveAttendance] Student Name:', student.name);
            console.log('[LiveAttendance] Student ID:', student.studentId);
            console.log('[LiveAttendance] Similarity Score:', response.data.similarity);
            setRecognizedStudents((prev) => {
              if (prev.find((s) => s.id === student.id)) {
                console.log('[LiveAttendance] Student already in list');
                return prev;
              }
              toast.success(`${student.name} marked present`);
              return [...prev, { ...student, timestamp: new Date(), similarity: response.data.similarity }];
            });
          } else {
            console.log('[LiveAttendance] Best Similarity Score:', response.data.bestSimilarity, '(Threshold: 0.6)');
            console.log('[LiveAttendance] Status: No matching student found');
          }
        } else {
          console.log('[LiveAttendance] No face detected in frame');
        }
      } catch (error) {
        console.error('[LiveAttendance] Recognition error:', error.response?.data || error);
      }
    }, 2000); // Check every 2 seconds
  };

  const stopRecognition = () => {
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const closeSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      stopRecognition();
      await api.patch(`/attendance/session/${sessionId}/close`);
      setStatus('Session closed');
      toast.success(`Session closed. ${recognizedStudents.length} students marked present`);
      setSessionId(null);
      setRecognizedStudents([]);
    } catch (error) {
      setStatus('Error closing session');
      toast.error('Failed to close session');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = courses.find(c => c._id === courseId);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/dashboard')} className="hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-6 bg-gray-200" />
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-black bg-white">
                  <Video className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-black">Live Attendance</h1>
                  <p className="text-sm text-gray-600">{selectedCourse?.name || 'Select a course to begin'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`border-gray-300 ${sessionId ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-700'}`}>
                {sessionId ? 'Session Active' : 'No Active Session'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-black">Camera Feed</CardTitle>
                <CardDescription className="text-gray-600">{status}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
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
                  {!sessionId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center space-y-3">
                        <div className="p-4 rounded-full border-2 border-white bg-black inline-block">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-medium">Start a session to begin</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Controls & Students */}
          <div className="space-y-6">
            {/* Session Controls */}
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-black">Session Controls</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black">Select Course</label>
                  <Select value={courseId} onValueChange={setCourseId} disabled={!!sessionId}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="bg-gray-200" />

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={startSession} 
                    disabled={!!sessionId || !modelsLoaded || loading || !courseId}
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                    Start Session
                  </Button>
                  <Button 
                    onClick={closeSession} 
                    disabled={!sessionId || loading}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-100"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
                    End Session
                  </Button>
                </div>

                {!modelsLoaded && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded border border-gray-200">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading AI models...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recognized Students */}
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-black">Attendance</CardTitle>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {recognizedStudents.length} present
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {recognizedStudents.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {recognizedStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 border border-gray-200">
                          <AvatarFallback className="bg-gray-100 text-black text-sm">
                            {student.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-black text-sm truncate">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.studentId}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <CheckCircle className="w-4 h-4 text-black" />
                          <span className="text-xs text-gray-600">
                            {new Date(student.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full border border-gray-200 bg-gray-50">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-black">No Students Yet</h4>
                      <p className="text-xs text-gray-600">
                        Students will appear here as they are recognized
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Info */}
            {sessionId && (
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-sm text-black">Session Info</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant="outline" className="border-gray-300 text-black bg-white">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Course</span>
                    <span className="font-medium text-black">{selectedCourse?.code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Present</span>
                    <span className="font-medium text-black">{recognizedStudents.length}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveAttendance;
