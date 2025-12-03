import React, { useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { useCamera } from '../hooks/useCamera';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Play } from 'lucide-react';

const LandingPage = () => {
    const { practitionerName, setPractitionerName, startSession } = useSession();
    const { videoRef, startCamera, permissionGranted, stream } = useCamera();
    const navigate = useNavigate();

    const handleStart = () => {
        if (practitionerName && permissionGranted) {
            startSession();
            navigate('/session');
        }
    };

    useEffect(() => {
        // Clean up camera when unmounting if not navigating to session? 
        // Actually we want to keep the stream alive if possible, but useCamera handles its own state.
        // For now, let's just let the user manually start camera.
    }, []);

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-sans text-stone-800">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-ayur-primary p-6 text-center">
                    <h1 className="text-3xl font-serif text-white font-bold tracking-wide">Ayursutra</h1>
                    <p className="text-ayur-secondary text-sm mt-1 opacity-90">Yoga Monitoring System</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                            <User size={18} />
                            Name
                        </label>
                        <input
                            type="text"
                            value={practitionerName}
                            onChange={(e) => setPractitionerName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-ayur-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Camera Check */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                            <Camera size={18} />
                            Camera Check
                        </label>
                        <div className="relative aspect-video bg-stone-100 rounded-lg overflow-hidden border-2 border-dashed border-stone-300 flex items-center justify-center">
                            {permissionGranted && stream ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover transform -scale-x-100"
                                />
                            ) : (
                                <button
                                    onClick={startCamera}
                                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 rounded-md text-stone-600 font-medium transition-colors"
                                >
                                    Request Camera Access
                                </button>
                            )}
                        </div>
                        {permissionGranted && (
                            <p className="text-xs text-green-600 text-center">✓ Camera access granted</p>
                        )}
                    </div>

                    {/* Start Button */}
                    <button
                        onClick={handleStart}
                        disabled={!practitionerName || !permissionGranted}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform ${practitionerName && permissionGranted
                            ? 'bg-ayur-primary text-white hover:bg-[#c59665] hover:scale-[1.02] shadow-lg'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            }`}
                    >
                        <Play size={20} fill="currentColor" />
                        Start Session
                    </button>
                </div>
            </div>

            <p className="mt-8 text-stone-400 text-xs text-center max-w-xs">
                Ensure you are in a well-lit room and your full body is visible in the frame.
            </p>
        </div>
    );
};

export default LandingPage;
