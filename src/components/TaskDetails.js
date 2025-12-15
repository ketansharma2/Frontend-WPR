import React from "react";
import "./TaskDetailsCard.css";

export default function TaskDetailsCard({ task, onClose }) {
  if (!task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper functions to get correct field values based on item type
  const getTitle = () => {
    if (task.itemType === 'meeting') {
      return task.meeting_name || task.name || 'Untitled Meeting';
    }
    return task.task_name || task.name || 'Untitled Task';
  };

  const getDescription = () => {
    if (task.itemType === 'meeting') {
      return task.notes || task.agenda || 'No agenda or notes provided';
    }
    return task.description || 'No description provided';
  };

  const getDate = () => {
    if (task.itemType === 'meeting') {
      return task.date || task.dueDate || '';
    }
    return task.dueDate || task.date || '';
  };

  const getTimeInfo = () => {
    if (task.itemType === 'meeting') {
      return {
        start: task.time || 'Not specified',
        end: task.prop_slot || 'Not specified'
      };
    }
    return {
      start: task.created_at || task.createdAt || '',
      end: task.timeline || task.time || ''
    };
  };

  const getType = () => {
    if (task.itemType === 'meeting') {
      return {
        main: task.dept || 'General',
        sub: 'Meeting Department'
      };
    }
    return {
      main: task.task_type || task.type || 'Work',
      sub: task.category === 'hod assigned' ? 'HOD Assigned' : 'Self Task'
    };
  };

  const getParticipants = () => {
    if (task.itemType === 'meeting') {
      return task.co_person || 'Not specified';
    }
    return 'Self';
  };

  const getAttachments = () => {
    if (task.itemType === 'meeting') {
      return null; // Meetings typically don't have file attachments
    }
    return task.file_link || task.attachments || task.upload || null;
  };

  const getPriority = () => {
    // Determine priority based on task type or other factors
    if (task.itemType === 'meeting') return 'medium';
    const type = (task.task_type || task.type || '').toLowerCase();
    if (type.includes('urgent') || type.includes('priority')) return 'high';
    if (type.includes('fixed')) return 'low';
    return 'medium';
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('completed')) return '✅';
    if (statusLower.includes('progress')) return '🔄';
    if (statusLower.includes('hold') || statusLower.includes('pending')) return '⏸️';
    return '⏳';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const timeInfo = getTimeInfo();
  const typeInfo = getType();
  const priority = getPriority();

  return (
    <div className="row-details-overlay" onClick={onClose}>
      <div className="row-task-details-card" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="row-task-header">
          <div className="header-content">
            <div className="header-left">
              <div className="header-text">
                <h2>{task.itemType === 'meeting' ? 'Meeting Information' : 'Task Information'}</h2>
                <p className="header-subtitle">{getTitle()}</p>
              </div>
            </div>
            <div className="header-right">
              <div className="status-priority-summary">
                <div className="summary-item">
                  <span className="summary-icon">{getStatusIcon(task.status)}</span>
                  <span className="summary-text">{task.status || 'Not Started'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">{getPriorityIcon(priority)}</span>
                  <span className="summary-text">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                </div>
              </div>
              <button className="close-btn" onClick={onClose}>
                <span>✕</span>
              </button>
            </div>
          </div>
        </div>

        <div className="row-divider"></div>

        {/* MAIN CONTENT ROWS */}
        <div className="row-main-content">
          
          {/* Row 1: Title & Description */}
          <div className="info-row primary-row">
            <div className="row-label">
              <span className="label-icon">ℹ️</span>
              <span className="label-text">{task.itemType === 'meeting' ? 'Meeting Overview' : 'Task Overview'}</span>
            </div>
            <div className="row-content">
              <div className="title-section">
                <h3 className="main-title">{getTitle()}</h3>
                <div className="description-section">
                  <span className="description-label">Description:</span>
                  <span className="description-text">{getDescription()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Status & Priority */}
          <div className="info-row status-row">
            <div className="row-label">
              <span className="label-icon">📈</span>
              <span className="label-text">Status & Progress</span>
            </div>
            <div className="row-content">
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-icon">{getStatusIcon(task.status)}</span>
                  <div className="status-details">
                    <span className="status-label">Current Status</span>
                    <span className="status-value">{task.status || 'Not Started'}</span>
                  </div>
                </div>
                <div className="priority-item">
                  <span className="priority-icon">{getPriorityIcon(priority)}</span>
                  <div className="priority-details">
                    <span className="priority-label">Priority Level</span>
                    <span className="priority-value">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Schedule & Timeline */}
          <div className="info-row schedule-row">
            <div className="row-label">
              <span className="label-icon">🗓️</span>
              <span className="label-text">Schedule & Timeline</span>
            </div>
            <div className="row-content">
              <div className="schedule-grid">
                <div className="schedule-item">
                  <span className="schedule-icon">🗓️</span>
                  <div className="schedule-details">
                    <span className="schedule-label">{task.itemType === 'meeting' ? 'Meeting Date' : 'Due Date'}</span>
                    <span className="schedule-value">{formatDate(getDate())}</span>
                  </div>
                </div>
                <div className="schedule-item">
                  <span className="schedule-icon">⏱️</span>
                  <div className="schedule-details">
                    <span className="schedule-label">{task.itemType === 'meeting' ? 'Meeting Time' : 'Created Date'}</span>
                    <span className="schedule-value">{formatDateTime(timeInfo.start)}</span>
                  </div>
                </div>
                <div className="schedule-item">
                  <span className="schedule-icon">⏳</span>
                  <div className="schedule-details">
                    <span className="schedule-label">{task.itemType === 'meeting' ? 'Duration' : 'Timeline'}</span>
                    <span className="schedule-value">{timeInfo.end !== 'Not specified' ? formatDateTime(timeInfo.end) : 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Assignment & Category */}
          <div className="info-row assignment-row">
            <div className="row-label">
              <span className="label-icon">👤</span>
              <span className="label-text">Assignment & Category</span>
            </div>
            <div className="row-content">
              <div className="assignment-grid">
                <div className="assignment-item">
                  <span className="assignment-icon">🏢</span>
                  <div className="assignment-details">
                    <span className="assignment-label">{task.itemType === 'meeting' ? 'Department' : 'Task Type'}</span>
                    <span className="assignment-value">{typeInfo.main}</span>
                  </div>
                </div>
                <div className="assignment-item">
                  <span className="assignment-icon">👥</span>
                  <div className="assignment-details">
                    <span className="assignment-label">{task.itemType === 'meeting' ? 'Participants' : 'Assigned To'}</span>
                    <span className="assignment-value">{getParticipants()}</span>
                  </div>
                </div>
                <div className="assignment-item">
                  <span className="assignment-icon">📁</span>
                  <div className="assignment-details">
                    <span className="assignment-label">Category</span>
                    <span className="assignment-value">{typeInfo.sub}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Attachments */}
          <div className="info-row attachments-row">
            <div className="row-label">
              <span className="label-icon">📎</span>
              <span className="label-text">Documents & Resources</span>
            </div>
            <div className="row-content">
              {getAttachments() ? (
                <div className="attachment-item">
                  <span className="attachment-icon">🔗</span>
                  <a href={getAttachments()} target="_blank" rel="noopener noreferrer" className="attachment-link">
                    Access Document
                  </a>
                </div>
              ) : (
                <div className="no-attachments">
                  <span className="no-attachment-icon">📄</span>
                  <span>No documents attached</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="row-footer">
          <div className="footer-info">
            <span className="footer-icon">ℹ️</span>
            <span>Click outside or press ✕ to close • Complete information displayed for reference</span>
          </div>
        </div>

      </div>
    </div>
  );
}