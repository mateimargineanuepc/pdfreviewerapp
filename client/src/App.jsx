'use strict';

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BackendHealthCheck from './components/BackendHealthCheck';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DocumentSelectionPage from './pages/DocumentSelectionPage';
import PdfViewerPage from './pages/PdfViewerPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

/**
 * Main App component with routing and authentication
 * @returns {JSX.Element} App component
 */
function App() {
    /**
     * Handle orientation changes globally
     */
    useEffect(() => {
        const handleOrientationChange = () => {
            // Force viewport recalculation
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.setAttribute(
                    'content',
                    'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
                );
            }
            // Trigger resize event to update all components
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', () => {
            // Also handle resize events
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        });

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    return (
        <BackendHealthCheck>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <div className="app-layout">
                                        <Navigation />
                                        <main className="app-main">
                                            <Routes>
                                                <Route path="/" element={<HomePage />} />
                                                <Route path="/documents" element={<DocumentSelectionPage />} />
                                                <Route path="/viewer" element={<PdfViewerPage />} />
                                                <Route path="/admin" element={<AdminDashboardPage />} />
                                                <Route path="*" element={<Navigate to="/" replace />} />
                                            </Routes>
                                        </main>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </BackendHealthCheck>
    );
}

export default App;
