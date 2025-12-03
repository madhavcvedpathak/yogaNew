import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useCamera } from '../hooks/useCamera';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { classifyPose } from '../utils/poseClassifier';
import { useNavigate } from 'react-router-dom';
import { StopCircle, Clock, Activity, Zap } from 'lucide-react';

const LiveSession = () => {
    const {
        isSessionActive,
        endSession,
        sessionStartTime,
        logPose,
        currentPose,
        practitionerName
    } = useSession();

    const { videoRef, startCamera, stopCamera, stream } = useCamera();
    const { poses, isModelLoaded } = usePoseDetection(videoRef, isSessionActive);
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const [elapsedTime, setElapsedTime] = useState('00:00');

    // Start camera on mount if not already started (though LandingPage should have started it)
    useEffect(() => {
        if (!stream) {
            startCamera();
        }
        return () => {
            // Don't stop camera here if we want to transition to report smoothly? 
            // Actually we should stop it when session ends.
        };
    }, [startCamera, stream]);

    // Timer logic
    useEffect(() => {
        if (!isSessionActive || !sessionStartTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - sessionStartTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            setElapsedTime(`${mins}:${secs}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [isSessionActive, sessionStartTime]);

    // Pose Processing & Drawing
    useEffect(() => {
        if (!canvasRef.current || !videoRef.current || poses.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw poses
        poses.forEach(pose => {
            // Draw Keypoints
            pose.keypoints.forEach(keypoint => {
                if (keypoint.score > 0.3) {
                    ctx.beginPath();
                    ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#D4A373'; // ayur-primary
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();
                }
            });

            // Draw Skeleton (simplified)
            const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
            ctx.strokeStyle = '#FAEDCD'; // ayur-secondary
            ctx.lineWidth = 2;
            adjacentPairs.forEach(([i, j]) => {
                const kp1 = pose.keypoints[i];
                const kp2 = pose.keypoints[j];
                if (kp1.score > 0.3 && kp2.score > 0.3) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x, kp1.y);
                    ctx.lineTo(kp2.x, kp2.y);
                    ctx.stroke();
                }
            });

            // Classify and Log
            const classification = classifyPose(pose.keypoints);
            logPose(classification.name, classification.confidence);
        });

    }, [poses, logPose]);

    const handleEndSession = () => {
        console.log("Ending session...");
        try {
            endSession();
            stopCamera();
            console.log("Navigating to report...");
            navigate('/report');
        } catch (error) {
            console.error("Error ending session:", error);
            // Force navigation if something fails
            navigate('/report');
        }
    };

    if (!isSessionActive) {
        // Redirect if accessed directly without starting session
        // But for dev we might want to allow it? No, strict flow.
        // navigate('/'); 
        // return null;
    }

    return (
        <div className="relative h-screen w-full bg-stone-900 overflow-hidden flex flex-col">
            {/* Main Video Feed */}
            <div className="relative flex-1 flex items-center justify-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
                />

                {/* Loading Overlay */}
                {!isModelLoaded && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="text-white text-xl animate-pulse">Loading AI Model...</div>
                    </div>
                )}
            </div>

            {/* HUD / Metrics Panel */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-white">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

                    {/* Timer */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-ayur-secondary text-sm mb-1">
                            <Clock size={16} />
                            <span>Duration</span>
                        </div>
                        <div className="text-3xl font-mono font-bold">{elapsedTime}</div>
                    </div>

                    {/* Current Pose */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 md:col-span-2">
                        <div className="flex items-center gap-2 text-ayur-secondary text-sm mb-1">
                            <Activity size={16} />
                            <span>Detected Asana</span>
                        </div>
                        <div className="text-3xl font-serif font-bold truncate">
                            {currentPose.name}
                        </div>
                    </div>

                    {/* Confidence & Controls */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 text-ayur-secondary text-sm mb-1">
                                <Zap size={16} />
                                <span>Confidence</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-mono font-bold">
                                    {(currentPose.confidence * 100).toFixed(0)}%
                                </span>
                                <div className="h-2 flex-1 bg-white/20 rounded-full mb-2">
                                    <div
                                        className="h-full bg-ayur-primary rounded-full transition-all duration-300"
                                        style={{ width: `${currentPose.confidence * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleEndSession}
                            className="w-full py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all backdrop-blur-sm"
                        >
                            <StopCircle size={20} />
                            End Session
                        </button>
                    </div>

                </div>
            </div>

            {/* Debug Overlay */}
            <div className="absolute top-20 left-4 bg-black/50 text-white text-xs p-2 rounded pointer-events-none">
                <p>Model: {isModelLoaded ? 'Loaded' : 'Loading...'}</p>
                <p>Poses Detected: {poses.length}</p>
            </div>
        </div >
    );
};

// Need to import poseDetection util for skeleton drawing
import * as poseDetection from '@tensorflow-models/pose-detection';

export default LiveSession;
