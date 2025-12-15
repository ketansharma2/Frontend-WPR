import React, { useState } from "react";
import "./Sidebar.css";
import {
  FaHome,
  FaListUl,
  FaUsers,
  FaCalendarAlt,
  FaCog,
  FaStar,
  FaUserCog,
  FaChartBar,
} from "react-icons/fa";

export default function Sidebar({ currentPage, onPageChange, userRole }) {
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FaHome,
      roles: ['employee', 'hod', 'admin']
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: FaListUl,
      roles: ['employee', 'hod']
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: FaUsers,
      roles: ['employee', 'hod']
    },
    {
      id: 'calendar',
      label: 'Weekly View',
      icon: FaCalendarAlt,
      roles: ['employee', 'hod']
    },
    {
      id: 'users',
      label: 'User Management',
      icon: FaUserCog,
      roles: ['admin']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: FaChartBar,
      roles: ['admin', 'hod']
    },
  ];

  const handleMenuClick = (pageId) => {
    if (onPageChange) {
      onPageChange(pageId);
    }
  };

  return (
    <div className={`cu-sidebar ${expanded ? 'expanded' : ''}`} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <div className="cu-top-icons">
        {menuItems
          .filter(item => item.roles.includes(userRole))
          .map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className={`icon-container ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <IconComponent className="cu-icon" title={item.label} />
                {expanded && <span className="icon-text">{item.label}</span>}
              </div>
            );
          })}
      </div>

      <div className="cu-bottom-icons">
        <div className="icon-container">
          <FaStar className="cu-icon" title="Upgrades" />
          {expanded && <span className="icon-text">Upgrades</span>}
        </div>

        <div className="icon-container">
          <FaCog className="cu-icon" title="Settings" />
          {expanded && <span className="icon-text">Settings</span>}
        </div>
      </div>
    </div>
  );
}