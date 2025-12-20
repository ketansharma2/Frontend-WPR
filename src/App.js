import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import HodHome from './components/HodHome';
import AdminHome from './components/AdminHome';
import Login from './components/Login';
import './App.css';

function App() {
  const [view, setView] = useState('login'); // 'home', 'hod-home', 'admin-home', 'login'
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const profile = localStorage.getItem("profile");

    if (token && profile) {
      try {
        const userProfile = JSON.parse(profile);
        setUserProfile(userProfile);

        // Route based on user type
        if (userProfile.user_type === "Admin") {
          setView("admin-home");
        } else if (userProfile.user_type === "HOD") {
          setView("hod-home");
        } else {
          setView("home");
        }
      } catch (error) {
        console.error("Error parsing user profile:", error);
        setView("login");
      }
    } else {
      setView("login");
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    setView("login");
    setUserProfile(null);
  };

  const handleLogin = (userData) => {
    setUserProfile(userData.profile);

    // Route based on user role
    if (userData.profile.user_type === "Admin") {
      setView("admin-home");
    } else if (userData.profile.user_type === "HOD") {
      setView("hod-home");
    } else {
      setView("home");
    }
  };

  return (
    <div className="App">
      {view === 'home' ? (
        <Home onLogout={handleLogout} />
      ) : view === 'hod-home' ? (
        <HodHome onLogout={handleLogout} />
      ) : view === 'admin-home' ? (
        <AdminHome onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
