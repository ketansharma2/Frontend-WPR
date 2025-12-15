import React, { useState, useRef, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";
import "./TaskPopup.css";

export default function TaskPopup({ open, onClose, addTask, editingTask, updateTask }) {
  const [isMeeting, setIsMeeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Task refs
  const taskNameRef = useRef();
  const dateRef = useRef();
  const timelineRef = useRef();
  const timeInMinsRef = useRef();
  const taskTypeRef = useRef();
  const statusRef = useRef();
  const fileLinkRef = useRef();

  // Meeting refs
  const meetingNameRef = useRef();
  const meetingDateRef = useRef();
  const deptRef = useRef();
  const copersonRef = useRef();
  const meetingTimeInMinsRef = useRef();
  const timeSlotRef = useRef();
  const meetingStatusRef = useRef();
  const notesRef = useRef();

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

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Only populate form if component is mounted and popup is open
    if (!isMounted || !open) return;
    
    if (editingTask) {
      const isMeetingType = editingTask.itemType === 'meeting';
      setIsMeeting(isMeetingType);
      
      // Add a small delay to ensure refs are ready
      setTimeout(() => {
        if (isMeetingType) {
          // Meeting fields mapping
          if (meetingNameRef.current) meetingNameRef.current.value = editingTask.meeting_name || editingTask.name || '';
          if (meetingDateRef.current) meetingDateRef.current.value = editingTask.date || '';
          if (deptRef.current) deptRef.current.value = editingTask.dept || editingTask.department || '';
          if (copersonRef.current) copersonRef.current.value = editingTask.co_person || editingTask.participants || '';
          if (meetingTimeInMinsRef.current) meetingTimeInMinsRef.current.value = editingTask.time_in_mins || '';
          if (timeSlotRef.current) timeSlotRef.current.value = editingTask.prop_slot || editingTask.timeSlot || '';
          if (meetingStatusRef.current) meetingStatusRef.current.value = editingTask.status || '';
          if (notesRef.current) notesRef.current.value = editingTask.notes || editingTask.agenda || '';
        } else {
          // Task fields mapping
          if (taskNameRef.current) taskNameRef.current.value = editingTask.task_name || editingTask.name || '';
          if (dateRef.current) dateRef.current.value = editingTask.date || editingTask.dueDate || '';
          if (timelineRef.current) timelineRef.current.value = editingTask.timeline || '';
          if (timeInMinsRef.current) timeInMinsRef.current.value = editingTask.time_in_mins || '';
          if (taskTypeRef.current) taskTypeRef.current.value = editingTask.task_type || editingTask.type || '';
          if (statusRef.current) statusRef.current.value = editingTask.status || '';
          if (fileLinkRef.current) fileLinkRef.current.value = editingTask.file_link || editingTask.attachments || '';
        }
      }, 100); // Small delay to ensure DOM is ready
    } else {
      // Reset form for new task/meeting
      setIsMeeting(false);
      clearForm();
    }
    setError('');
  }, [editingTask, open, isMounted]);

  const clearForm = () => {
    // Clear task fields
    if (taskNameRef.current) taskNameRef.current.value = '';
    if (dateRef.current) dateRef.current.value = '';
    if (timelineRef.current) timelineRef.current.value = '';
    if (timeInMinsRef.current) timeInMinsRef.current.value = '';
    if (taskTypeRef.current) taskTypeRef.current.value = '';
    if (statusRef.current) statusRef.current.value = '';
    if (fileLinkRef.current) fileLinkRef.current.value = '';
    
    // Clear meeting fields
    if (meetingNameRef.current) meetingNameRef.current.value = '';
    if (meetingDateRef.current) meetingDateRef.current.value = '';
    if (deptRef.current) deptRef.current.value = '';
    if (copersonRef.current) copersonRef.current.value = '';
    if (meetingTimeInMinsRef.current) meetingTimeInMinsRef.current.value = '';
    if (timeSlotRef.current) timeSlotRef.current.value = '';
    if (meetingStatusRef.current) meetingStatusRef.current.value = '';
    if (notesRef.current) notesRef.current.value = '';
  };

  const handleToggle = (type) => {
    setIsMeeting(type === 'meeting');
    clearForm();
  };

  const handleCreate = async () => {
    if (editingTask) {
      if (isMeeting) {
        // For editing meetings
        const updatedMeeting = {
          ...editingTask,
          meeting_name: meetingNameRef.current?.value || '',
          date: meetingDateRef.current?.value || '',
          dept: deptRef.current?.value || '',
          co_person: copersonRef.current?.value || '',
          time_in_mins: meetingTimeInMinsRef.current?.value || '',
          prop_slot: timeSlotRef.current?.value || '',
          status: meetingStatusRef.current?.value || '',
          notes: notesRef.current?.value || '',
          itemType: 'meeting',
        };
        updateTask(updatedMeeting);
      } else {
        // For editing tasks
        const updatedTask = {
          ...editingTask,
          task_name: taskNameRef.current?.value || '',
          date: dateRef.current?.value || '',
          timeline: timelineRef.current?.value || '',
          time_in_mins: timeInMinsRef.current?.value || '',
          task_type: taskTypeRef.current?.value || '',
          status: statusRef.current?.value || '',
          file_link: fileLinkRef.current?.value || '',
          itemType: 'task',
        };
        updateTask(updatedTask);
      }
    } else {
      if (isMeeting) {
        // For creating meetings
        const meeting = {
          name: meetingNameRef.current?.value || '',
          date: meetingDateRef.current?.value || '',
          dept: deptRef.current?.value || '',
          co_person: copersonRef.current?.value || '',
          time_in_mins: meetingTimeInMinsRef.current?.value || '',
          prop_slot: timeSlotRef.current?.value || '',
          status: meetingStatusRef.current?.value || 'Scheduled',
          notes: notesRef.current?.value || '',
          itemType: 'meeting',
        };
        addTask(meeting);
      } else {
        // For creating tasks
        const task = {
          name: taskNameRef.current?.value || '',
          date: dateRef.current?.value || '',
          timeline: timelineRef.current?.value || '',
          time_in_mins: timeInMinsRef.current?.value || '',
          task_type: taskTypeRef.current?.value || '',
          status: statusRef.current?.value || 'Not Started',
          file_link: fileLinkRef.current?.value || '',
          itemType: 'task',
        };
        addTask(task);
      }
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="enhanced-task-popup">
        {/* Header */}
        <div className="popup-header">
          <div className="header-content">
            <div className="title-section">
              <div>
                <h2 className="modal-title">
                  {editingTask ? (isMeeting ? 'Edit Meeting' : 'Edit Task') : (isMeeting ? 'New Meeting' : 'New Task')}
                </h2>
                <p className="modal-subtitle">
                  {editingTask ? (isMeeting ? 'Update meeting details' : 'Modify task details') : (isMeeting ? 'Plan and coordinate team collaboration' : 'Define objectives and assign responsibilities')}
                </p>
              </div>
            </div>
            <ToggleSwitch 
              onToggle={handleToggle}
              active={isMeeting ? "Meeting" : "Tasks"}
            />
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

        {/* Form Content - Professional Layout */}
        <div className="popup-content">
          <div className="form-grid-container">
            
            {!isMeeting ? (
              // TASK FORM
              <>
                {/* Task Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter task name"
                    ref={taskNameRef}
                    required
                  />
                </div>

                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    ref={dateRef}
                    required
                  />
                </div>

                {/* Timeline */}
                <div className="field-box span-6">
                  <label className="field-label">Timeline</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    placeholder="Select timeline date"
                    ref={timelineRef}
                  />
                </div>

                {/* Time (in mins) */}
                <div className="field-box span-6">
                  <label className="field-label">Time (in mins)</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    ref={timeInMinsRef}
                  />
                </div>

                {/* Task Type */}
                <div className="field-box span-6">
                  <label className="field-label">Task Type</label>
                  <select className="enhanced-select" ref={taskTypeRef}>
                    <option>Fixed</option>
                    <option>Variable</option>
                    <option>HOD Assigned</option>
                    <option>Team</option>
                    <option>Collaboration</option>
                  </select>
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select className="enhanced-select" ref={statusRef}>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Done</option>
                    <option>Cancelled</option>
                    <option>On Hold</option>
                  </select>
                </div>

                {/* File Link */}
                <div className="field-box span-6">
                  <label className="field-label">File Link</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter file link"
                    ref={fileLinkRef}
                  />
                </div>
              </>
            ) : (
              // MEETING FORM
              <>
                {/* Meeting Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Meeting Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter meeting name"
                    ref={meetingNameRef}
                    required
                  />
                </div>

                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    ref={meetingDateRef}
                    required
                  />
                </div>

                {/* Dept */}
                <div className="field-box span-6">
                  <label className="field-label">Dept</label>
                  <select className="enhanced-select" ref={deptRef}>
                    <option>Marketing</option>
                    <option>Design</option>
                    <option>HR</option>
                    <option>Sales</option>
                    <option>IT</option>
                    <option>Operations</option>
                    <option>Finance</option>
                  </select>
                </div>

                {/* Coperson */}
                <div className="field-box span-6">
                  <label className="field-label">Coperson</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter co-person name"
                    ref={copersonRef}
                  />
                </div>

                {/* Time in mins */}
                <div className="field-box span-6">
                  <label className="field-label">Time in mins</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    ref={meetingTimeInMinsRef}
                  />
                </div>

                {/* Time Slot */}
                <div className="field-box span-6">
                  <label className="field-label">Time Slot</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter time slot"
                    ref={timeSlotRef}
                  />
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select className="enhanced-select" ref={meetingStatusRef}>
                    <option>Scheduled</option>
                    <option>Proposal</option>
                    <option>Re-scheduled</option>
                    <option>Done</option>
                    <option>On Hold</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="field-box span-12">
                  <label className="field-label">Notes</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter meeting notes"
                    ref={notesRef}
                  />
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="popup-footer">
          <div className="footer-tips">
            <span>💡</span>
            <span>Fields marked with * are required</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="submit-btn" onClick={handleCreate} disabled={loading}>
              {loading ? 'Saving...' : (editingTask ? (isMeeting ? 'Update Meeting' : 'Update Task') : (isMeeting ? 'Create Meeting' : 'Create Task'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}