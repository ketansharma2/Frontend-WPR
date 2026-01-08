import React, { useState } from "react";
import "./Sidebar.css";
import {
  FaHome,
  FaListUl,
  FaUsers,
  FaCalendarAlt,
  FaUserCog,
  FaChartBar,
  FaClipboardList,
} from "react-icons/fa";

export default function Sidebar({ currentPage, onPageChange, userRole }) {
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FaHome,
      roles: ['team member', 'hod', 'admin', 'sub admin']
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: FaListUl,
      roles: ['team member', 'hod', 'admin', 'sub admin']
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: FaUsers,
      roles: ['team member', 'hod', 'admin', 'sub admin']
    },
    {
      id: 'calendar',
      label: 'Weekly View',
      icon: FaCalendarAlt,
      roles: ['team member', 'hod', 'admin', 'sub admin']
    },
    {
      id: 'rnr',
      label: 'R&R',
      icon: FaClipboardList,
      roles: ['team member', 'hod', 'admin', 'sub admin']
    },
    {
      id: 'users',
      label: 'User Management',
      icon: FaUserCog,
      roles: ['admin']
    },
    {
      id: 'individual-analytics',
      label: 'Individual Analytics',
      icon: FaChartBar,
      roles: ['admin']
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
          .filter(item => item.roles.some(role => role.toLowerCase() === userRole.toLowerCase()))
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

    </div>
  );
}