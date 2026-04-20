import React, { useState, useMemo , useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './FullTaskPage.css';
import { api } from '../config/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Types
const Subtask = {
  // interface
};

const Meeting = {
  // interface
};

const InputUpdate = {
  // interface
};

const TaskHistory = {
  // interface
};

const Task = {
  // interface
};



// Components

const TaskHeader = ({ task, progress, subtasks, meetings }) => {
  const completedSubtasks = subtasks.filter(s => s.status === 'Done').length;
  const totalSubtasks = subtasks.length;
  console.log('check assign task:',task);

  return (
    <header style={{ background: 'hsl(var(--primary))', color: 'white', padding: '0.75rem 1.5rem', borderBottom: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>{task.task_name || task.name}</h1>
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              background: 'rgba(255,255,255,0.3)',
              color: 'white'
            }}>{task.category === 'self' ? 'Self Task' : 'Master Task'}</span>
            <span style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              background: 'rgba(255,255,255,0.3)',
              color: 'white'
            }}>{task.status}</span>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, color: 'white', textAlign: 'left' }}>
            <strong>Parameter:</strong> {task.category === 'assigned' ? (task.parameter || 'N/A') : task.name} • <strong>End Goal:</strong> {task.category === 'assigned' ? (task.end_goal || 'N/A') : (task.endGoal || 'N/A')} • <strong>Assigner Remarks:</strong> {task.category === 'assigned' ? (task.assignee_remarks || 'N/A') : 'N/A'}
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, color: 'white', textAlign: 'left' }}>
            <strong>Assigned By:</strong> {task.category === 'self' ? 'Self' : (task.assigned_by_user?.name || task.assigned_by || 'N/A')} • <strong>Remarks:</strong> {task.remarks}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, textTransform: 'uppercase', color: 'white' }}>Deadline</p>
          <p style={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'white' }}>
            {task.timeline ? new Date(task.timeline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <div style={{ width: '6rem', height: '0.5rem', background: 'rgba(255,255,255,0.3)', borderRadius: '0.25rem' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'white', borderRadius: '0.25rem' }}></div>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white' }}>{Math.round(progress)}%</span>
          </div>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, color: 'white' }}>
            {completedSubtasks}/{totalSubtasks} subtasks • {meetings.length} meetings
          </p>
        </div>
      </div>
    </header>
  );
};

