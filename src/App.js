import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import HodHome from './components/HodHome';
import AdminHome from './components/AdminHome';
import SubAdminHome from './components/SubAdminHome';
import TaskHistory from './components/TaskHistory';
import FullTaskPage from './components/FullTaskPage';
import Login from './components/Login';
import './App.css';

function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const profile = localStorage.getItem("profile");

    if (token && profile) {
      try {
        const userProfile = JSON.parse(profile);
        setUserProfile(userProfile);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing user profile:", error);
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    setUserProfile(null);
    setIsAuthenticated(false);
  };

  const handleLogin = (userData) => {
    setUserProfile(userData.profile);
    setIsAuthenticated(true);
  };

  // Protected Route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userProfile?.user_type)) {
      return <Navigate to="/home" replace />;
    }

    return children;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <Navigate to="/admin/home" replace />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <Navigate to="/sub-admin/home" replace />
                ) : userProfile?.user_type === "HOD" ? (
                  <Navigate to="/hod/home" replace />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <AdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <Navigate to="/sub-admin/tasks" replace />
                ) : userProfile?.user_type === "HOD" ? (
                  <Navigate to="/hod/tasks" replace />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:id"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <AdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <SubAdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "HOD" ? (
                  <HodHome onLogout={handleLogout} />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <AdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <Navigate to="/sub-admin/meetings" replace />
                ) : userProfile?.user_type === "HOD" ? (
                  <Navigate to="/hod/meetings" replace />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <AdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <Navigate to="/sub-admin/calendar" replace />
                ) : userProfile?.user_type === "HOD" ? (
                  <Navigate to="/hod/calendar" replace />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/rnr"
            element={
              <ProtectedRoute>
                {userProfile?.user_type === "Admin" ? (
                  <AdminHome onLogout={handleLogout} />
                ) : userProfile?.user_type === "Sub Admin" ? (
                  <Navigate to="/sub-admin/rnr" replace />
                ) : userProfile?.user_type === "HOD" ? (
                  <Navigate to="/hod/rnr" replace />
                ) : (
                  <Home onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/projection"
            element={
              <ProtectedRoute>
                <Navigate to="/home" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/task/:id/history"
            element={
              <ProtectedRoute>
                <FullTaskPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sub-admin/tasks/:id"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <FullTaskPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/home"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/meetings"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/individual-analytics"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rnr"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/projection"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Navigate to="/admin/home" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tasks/:id"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <FullTaskPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/home"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HodHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/tasks"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HodHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/tasks/:id"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <FullTaskPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/meetings"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HodHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/calendar"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HodHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/projection"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <Navigate to="/hod/home" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/rnr"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HodHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/home"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <SubAdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/tasks"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <SubAdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/meetings"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <SubAdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <SubAdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/projection"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <Navigate to="/sub-admin/home" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sub-admin/rnr"
            element={
              <ProtectedRoute allowedRoles={['Sub Admin']}>
                <SubAdminHome onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
