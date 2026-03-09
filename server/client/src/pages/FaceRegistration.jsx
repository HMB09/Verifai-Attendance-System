import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import api from '../services/api';
import './FaceRegistration.css';

const FaceRegistration = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setStatus('Loading face recognition models...');
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      
      setModelsLoaded(true);
      setStatus('Models loaded. Click "Start Capture" to begin.');
    } catch (error) {
      console.error('Error loading models:', error);
      setStatus('Error loading models. Please ensure models are in /public/models folder.');
    }
  };

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus('Camera started. Position your face in front of the camera.');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus('Error accessing camera. Please allow camera permissions.');
    }
  };

  const captureAndRegister = async () => {
    if (!modelsLoaded || !videoRef.current) {
      setStatus('Models not loaded or camera not started.');
      return;
    }

    setLoading(true);
    setStatus('Capturing and processing face...');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Detect face and get descriptor
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        setStatus('No face detected. Please ensure your face is visible.');
        setLoading(false);
        return;
      }

      // Draw detection on canvas
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      // Get embedding (descriptor is already a Float32Array)
      const embedding = Array.from(detections.descriptor);

      // Send to backend
      const response = await api.post('/face/register', { embedding });

      if (response.data) {
        setStatus('Face registered successfully!');
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error registering face:', error);
      setStatus(error.response?.data?.error || 'Error registering face.');
    } finally {
      setLoading(false);
    }
  };

  const stopCapture = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="face-registration">
      <div className="container">
        <h1>Face Registration</h1>
        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            muted
            width="640"
            height="480"
            style={{ display: 'none' }}
          />
          <canvas ref={canvasRef} width="640" height="480" />
        </div>
        <div className="controls">
          <button onClick={startCapture} disabled={!modelsLoaded || loading}>
            Start Camera
          </button>
          <button onClick={captureAndRegister} disabled={!modelsLoaded || loading}>
            {loading ? 'Processing...' : 'Register Face'}
          </button>
          <button onClick={stopCapture}>Stop Camera</button>
        </div>
        {status && <div className="status">{status}</div>}
      </div>
    </div>
  );
};

export default FaceRegistration;
