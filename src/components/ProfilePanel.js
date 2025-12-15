import React, { useState, useEffect } from "react";
import "./ProfilePanel.css";
import { FiSettings, FiBellOff, FiHelpCircle, FiLogOut, FiX } from "react-icons/fi";

export default function ProfilePanel({ open, onClose, onLogout }) {
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get user profile from localStorage
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error("Error parsing user profile:", error);
      }
    }
  }, [open]);

  const getUserInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className={`profile-panel ${open ? "open" : ""}`}>
      <div className="profile-header">
        <div className="profile-avatar">{getUserInitials()}</div>
        <div>
          <h4>{userProfile?.name || 'User'}</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            {userProfile?.email || 'No email'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            {userProfile?.role || 'employee'} • {userProfile?.dept || 'General'}
          </p>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-item">
          <FiSettings /> Settings
        </div>
        <div className="profile-item">
          <FiBellOff /> Mute Notifications
        </div>
        <div className="profile-item">
          <FiHelpCircle /> Help
        </div>
        <div className="profile-item" onClick={handleLogout}>
          <FiLogOut /> Logout
        </div>
      </div>

      <div className="close-btn" onClick={onClose}>
        <FiX size={18} />
      </div>
    </div>
  );
}