import React, { useState, useEffect } from 'react';
import './AdminHome.css';
import { FaTimes, FaSearch, FaChevronDown } from 'react-icons/fa';
import StatusDonut from './IndividualAnalytics/StatusDonut';
import SelfAssignedChart from './IndividualAnalytics/SelfAssignedChart';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const IndividualAnalytics = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Set default dates to current month
  useEffect(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Format dates in local timezone to avoid UTC conversion issues
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFromDate(formatLocalDate(firstOfMonth));
    setToDate(formatLocalDate(lastOfMonth));

    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-fetch analytics when user or dates change
  useEffect(() => {
    if (selectedUser && fromDate && toDate) {
      fetchAnalytics();
    } else {
      setAnalyticsData(null); // Clear data if no user selected
    }
  }, [selectedUser, fromDate, toDate]);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/weekly/members`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/individual-analytics`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: selectedUser,
          from_date: fromDate,
          to_date: toDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch analytics");
      }
    } catch (err) {
      setError("Network error while fetching analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserName = teamMembers.find(m => m.user_id === selectedUser)?.name || '';

  return (
    <div style={{ padding: '20px', backgroundColor: '#e0e0e0', minHeight: '100vh' }}>

      {/* Professional Filter Bar */}
      <div className="professional-filter-bar">
        <div className="filter-controls">
          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', whiteSpace: 'nowrap' }}>Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '11px',
                width: '100px'
              }}
            />
            <span style={{ fontSize: '11px', color: '#6c757d' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                padding: '4px 6px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '11px',
                width: '100px'
              }}
            />
          </div>

          {/* User Selection */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${selectedUser ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowUserDropdown(!showUserDropdown);
              }}
            >
              {selectedUser ? teamMembers.find(m => m.user_id === selectedUser)?.name || 'Select User' : 'Select User'}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showUserDropdown && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => { setSelectedUser(''); setShowUserDropdown(false); }}
                >
                  Choose a user...
                </div>
                {teamMembers.map(member => (
                  <div
                    key={member.user_id}
                    className="dropdown-item"
                    onClick={() => { setSelectedUser(member.user_id); setShowUserDropdown(false); }}
                  >
                    {member.name} - {member.dept}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Analytics Display */}
      {analyticsData && (
        <div>
          {/* Charts - Side by Side */}
          <div style={{
            display: 'flex',
            gap: '20px',
            marginTop: '20px',
            marginBottom: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {/* Status Distribution Chart */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              flex: '1',
              minWidth: '300px'
            }}>
              <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Task Status Distribution</h4>
              <StatusDonut data={analyticsData.summary} />
            </div>

            {/* Self vs Assigned Chart */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              flex: '1',
              minWidth: '300px'
            }}>
              <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Self vs Assigned Tasks</h4>
              <SelfAssignedChart data={analyticsData} />
            </div>
          </div>



        </div>
      )}
    </div>
  );
};

export default IndividualAnalytics;