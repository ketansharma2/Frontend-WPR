import React, { useState, useEffect } from "react";
import AdminUsers from "./AdminUsers";
import Header from "./Header";
import Sidebar from "./Sidebar";
import "./AdminHome.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Error Boundary Component
class AdminUsersErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminUsers component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          margin: '20px'
        }}>
          <h3>Error Loading User Management</h3>
          <p>There was an error loading the user management page.</p>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AdminHome({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalMeetings: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get user profile from localStorage
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error("Error parsing user profile:", error);
        setError("Error loading user profile");
      }
    } else {
      setError("No user profile found");
    }
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }
      
      // Fetch users count
      const usersResponse = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // Fetch tasks count
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // Fetch meetings count
      const meetingsResponse = await fetch(`${API_BASE_URL}/meetings`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (usersResponse.ok && tasksResponse.ok && meetingsResponse.ok) {
        const usersData = await usersResponse.json();
        const tasksData = await tasksResponse.json();
        const meetingsData = await meetingsResponse.json();
        
        setStats({
          totalUsers: usersData.users?.length || 0,
          totalTasks: tasksData.tasks?.length || 0,
          totalMeetings: meetingsData.meetings?.length || 0
        });
      } else {
        // Log detailed error information
        const usersError = usersResponse.ok ? null : `Users API: ${usersResponse.status}`;
        const tasksError = tasksResponse.ok ? null : `Tasks API: ${tasksResponse.status}`;
        const meetingsError = meetingsResponse.ok ? null : `Meetings API: ${meetingsResponse.status}`;
        
        const errorMessages = [usersError, tasksError, meetingsError].filter(Boolean);
        if (errorMessages.length > 0) {
          console.warn("Some API calls failed:", errorMessages.join(", "));
          // Don't set error for dashboard stats failure, just log it
        }
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      // Don't set error for network issues, as this is just dashboard stats
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    onLogout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "users":
        return (
          <AdminUsersErrorBoundary>
            <AdminUsers />
          </AdminUsersErrorBoundary>
        );
      case "dashboard":
      default:
        return (
          <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            {error && (
              <div className="error-message" style={{
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
            {loading ? (
              <p>Loading statistics...</p>
            ) : (
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p>Manage all system users</p>
                  <h4 style={{ fontSize: '24px', margin: '10px 0' }}>{stats.totalUsers}</h4>
                  <button onClick={() => setCurrentPage("users")}>
                    Manage Users
                  </button>
                </div>
                <div className="stat-card">
                  <h3>Total Tasks</h3>
                  <p>View all tasks in the system</p>
                  <h4 style={{ fontSize: '24px', margin: '10px 0' }}>{stats.totalTasks}</h4>
                  <button onClick={() => setCurrentPage("dashboard")} disabled>
                    View Tasks
                  </button>
                </div>
                <div className="stat-card">
                  <h3>Total Meetings</h3>
                  <p>View all meetings in the system</p>
                  <h4 style={{ fontSize: '24px', margin: '10px 0' }}>{stats.totalMeetings}</h4>
                  <button onClick={() => setCurrentPage("dashboard")} disabled>
                    View Meetings
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  if (!userProfile) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-home-container">
      <Header user={userProfile} onLogout={handleLogout} />
      <div className="admin-content">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          userRole="admin"
        />
        <main className="admin-main">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}