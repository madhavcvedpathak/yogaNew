import React, { useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { generatePDF } from '../utils/pdfGenerator';
import { Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportPage = () => {
    const {
        practitionerName,
        sessionStartTime,
        sessionEndTime,
        detectedPoses,
        frameCount
    } = useSession();
    const navigate = useNavigate();

    // Calculate Metrics
    const metrics = useMemo(() => {
        if (!detectedPoses.length) return null;

        // 1. Basic Stats
        const totalFrames = detectedPoses.length; // Or use frameCount
        const avgConfidence = detectedPoses.reduce((acc, p) => acc + p.confidence, 0) / totalFrames;

        // 2. Pose Durations
        const poseMap = {};
        detectedPoses.forEach(p => {
            if (!poseMap[p.name]) poseMap[p.name] = { count: 0, confidenceSum: 0, timestamps: [] };
            poseMap[p.name].count++;
            poseMap[p.name].confidenceSum += p.confidence;
            poseMap[p.name].timestamps.push(p.timestamp);
        });

        const poseDurations = Object.entries(poseMap).map(([name, data]) => ({
            name,
            frames: data.count,
            time: (data.count / 30), // Assuming ~30 FPS, ideally use timestamps
            avgConfidence: data.confidenceSum / data.count
        })).sort((a, b) => b.time - a.time);

        // 3. Top 3 Poses (excluding Unknown)
        const topPoses = poseDurations
            .filter(p => p.name !== 'Unknown')
            .slice(0, 3)
            .map(p => ({
                ...p,
                longestHold: p.time, // Simplified: assume total time is continuous for now or calculate gaps
                feedback: "Focus on maintaining steady breathing and core engagement." // Placeholder
            }));

        // 4. Narrative
        const bestPose = topPoses[0] || { name: 'None', time: 0, avgConfidence: 0 };
        const worstPose = poseDurations.filter(p => p.name !== 'Unknown').pop() || { name: 'None' };

        const narrative = {
            strength: `You showed great endurance in ${bestPose.name}, holding it for ${bestPose.time.toFixed(1)}s with ${(bestPose.avgConfidence * 100).toFixed(0)}% confidence.`,
            growth: `${worstPose.name} was fleeting. Practice holding it for 5 deep breaths.`,
            advice: "Listen to your body. Yoga is not about touching your toes, it is about what you learn on the way down."
        };

        return {
            totalFrames,
            avgConfidence,
            poseDurations,
            topPoses,
            narrative
        };
    }, [detectedPoses, frameCount]);

    if (!metrics) return <div className="p-10 text-center">No session data found.</div>;

    const handleDownload = () => {
        generatePDF({
            practitionerName,
            sessionStartTime,
            sessionEndTime: sessionEndTime || new Date(),
            detectedPoses,
            metrics
        });
    };

    return (
        <div className="min-h-screen bg-stone-50 p-8 font-sans text-stone-800">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-ayur-primary p-8 text-center text-white">
                    <h1 className="text-3xl font-serif font-bold">Session Report</h1>
                    <p className="opacity-90">Ayursutra Yoga Monitor</p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-stone-100 p-4 rounded-xl text-center">
                            <div className="text-xs text-stone-500 uppercase tracking-wider">Name</div>
                            <div className="font-bold text-lg text-ayur-primary">{practitionerName}</div>
                        </div>
                        <div className="bg-stone-100 p-4 rounded-xl text-center">
                            <div className="text-xs text-stone-500 uppercase tracking-wider">Duration</div>
                            <div className="font-bold text-lg text-ayur-primary">
                                {((sessionEndTime - sessionStartTime) / 1000 / 60).toFixed(2)}m
                            </div>
                        </div>
                        <div className="bg-stone-100 p-4 rounded-xl text-center">
                            <div className="text-xs text-stone-500 uppercase tracking-wider">Avg Confidence</div>
                            <div className="font-bold text-lg text-ayur-primary">
                                {(metrics.avgConfidence * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-stone-100 p-4 rounded-xl text-center">
                            <div className="text-xs text-stone-500 uppercase tracking-wider">Poses Detected</div>
                            <div className="font-bold text-lg text-ayur-primary">{metrics.poseDurations.length}</div>
                        </div>
                    </div>

                    {/* Pose Table */}
                    <div>
                        <h2 className="text-xl font-serif font-bold mb-4 text-stone-700">Pose Analysis</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-100 text-stone-600 text-sm">
                                        <th className="p-3 rounded-l-lg">Pose Name</th>
                                        <th className="p-3">Frames</th>
                                        <th className="p-3">Time (Approx)</th>
                                        <th className="p-3 rounded-r-lg">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {metrics.poseDurations.map((pose, idx) => (
                                        <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-3 font-medium">{pose.name}</td>
                                            <td className="p-3">{pose.frames}</td>
                                            <td className="p-3">{pose.time.toFixed(1)}s</td>
                                            <td className="p-3">{(pose.avgConfidence * 100).toFixed(0)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleDownload}
                            className="flex-1 py-3 bg-ayur-primary hover:bg-[#c59665] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                            <Download size={20} />
                            Download PDF Report
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            <Home size={20} />
                            Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportPage;
