import React, { useState, useEffect } from "react";
import { api } from "../config/api";
import "./Home.css";

const TaskHistoryPopup = ({ open, onClose, taskId }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && taskId) {
      fetchTaskHistory();
    }
  }, [open, taskId]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const fetchTaskHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getTaskHistory(taskId);
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

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="enhanced-task-popup" style={{ maxWidth: '900px', width: '90%' }}>
        {/* Header */}
        <div className="popup-header">
          <div className="header-content">
            <div className="title-section">
              <h2 className="modal-title">Task History</h2>
              <p className="modal-subtitle">View all changes and updates for this task</p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px 16px',
            margin: '16px 24px',
            borderRadius: '6px',
            border: '1px solid #ffcdd2',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Content */}
        <div className="popup-content">
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

        {/* Footer */}
        <div className="popup-footer">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="cancel-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskHistoryPopup;