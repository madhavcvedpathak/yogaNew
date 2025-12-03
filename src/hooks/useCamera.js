import { useState, useEffect, useRef, useCallback } from 'react';

export const useCamera = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
                audio: false,
            });
            setStream(mediaStream);
            setPermissionGranted(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(err);
            setPermissionGranted(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setPermissionGranted(false);
        }
    }, [stream]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return { videoRef, startCamera, stopCamera, permissionGranted, error, stream };
};
