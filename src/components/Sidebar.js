import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

export default function Sidebar({ userRole, onPageChange, currentPage: propCurrentPage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Determine current page from URL path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/home' || path === '/hod/home' || path === '/sub-admin/home' || path === '/admin/home') return 'home';
    if (path === '/tasks' || path === '/hod/tasks' || path === '/sub-admin/tasks' || path === '/admin/tasks') return 'tasks';
    if (path === '/meetings' || path === '/hod/meetings' || path === '/sub-admin/meetings' || path === '/admin/meetings') return 'meetings';
    if (path === '/calendar' || path === '/hod/calendar' || path === '/sub-admin/calendar' || path === '/admin/calendar') return 'calendar';
    if (path === '/rnr' || path === '/hod/rnr' || path === '/sub-admin/rnr' || path === '/admin/rnr') return 'rnr';
    if (path === '/users' || path === '/admin/users') return 'users';
    if (path === '/individual-analytics' || path === '/admin/individual-analytics') return 'individual-analytics';
    return 'home'; // default
  };

  const currentPage = propCurrentPage || getCurrentPage();

  const menuItems = [
    {
      id: 'home',
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

  // If userRole is undefined, show all menu items (fallback)
  const userRoleLower = userRole ? userRole.toLowerCase() : '';

  const handleMenuClick = (pageId) => {
    if (userRoleLower === 'sub admin' && onPageChange) {
      // For sub-admin, use internal page change instead of navigation
      onPageChange(pageId);
    } else {
      let prefix = '';
      if (userRoleLower === 'hod') {
        prefix = '/hod';
      } else if (userRoleLower === 'sub admin') {
        prefix = '/sub-admin';
      } else if (userRoleLower === 'admin') {
        prefix = '/admin';
      }
      navigate(`${prefix}/${pageId}`);
    }
  };

  return (
    <div className={`cu-sidebar ${expanded ? 'expanded' : ''}`} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
      <div className="cu-top-icons">
        {menuItems
          .filter(item => userRoleLower === '' || item.roles.some(role => role.toLowerCase() === userRoleLower))
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