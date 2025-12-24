import React, { useState, useEffect } from 'react';
import './Header.css';
import ProfilePanel from './ProfilePanel';

const Header = ({ addTask, openPopup, openAssignPopup, currentView, onLogout, user }) => {
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
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
  }, []);

  const toggleProfilePanel = () => setIsProfilePanelOpen(!isProfilePanelOpen);

  const getUserInitials = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <header className="cu-header">
        <div className="cu-header__left">
          <div className="cu-header__workspace-picker">
            <img className="cu-header__workspace-avatar" src="/Maven Jobs Favicon.jpg" alt="Workspace" />
            <span className="cu-header__workspace-name">
              {userProfile?.name || 'User'}'s Workspace
            </span>
          </div>
        </div>
        <div className="cu-header__center">
        </div>
        <div className="cu-header__right">
          {user?.user_type !== 'Admin' && (
            <>
              <button className="cu-header__create-task" onClick={openPopup}>
                <span className="create-task-plus">+</span>
                <span className="create-task-text">Task/Meeting</span>
              </button>
              {user?.user_type === 'HOD' && (
                <button className="cu-header__assign-task" onClick={openAssignPopup}>
                  <span className="assign-task-text">Assign Task</span>
                </button>
              )}
            </>
          )}
          {user?.user_type === 'Admin' && openAssignPopup && (
            <button className="cu-header__assign-task" onClick={openAssignPopup}>
              <span className="assign-task-text">Assign Task</span>
            </button>
          )}
          <div className="cu-header__user-avatar" onClick={toggleProfilePanel}>
            {getUserInitials()}
          </div>
        </div>
      </header>
      <ProfilePanel open={isProfilePanelOpen} onClose={toggleProfilePanel} onLogout={onLogout} />
    </>
  );
};

export default Header;