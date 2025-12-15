import React, { useState } from "react";
import FilterPopup from "./FilterPopup";
import "./CalendarView.css";

export default function CalendarView({ tasks, filter, setFilter }) {
  const [dateFilter, setDateFilter] = useState('all');
  const [dateActive, setDateActive] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'task' && filter !== 'meeting') return false;
    if (task.itemType !== filter) return false;

    // Date filter
    if (dateFilter === 'all') return true;
    const createdDate = new Date(task.createdAt || task.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const taskDate = new Date(createdDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime();
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const taskDate = new Date(createdDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === yesterday.getTime();
    } else if (dateFilter === 'past_week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    } else if (dateFilter === 'past_month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return createdDate >= monthAgo;
    }
    return true;
  });

  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter(task => task.status === 'Done').length;
  const inProgressTasks = filteredTasks.filter(task => task.status === 'In Progress').length;

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDisplayName = (task) => {
    return task.task_name || task.name || task.meeting_name || 'Untitled';
  };

  const getTaskType = (task) => {
    return task.task_type || task.type || task.dept || 'Work';
  };

  const getTimeline = (task) => {
    return task.timeline || task.prop_slot || task.timeSlot || 'Not set';
  };

  const getAssignee = (task) => {
    return task.itemType === 'meeting' ? (task.co_person || 'Not specified') : 'Self';
  };

  const getFileLink = (task) => {
    return task.file_link || task.attachments || null;
  };

  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('completed')) return '✅';
    if (statusLower.includes('progress')) return '🔄';
    if (statusLower.includes('hold') || statusLower.includes('pending')) return '⏸️';
    return '⏳';
  };

  if (filteredTasks.length === 0) {
    return (
      <div className="cu-task-wrapper">
        <div className="actions-row">
          <FilterPopup />
          <button className={`btn ${dateActive === 'today' ? 'date-active' : ''}`} onClick={() => { setDateFilter('today'); setDateActive('today'); }}>Today</button>
          <button className={`btn ${dateActive === 'yesterday' ? 'date-active' : ''}`} onClick={() => { setDateFilter('yesterday'); setDateActive('yesterday'); }}>Yesterday</button>
          <button className={`btn ${dateActive === 'past_week' ? 'date-active' : ''}`} onClick={() => { setDateFilter('past_week'); setDateActive('past_week'); }}>Past week</button>
          <button className={`btn ${dateActive === 'past_month' ? 'date-active' : ''}`} onClick={() => { setDateFilter('past_month'); setDateActive('past_month'); }}>Past month</button>
          <button className="switch-btn" style={{marginLeft: 'auto'}} onClick={() => setFilter(filter === 'task' ? 'meeting' : 'task')}>
            <span className={filter === 'task' ? 'active' : ''}>Tasks</span>
            <span className={filter === 'meeting' ? 'active' : ''}>Meeting</span>
          </button>
        </div>

        <div className="calendar-summary">
          <div className="summary-item">
            <h3>Total tasks</h3>
            <p>{totalTasks}</p>
          </div>
          <div className="summary-item">
            <h3>Done</h3>
            <p>{doneTasks}</p>
          </div>
          <div className="summary-item">
            <h3>In progress</h3>
            <p>{inProgressTasks}</p>
          </div>
        </div>

        <div className="weekly-view-container">
          <div className="weekly-header">
            <h3>Weekly View</h3>
          </div>
          <div className="no-tasks-message">
            <div className="no-tasks-icon">📄</div>
            <h3>No {filter === 'task' ? 'tasks' : 'meetings'} found</h3>
            <p>Try adjusting your search parameters or filters</p>
          </div>
        </div>

        <button className="download-btn">Download rpt</button>
      </div>
    );
  }

  return (
    <div className="cu-task-wrapper">
      <div className="actions-row">
        <FilterPopup />
        <button className={`btn ${dateActive === 'today' ? 'date-active' : ''}`} onClick={() => { setDateFilter('today'); setDateActive('today'); }}>Today</button>
        <button className={`btn ${dateActive === 'yesterday' ? 'date-active' : ''}`} onClick={() => { setDateFilter('yesterday'); setDateActive('yesterday'); }}>Yesterday</button>
        <button className={`btn ${dateActive === 'past_week' ? 'date-active' : ''}`} onClick={() => { setDateFilter('past_week'); setDateActive('past_week'); }}>Past week</button>
        <button className={`btn ${dateActive === 'past_month' ? 'date-active' : ''}`} onClick={() => { setDateFilter('past_month'); setDateActive('past_month'); }}>Past month</button>
        <button className="switch-btn" style={{marginLeft: 'auto'}} onClick={() => setFilter(filter === 'task' ? 'meeting' : 'task')}>
          <span className={filter === 'task' ? 'active' : ''}>Tasks</span>
          <span className={filter === 'meeting' ? 'active' : ''}>Meeting</span>
        </button>
      </div>

      <div className="calendar-summary">
        <div className="summary-item">
          <h3>Total tasks</h3>
          <p>{totalTasks}</p>
        </div>
        <div className="summary-item">
          <h3>Done</h3>
          <p>{doneTasks}</p>
        </div>
        <div className="summary-item">
          <h3>In progress</h3>
          <p>{inProgressTasks}</p>
        </div>
      </div>

      <div className="weekly-view-container">
        <div className="weekly-header">
          <h3>Weekly View</h3>
        </div>
        
        <div className="weekly-table-container">
          <div className="weekly-table">
            {/* Table Header */}
            <div className="weekly-header-row">
              <div className="weekly-col">Date</div>
              <div className="weekly-col">Timeline</div>
              <div className="weekly-col">Task Name</div>
              <div className="weekly-col">Task Type</div>
              <div className="weekly-col">Status</div>
              <div className="weekly-col">Assignee</div>
              <div className="weekly-col">Link</div>
            </div>

            {/* Table Rows */}
            {filteredTasks.map((task, i) => (
              <div key={i} className="weekly-row">
                <div className="weekly-col">
                  <span className="date-text">{formatDate(task.date || task.dueDate)}</span>
                </div>
                <div className="weekly-col">
                  <span className="timeline-text">{getTimeline(task)}</span>
                </div>
                <div className="weekly-col">
                  <span className="task-name">{getDisplayName(task)}</span>
                </div>
                <div className="weekly-col">
                  <span className="task-type">{getTaskType(task)}</span>
                </div>
                <div className="weekly-col">
                  <span className="status-text">{getStatusIcon(task.status)} {task.status || 'Not Started'}</span>
                </div>
                <div className="weekly-col">
                  <span className="assignee-text">{getAssignee(task)}</span>
                </div>
                <div className="weekly-col">
                  {getFileLink(task) ? (
                    <a href={getFileLink(task)} target="_blank" rel="noopener noreferrer" className="file-link">
                      Open
                    </a>
                  ) : (
                    <span className="no-link">No link</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="download-btn">Download rpt</button>
    </div>
  );
}