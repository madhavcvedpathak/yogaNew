import { useEffect, useRef, useState, useCallback } from 'react';

export const usePoseDetection = (videoRef, isSessionActive) => {
    const workerRef = useRef(null);
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [poses, setPoses] = useState([]);
    const requestRef = useRef();

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/poseWorker.js', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = (event) => {
            const { type, poses: detectedPoses, error } = event.data;
            if (type === 'MODEL_LOADED') {
                setIsModelLoaded(true);
                console.log('Pose Detection Model Loaded');
            } else if (type === 'POSE_DETECTED') {
                setPoses(detectedPoses);
            } else if (type === 'ERROR') {
                console.error('Worker Error:', error);
            }
        };

        workerRef.current.postMessage({ type: 'LOAD_MODEL' });

        return () => {
            workerRef.current.terminate();
        };
    }, []);

    const lastDetectTime = useRef(0);

    const detect = useCallback((timestamp) => {
        if (
            videoRef.current &&
            videoRef.current.readyState === 4 &&
            isModelLoaded &&
            isSessionActive
        ) {
            // Throttle to ~10 FPS (100ms) to prevent UI lag
            if (timestamp - lastDetectTime.current >= 100) {
                const video = videoRef.current;
                createImageBitmap(video).then((bitmap) => {
                    workerRef.current.postMessage({ type: 'DETECT_POSE', imageData: bitmap }, [bitmap]);
                });
                lastDetectTime.current = timestamp;
            }
        }
        requestRef.current = requestAnimationFrame(detect);
    }, [videoRef, isModelLoaded, isSessionActive]);

    useEffect(() => {
        if (isSessionActive && isModelLoaded) {
            requestRef.current = requestAnimationFrame(detect);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isSessionActive, isModelLoaded, detect]);

    return { poses, isModelLoaded };
};
