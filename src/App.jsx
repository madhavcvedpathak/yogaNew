import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import LandingPage from './components/LandingPage';
import LiveSession from './components/LiveSession';
import ReportPage from './components/ReportPage';

function App() {
    return (
        <SessionProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/session" element={<LiveSession />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </SessionProvider>
    );
}

export default App;
