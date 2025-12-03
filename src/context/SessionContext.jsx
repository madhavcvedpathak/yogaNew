import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
    const [practitionerName, setPractitionerName] = useState('');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionEndTime, setSessionEndTime] = useState(null);
    const [detectedPoses, setDetectedPoses] = useState([]); // Log of all detections
    const [currentPose, setCurrentPose] = useState({ name: 'Waiting...', confidence: 0 });

    // Refs for data that updates frequently to avoid re-renders if not needed
    const frameCountRef = useRef(0);

    const startSession = () => {
        setDetectedPoses([]);
        setSessionStartTime(new Date());
        setSessionEndTime(null);
        setIsSessionActive(true);
        frameCountRef.current = 0;
    };

    const endSession = () => {
        setIsSessionActive(false);
        setSessionEndTime(new Date());
    };

    const logPose = useCallback((poseName, confidence) => {
        frameCountRef.current += 1;
        const timestamp = new Date();
        setDetectedPoses(prev => [...prev, { name: poseName, confidence, timestamp }]);
        setCurrentPose({ name: poseName, confidence });
    }, []);

    const value = {
        practitionerName,
        setPractitionerName,
        isSessionActive,
        startSession,
        endSession,
        sessionStartTime,
        sessionEndTime,
        detectedPoses,
        currentPose,
        logPose,
        frameCount: frameCountRef.current
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};