const SubtaskSlider = ({ subtasks, onAddSubtask }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [newSubtask, setNewSubtask] = useState({
    name: '',
    startDate: '',
    deadline: '',
    status: 'Not Started',
    timeSpent: '',
    link: '',
    remarks: ''
  });

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(subtasks.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleSubtasks = subtasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handleAddSubtask = () => {
    if (newSubtask.name && newSubtask.startDate && newSubtask.deadline) {
      onAddSubtask(newSubtask);
      setNewSubtask({
        name: '',
        startDate: '',
        deadline: '',
        status: 'Not Started',
        timeSpent: '',
        link: '',
        remarks: ''
      });
      setIsDialogOpen(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid hsl(var(--border))', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.7))', color: 'white' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>SUBTASK</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={handlePrevPage} disabled={currentPage === 0} style={{ padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '0.25rem' }}>{'<'}</button>
              <span>{currentPage + 1} / {totalPages}</span>
              <button onClick={handleNextPage} disabled={currentPage === totalPages - 1} style={{ padding: '0.25rem 0.5rem', border: '1px solid hsl(var(--border))', borderRadius: '0.25rem' }}>{'>'}</button>
            </div>
          )}
          <button onClick={() => setIsDialogOpen(true)} style={{ padding: '0.25rem 0.75rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', borderRadius: '0.25rem' }}>Add Sub</button>
        </div>
      </div>

      {isDialogOpen && (
        <div className="modal-overlay">
          <div className="enhanced-task-popup">
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">Add New Subtask</h2>
                  <p className="modal-subtitle">Add a new subtask to the task</p>
                </div>
              </div>
            </div>

            {/* Form Content - Professional Layout */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* Subtask Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Subtask Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter subtask name"
                    value={newSubtask.name}
                    onChange={(e) => setNewSubtask({ ...newSubtask, name: e.target.value })}
                    required
                  />
                </div>

                {/* Start Date */}
                <div className="field-box span-6">
                  <label className="field-label">Start Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={newSubtask.startDate}
                    onChange={(e) => setNewSubtask({ ...newSubtask, startDate: e.target.value })}
                  />
                </div>

                {/* Deadline */}
                <div className="field-box span-6">
                  <label className="field-label">Deadline</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={newSubtask.deadline}
                    onChange={(e) => setNewSubtask({ ...newSubtask, deadline: e.target.value })}
                  />
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select
                    className="enhanced-select"
                    value={newSubtask.status}
                    onChange={(e) => setNewSubtask({ ...newSubtask, status: e.target.value })}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                {/* Time Spent */}
                <div className="field-box span-6">
                  <label className="field-label">Time Spent</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    value={newSubtask.timeSpent}
                    onChange={(e) => setNewSubtask({ ...newSubtask, timeSpent: e.target.value })}
                  />
                </div>

                {/* Link */}
                <div className="field-box span-6">
                  <label className="field-label">Link (optional)</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter link"
                    value={newSubtask.link}
                    onChange={(e) => setNewSubtask({ ...newSubtask, link: e.target.value })}
                  />
                </div>

                {/* Remarks */}
                <div className="field-box span-6">
                  <label className="field-label">Remarks (optional)</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter remarks"
                    value={newSubtask.remarks}
                    onChange={(e) => setNewSubtask({ ...newSubtask, remarks: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="popup-footer">
              <div className="footer-tips">
                <span>💡</span>
                <span>Fields marked with * are required</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-btn" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleAddSubtask}>
                  Add Subtask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>SNO</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>SUBTASK</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>START DATE</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>DEADLINE</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>STATUS</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TIME SPENT</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>LINKS</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {visibleSubtasks.map((subtask, index) => (
              <tr key={subtask.subtask_id || subtask.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>{startIndex + index + 1}</td>
                <td style={{ padding: '0.75rem', fontWeight: '500', textAlign: 'left' }}>{subtask.subtask_name || subtask.name}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{subtask.date ? new Date(subtask.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{subtask.timeline ? new Date(subtask.timeline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'left' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: subtask.status === 'Done' ? 'hsl(var(--success))' : 'hsl(var(--muted))',
                    color: subtask.status === 'Done' ? 'white' : 'black'
                  }}>{subtask.status}</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{subtask.time_spent || '-'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {subtask.file_links && subtask.file_links.length > 0 ? <a href={subtask.file_links[0]} target="_blank" rel="noopener noreferrer">Link</a> : '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'left' }}>{subtask.notes || subtask.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid hsl(var(--border))' }}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '9999px',
                background: currentPage === idx ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                border: 'none',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Similarly for MeetingList and InputPanel, but to save space, I'll summarize

const MeetingList = ({ meetings, onAddMeeting }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedCoPersons, setSelectedCoPersons] = useState([]);
  const [showCoPersonDropdown, setShowCoPersonDropdown] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    department: '',
    coPerson: '',
    timeInMins: '',
    slotTimings: '',
    status: 'Scheduled',
    notes: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.coperson-dropdown-container') && !event.target.closest('.coperson-input')) {
        setShowCoPersonDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle co-person checkbox selection
  const handleCoPersonToggle = (memberName) => {
    setSelectedCoPersons(prev => {
      const isSelected = prev.includes(memberName);
      const newSelection = isSelected
        ? prev.filter(name => name !== memberName)
        : [...prev, memberName];

      // Update the participants field with comma-separated values
      setNewMeeting(prevMeeting => ({ ...prevMeeting, coPerson: newSelection.join(', ') }));
      return newSelection;
    });
  };

  const fetchMembers = async () => {
    try {
      const membersData = await api.getMembers();
      setMembers(membersData.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleAddMeeting = () => {
    if (newMeeting.title && newMeeting.coPerson && newMeeting.timeInMins) {
      onAddMeeting(newMeeting);
      setNewMeeting({
        title: '',
        date: '',
        department: '',
        coPerson: '',
        timeInMins: '',
        slotTimings: '',
        status: 'Scheduled',
        notes: ''
      });
      setSelectedCoPersons([]);
      setShowCoPersonDropdown(false);
      setIsDialogOpen(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Done': return 'status-completed';
      case 'Re-Scheduled': return 'status-rescheduled';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  return (
    <div className="meeting-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border))', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.7))', color: 'white' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>MEETINGS</h3>
        <button onClick={() => setIsDialogOpen(true)} style={{ padding: '0.25rem 0.75rem', background: 'hsl(var(--primary))', color: 'white', border: 'none', borderRadius: '0.25rem' }}>Add Meeting</button>
      </div>

      {isDialogOpen && (
        <div className="modal-overlay">
          <div className="enhanced-task-popup">
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">Add New Meeting</h2>
                  <p className="modal-subtitle">Schedule a new meeting</p>
                </div>
              </div>
            </div>

            {/* Form Content - Professional Layout */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* Meeting Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Meeting Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter meeting name"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    required
                  />
                </div>

                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  />
                </div>

                {/* Dept */}
                <div className="field-box span-6">
                  <label className="field-label">Dept</label>
                  <select
                    className="enhanced-select"
                    value={newMeeting.department}
                    onChange={(e) => setNewMeeting({ ...newMeeting, department: e.target.value })}
                  >
                    <option value="">Select department</option>
                    <option value="All">All</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="HR">HR</option>
                    <option value="Sales">Sales</option>
                    <option value="IT">IT</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Tech">Tech</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                {/* Coperson */}
                <div className="field-box span-6">
                  <label className="field-label">Coperson</label>
                  <div className="coperson-dropdown-container">
                    <input
                      type="text"
                      className="enhanced-input coperson-input"
                      placeholder="Select co-person"
                      value={newMeeting.coPerson}
                      onClick={() => setShowCoPersonDropdown(!showCoPersonDropdown)}
                      readOnly
                    />
                    {showCoPersonDropdown && (
                      <div className="dropdown-menu">
                        {/* Special options */}
                        <div className="dropdown-item">
                          <label className="coperson-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedCoPersons.includes('All')}
                              onChange={() => handleCoPersonToggle('All')}
                              className="coperson-checkbox"
                            />
                            <span className="coperson-name">All</span>
                          </label>
                        </div>
                        <div className="dropdown-item">
                          <label className="coperson-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedCoPersons.includes('Other')}
                              onChange={() => handleCoPersonToggle('Other')}
                              className="coperson-checkbox"
                            />
                            <span className="coperson-name">Other</span>
                          </label>
                        </div>
                        <div className="dropdown-item">
                          <label className="coperson-checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedCoPersons.includes('Team Meet')}
                              onChange={() => handleCoPersonToggle('Team Meet')}
                              className="coperson-checkbox"
                            />
                            <span className="coperson-name">Team Meet</span>
                          </label>
                        </div>
                        {members.length > 0 ? members.map(member => (
                          <div key={member.user_id || member.id} className="dropdown-item">
                            <label className="coperson-checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedCoPersons.includes(member.name || member.username)}
                                onChange={() => handleCoPersonToggle(member.name || member.username)}
                                className="coperson-checkbox"
                              />
                              <span className="coperson-name">{member.name || member.username}</span>
                            </label>
                          </div>
                        )) : (
                          <div className="dropdown-item disabled">No team members available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Time in mins */}
                <div className="field-box span-6">
                  <label className="field-label">Time in mins</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    value={newMeeting.timeInMins}
                    onChange={(e) => setNewMeeting({ ...newMeeting, timeInMins: e.target.value })}
                  />
                </div>

                {/* Time Slot */}
                <div className="field-box span-6">
                  <label className="field-label">Time Slot</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter time slot"
                    value={newMeeting.slotTimings}
                    onChange={(e) => setNewMeeting({ ...newMeeting, slotTimings: e.target.value })}
                  />
                </div>

              

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select
                  className="enhanced-select"
                  value={newMeeting.status}
                  onChange={(e) => setNewMeeting({ ...newMeeting, status: e.target.value })}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Done">Done</option>
                  <option value="Re-Scheduled">Re-Scheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                </div>

                {/* Notes */}
                <div className="field-box span-12">
                  <label className="field-label">Remarks</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter meeting notes"
                    value={newMeeting.notes}
                    onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="popup-footer">
              <div className="footer-tips">
                <span>💡</span>
                <span>Fields marked with * are required</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-btn" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleAddMeeting}>
                  Add Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

<div className="meeting-table-wrapper" style={{ overflowX: 'auto' }}>
  <table className="meeting-table" style={{ 
    width: '100%', 
    borderCollapse: 'collapse',
    minWidth: '800px' // Ensures table doesn't collapse on small screens
  }}>
    <thead>
      <tr style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', width: '60px' }}>SNO</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>MEETING TITLE</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>CO PERSON</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>DEPT.</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>TIME</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>SLOT TIMINGS</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>STATUS</th>
        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem' }}>NOTES</th>
      </tr>
    </thead>
    <tbody>
      {meetings.map((meeting, index) => (
        <tr key={meeting.id || `meeting-${index}`} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{index + 1}</td>
          <td style={{ padding: '0.75rem', fontWeight: '500', textAlign: 'left' }}>{meeting.title}</td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{meeting.coPerson}</td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{meeting.department}</td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{meeting.time ? `${meeting.time} mins` : '-'}</td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{meeting.slotTimings || '-'}</td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '500',
              display: 'inline-block',
              background: meeting.status === 'Done' ? 'hsl(142, 76%, 36%)' : 
                         meeting.status === 'Cancelled' ? 'hsl(0, 84%, 60%)' :
                         meeting.status === 'Re-Scheduled' ? 'hsl(38, 92%, 50%)' :
                         'hsl(217, 91%, 60%)',
              color: 'white'
            }}>
              {meeting.status}
            </span>
          </td>
          <td style={{ padding: '0.75rem', textAlign: 'left' }}>{meeting.notes || '-'}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
};

const InputPanel = ({ inputUpdates, taskHistory, onAddUpdate, onOpenUpdateModal }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    inputBy: '',
    input: '',
    action: '',
    output: ''
  });

  const handleAddUpdate = () => {
    if (newUpdate.inputBy && newUpdate.input) {
      onAddUpdate(newUpdate);
      setNewUpdate({
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        inputBy: '',
        input: '',
        action: '',
        output: ''
      });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="input-panel">
      <div className="panel-card">
        <div className="panel-header">
          <h3 className="panel-title">Input Updates</h3>
          <button onClick={() => setIsDialogOpen(true)} className="add-input-btn">+</button>
        </div>

        {isDialogOpen && (
          <div className="modal-overlay">
            <div className="enhanced-task-popup">
              {/* Header */}
              <div className="popup-header">
                <div className="header-content">
                  <div className="title-section">
                    <h2 className="modal-title">Add Input Update</h2>
                    <p className="modal-subtitle">Add a new input update</p>
                  </div>
                </div>
              </div>

              {/* Form Content - Professional Layout */}
              <div className="popup-content">
                <div className="form-grid-container">
                  {/* Date */}
                  <div className="field-box span-6">
                    <label className="field-label required">Date</label>
                    <input
                      type="date"
                      className="enhanced-input"
                      value={newUpdate.date}
                      onChange={(e) => setNewUpdate({ ...newUpdate, date: e.target.value })}
                      required
                    />
                  </div>

                  {/* Input By */}
                  <div className="field-box span-6">
                    <label className="field-label required">Input By</label>
                    <input
                      type="text"
                      className="enhanced-input"
                      placeholder="Enter input by"
                      value={newUpdate.inputBy}
                      onChange={(e) => setNewUpdate({ ...newUpdate, inputBy: e.target.value })}
                      required
                    />
                  </div>

                  {/* Input */}
                  <div className="field-box span-12">
                    <label className="field-label required">Input</label>
                    <input
                      type="text"
                      className="enhanced-input"
                      placeholder="Enter input"
                      value={newUpdate.input}
                      onChange={(e) => setNewUpdate({ ...newUpdate, input: e.target.value })}
                      required
                    />
                  </div>

                  {/* Updated Deadline */}
                  <div className="field-box span-6">
                    <label className="field-label">Updated Deadline</label>
                    <input
                      type="date"
                      className="enhanced-input"
                      value={newUpdate.action}
                      onChange={(e) => setNewUpdate({ ...newUpdate, action: e.target.value })}
                    />
                  </div>

                  {/* Impact of Changes */}
                  <div className="field-box span-6">
                    <label className="field-label">Impact of Changes</label>
                    <input
                      type="text"
                      className="enhanced-input"
                      placeholder="Enter impact of changes"
                      value={newUpdate.output}
                      onChange={(e) => setNewUpdate({ ...newUpdate, output: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="popup-footer">
                <div className="footer-tips">
                  <span>💡</span>
                  <span>Fields marked with * are required</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="cancel-btn" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </button>
                  <button className="submit-btn" onClick={handleAddUpdate}>
                    Add Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="updates-cards-wrapper" style={{ maxHeight: '16rem', overflowY: 'auto', padding: '0.5rem', maxWidth: '425px' }}>
          {inputUpdates.length > 0 ? (
            inputUpdates.map((update) => (
              <div key={update.id} className="update-card" style={{
                background: 'white',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                position: 'relative',
                width: '100%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                    {new Date(update.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: '500' }}>
                    By: {update.inputBy}
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'black', marginBottom: '0.25rem', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    Input: {update.input}
                  </div>
                  {update.output && (
                    <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'black', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                      Impact: {update.output}
                    </div>
                  )}
                  {update.action && (
                    <div style={{ fontSize: '0.85rem', color: 'black', fontWeight: '500', marginTop: '0.25rem', textAlign: 'left' }}>
                      Deadline: {new Date(update.action).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <button onClick={() => onOpenUpdateModal(update)} style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  background: 'none',
                  border: 'none',
                  borderRadius: '0.25rem',
                  padding: '0.25rem',
                  cursor: 'pointer'
                }}>
                  <img src="/full-size.png" alt="Full View" style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '0.875rem'
            }}>
              No input updates yet
            </div>
          )}
        </div>
      </div>

      <div className="panel-card history-card">
        <div className="history-header">
          <span>📅</span>
          <h3 className="history-title">Task History</h3>
        </div>
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr className="history-table-header">
                <th className="history-th">Date</th>
                <th className="history-th">Time</th>
                <th className="history-th">Remarks</th>
                <th className="history-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {taskHistory.map((history) => (
                <tr key={history.id} className="history-row">
                  <td className="history-td">{history.date}</td>
                  <td className="history-td">{history.time_spent || '-'}</td>
                  <td className="history-td">{history.remarks || '-'}</td>
                  <td className="history-td">{history.status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TaskView = ({ task: propTask, onClose, onLogout }) => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [task, setTask] = useState(propTask || location.state?.task);
  const [subtasks, setSubtasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [inputUpdates, setInputUpdates] = useState([]);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loadingInputs, setLoadingInputs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  function openUpdateModal(update) {
    setSelectedUpdate(update);
    setIsUpdateModalOpen(true);
  }

  // Get user profile from localStorage
  useEffect(() => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error("Error parsing user profile:", error);
      }
    }
  }, []);

  // Fetch task data if using routing (taskId from URL)
  useEffect(() => {
    if (taskId && !propTask && !location.state?.task) {
      fetchTaskData(taskId);
    } else if (propTask) {
      setTask(propTask);
    } else if (location.state?.task) {
      setTask(location.state.task);
    }
  }, [taskId, propTask, location.state?.task]);

  // Fetch subtasks and meetings when task changes
  useEffect(() => {
    if (task?.task_id) {
      fetchSubtasks(task.task_id);
      fetchMeetings(task.task_id);
      fetchInputs(task.task_id);
      fetchTaskHistory(task.task_id);
    }
  }, [task]);

  const fetchTaskData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        console.error("Authentication required");
        return;
      }

      // Try to fetch as task first
      let response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) {
        // If not found as task, try as meeting
        response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('check task data:',result);
        const taskData = result.task || result.meeting;
        if (taskData) {
          setTask(taskData);
        }
      } else {
        console.error('Task not found');
        navigate('/tasks'); // Redirect to tasks list if task not found
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };


  const fetchSubtasks = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/subtasks/${taskId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setSubtasks(result.subtasks || []);
      }
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    }
  };
  
  const fetchMeetings = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/task_meetings/${taskId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        console.log('Fetched meetings for task:', result.meetings);
        const mapped = result.meetings.map(m => ({
          id: m.meeting_id || m.id,
          title: m.meeting_name || m.title,
          coPerson: m.co_person || m.coPerson,
          department: m.dept || m.department,
          time: m.time,
          slotTimings: m.prop_slot || m.slotTimings,
          status: m.status,
          notes: m.notes
        })) || [];
        console.log('Mapped meetings:', mapped);
        setMeetings(mapped);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const fetchInputs = async (taskId) => {
    try {
      setLoadingInputs(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/inputs/${taskId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setInputUpdates(result.inputs.map(i => ({
          id: i.input_id,
          date: i.date,
          inputBy: i.input_by,
          input: i.input,
          action: i.deadline || '',
          output: i.impact_of_changes
        })) || []);
      }
    } catch (error) {
      console.error('Error fetching inputs:', error);
    } finally {
      setLoadingInputs(false);
    }
  };

  const fetchTaskHistory = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/task_history/${taskId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        const mappedHistory = (result.history || []).map(h => ({
          id: h.id || Math.random(),
          date: h.history_date || h.changed_at,
          time_spent: h.time_spent,
          remarks: h.remarks,
          status: h.status,
          changedBy: h.changed_by
        }));
        setTaskHistory(mappedHistory);
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
    }
  };
  
  const progress = useMemo(() => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.status === 'Done').length;
    return (completed / subtasks.length) * 100;
  }, [subtasks]);

  const handleAddSubtask = async (newSubtask) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        task_id: task.task_id,
        subtask_name: newSubtask.name,
        date: newSubtask.startDate,
        timeline: newSubtask.deadline,
        time_spent: newSubtask.timeSpent || 0,
        file_links: newSubtask.link ? [newSubtask.link] : [],
        status: newSubtask.status,
        remarks: newSubtask.remarks
      };

      console.log('Sending subtask payload:', payload);

      const response = await fetch(`${API_BASE_URL}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Subtask API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Subtask created successfully:', result);
        fetchSubtasks(task.task_id); // Refresh subtasks
      } else {
        const errorText = await response.text();
        console.error('Error adding subtask - Status:', response.status, 'Response:', errorText);
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleAddMeeting = async (newMeeting) => {
    console.log('handleAddMeeting called with:', newMeeting);
    console.log('Validation check: title:', newMeeting.title, 'coPerson:', newMeeting.coPerson, 'time:', newMeeting.time, 'timeInMins:', newMeeting.timeInMins);
    try {
      const token = localStorage.getItem("token");
      console.log('Token present:', !!token);
      const payload = {
        user_id: task.user_id,
        task_id: task.task_id,
        meeting_name: newMeeting.title,
        date: newMeeting.date,
        dept: newMeeting.department,
        co_person: newMeeting.coPerson,
        time: newMeeting.timeInMins,
        prop_slot: newMeeting.slotTimings,
        status: newMeeting.status,
        notes: newMeeting.notes
      };
      console.log('Payload to send:', payload);

      const response = await fetch(`${API_BASE_URL}/meetings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      console.log('Response status:', response.status, 'ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Response data:', result);
        // Refresh meetings if needed, but since it's local, perhaps not
        setMeetings(prev => [...prev, { ...newMeeting, id: `new-${Date.now()}` }]);
      } else {
        const errorText = await response.text();
        console.error('Error adding meeting, status:', response.status, 'response:', errorText);
      }
    } catch (error) {
      console.error('Error adding meeting:', error);
    }
  };

  const handleAddInputUpdate = async (newUpdate) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        task_id: task.task_id,
        date: newUpdate.date,
        input: newUpdate.input,
        input_by: newUpdate.inputBy,
        deadline: newUpdate.action,
        impact_of_changes: newUpdate.output
      };

      const response = await fetch(`${API_BASE_URL}/inputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        fetchInputs(task.task_id); // Refresh inputs
      } else {
        console.error('Error adding input');
      }
    } catch (error) {
      console.error('Error adding input:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Task not found</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar userRole={userProfile?.user_type} />
      <Header
        addTask={() => {}} // Empty function since we don't need it here
        openPopup={() => {}} // Empty function since we don't need it here
        currentView="tasks"
        onLogout={onLogout}
        user={userProfile}
        isAddDisabled={true} // Disable add button on task page
      />

      <main style={{ padding: '30px', backgroundColor: 'white' }}>
        <div style={{ minHeight: '100vh' }}>
          <div style={{ marginTop: '20px' }}>
            <TaskHeader task={task} progress={progress} subtasks={subtasks} meetings={meetings} />
          </div>

          <div className="task-content" style={{ padding: '15px 0 0 0' }}>
            <div className="main-section">
              <SubtaskSlider subtasks={subtasks} onAddSubtask={handleAddSubtask} />
              <MeetingList meetings={meetings} onAddMeeting={handleAddMeeting} />
            </div>

            <div className="side-section">
              <InputPanel inputUpdates={inputUpdates} taskHistory={taskHistory} onAddUpdate={handleAddInputUpdate} onOpenUpdateModal={openUpdateModal} />
            </div>
          </div>
        </div>
      </main>

      {isUpdateModalOpen && selectedUpdate && (
        <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
          <div className="enhanced-task-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">Input Update Details</h2>
                  <p className="modal-subtitle">Full details of the input update</p>
                </div>
              </div>
            </div>

            <div className="popup-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'hsl(var(--primary))' }}>
                  {new Date(selectedUpdate.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                {selectedUpdate.action && (
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: '500' }}>
                    Deadline: {new Date(selectedUpdate.action).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: '500' }}>
                  By: {selectedUpdate.inputBy}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '1rem', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>Input</h4>
                  <div style={{ fontSize: '0.85rem', color: 'black' }}>
                    {selectedUpdate.input}
                  </div>
                </div>
                {selectedUpdate.output && (
                  <div style={{ background: 'white', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '1rem', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>Impact of Changes</h4>
                    <div style={{ fontSize: '0.85rem', color: 'black' }}>
                      {selectedUpdate.output}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="popup-footer">
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-btn" onClick={() => setIsUpdateModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskView;