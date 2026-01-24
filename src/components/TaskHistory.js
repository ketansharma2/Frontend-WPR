import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../config/api";
import Sidebar from './Sidebar';
import Header from './Header';
import './Home.css';

const TaskHistory = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Get user profile
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error("Error parsing user profile:", error);
      }
    }

    if (id) {
      fetchTaskHistory();
    }
  }, [id]);

  const fetchTaskHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTaskHistory(id);
      setHistoryData(data.history || []);
    } catch (err) {
      console.error("Error fetching task history:", err);
      setError("Failed to load task history");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-container">
      <Sidebar userRole={userProfile.user_type} />
      <Header
        addTask={() => {}}
        openPopup={() => {}}
        openAssignPopup={() => {}}
        currentView="history"
        onLogout={onLogout}
        user={userProfile}
        isAddDisabled={false}
      />

      <main style={{ backgroundColor: '#e0e0e0', overflow: 'visible', padding: '20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Header */}
          <div style={{
            background: '#5580ff',
            borderRadius: '12px 12px 0 0',
            padding: '15px 20px',
            margin: '-20px -20px 20px -20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              margin: '0',
              fontSize: '20px',
              fontWeight: '600',
              color: 'white'
            }}>
              Task History
            </h2>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px 16px',
              marginBottom: '16px',
              borderRadius: '6px',
              border: '1px solid #ffcdd2',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '0' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Loading task history...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No history found for this task</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '0',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{
                      background: '#f8fafc',
                      borderBottom: '2px solid #e2e8f0'
                    }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb',
                        minWidth: '120px'
                      }}>History Date</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb',
                        minWidth: '100px'
                      }}>Time Spent</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb',
                        minWidth: '100px'
                      }}>Status</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#374151',
                        borderRight: '1px solid #e5e7eb',
                        minWidth: '200px'
                      }}>Remarks</th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#374151',
                        minWidth: '100px'
                      }}>Updated At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item, index) => (
                      <tr key={index} style={{
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>
                          {item.history_date ? new Date(item.history_date).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>
                          {item.time_spent || 'N/A'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: item.status === 'completed' ? '#dcfce7' :
                                           item.status === 'in-progress' ? '#dbeafe' :
                                           item.status === 'done' ? '#dcfce7' : '#fef3c7',
                            color: item.status === 'completed' ? '#166534' :
                                  item.status === 'in-progress' ? '#1e40af' :
                                  item.status === 'done' ? '#166534' : '#92400e'
                          }}>
                            {item.status || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>
                          {item.remarks || 'No remarks'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', textAlign: 'center' }}>
                          {item.changed_at ? new Date(item.changed_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskHistory;