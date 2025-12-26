import React, { useState, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";
import "./TaskPopup.css";

export default function TaskPopup({ open, onClose, addTask, editingTask, updateTask, mode = "create", teamMembers = [] }) {
  const [isMeeting, setIsMeeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Task state
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [timeline, setTimeline] = useState('');
  const [time, setTime] = useState('');
  const [taskType, setTaskType] = useState('Fixed');
  const [status, setStatus] = useState('Not Started');
  const [attachments, setAttachments] = useState('');
  const [remarks, setRemarks] = useState('');

  // Meeting state
  const [meetingName, setMeetingName] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [dept, setDept] = useState('Marketing');
  const [participants, setParticipants] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [meetingStatus, setMeetingStatus] = useState('Scheduled');
  const [agenda, setAgenda] = useState('');

  // Assign task state
  const [assignDate, setAssignDate] = useState('');
  const [assignTimeline, setAssignTimeline] = useState('');
  const [assignTaskName, setAssignTaskName] = useState('');
  const [assignParameter, setAssignParameter] = useState('');
  const [assignEndGoal, setAssignEndGoal] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [assignStatus, setAssignStatus] = useState('Not Started');

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

      if (isMeetingType) {
        // Meeting fields mapping
        setMeetingName(editingTask.meeting_name || editingTask.name || '');
        setMeetingDate(editingTask.date || '');
        setDept(editingTask.dept || editingTask.department || 'Marketing');
        setParticipants(editingTask.co_person || editingTask.participants || '');
        setMeetingTime(editingTask.time_in_mins || '');
        setTimeSlot(editingTask.prop_slot || editingTask.timeSlot || '');
        setMeetingStatus(editingTask.status || 'Scheduled');
        setAgenda(editingTask.notes || editingTask.agenda || '');
      } else {
        // Task fields mapping
        setTaskName(editingTask.task_name || editingTask.name || '');
        setDueDate(editingTask.date || editingTask.dueDate || '');
        setTimeline(editingTask.timeline || '');
        setTime(editingTask.time_in_mins || editingTask.time || '');
        setTaskType(editingTask.task_type || editingTask.type || 'Fixed');
        setStatus(editingTask.status || 'Not Started');
        setAttachments(editingTask.file_link || editingTask.attachments || '');
        setRemarks(editingTask.remarks || '');
        setRemarks(editingTask.remarks || '');
      }
    } else {
      // Reset form for new task/meeting
      setIsMeeting(false);
      clearForm();
    }
    setError('');
  }, [editingTask, open, isMounted]);

  const clearForm = () => {
    // Clear task fields
    setTaskName('');
    setDueDate('');
    setTimeline('');
    setTime('');
    setTaskType('Fixed');
    setStatus('Not Started');
    setAttachments('');
    setRemarks('');
    setRemarks('');

    // Clear meeting fields
    setMeetingName('');
    setMeetingDate('');
    setDept('Marketing');
    setParticipants('');
    setMeetingTime('');
    setTimeSlot('');
    setMeetingStatus('Scheduled');
    setAgenda('');

    // Clear assign fields
    setAssignDate('');
    setAssignTimeline('');
    setAssignTaskName('');
    setAssignParameter('');
    setAssignEndGoal('');
    setAssignRemarks('');
    setAssignTo('');
    setAssignStatus('Not Started');
  };

  const handleToggle = (type) => {
    setIsMeeting(type === 'meeting');
    clearForm();
  };

  const handleCreate = async () => {
    if (mode === "assign") {
      // For assigning tasks
      const assignData = {
        date: assignDate,
        timeline: assignTimeline,
        taskName: assignTaskName,
        parameter: assignParameter,
        endGoal: assignEndGoal,
        remarks: assignRemarks,
        assignTo: assignTo,
        status: assignStatus,
      };
      addTask(assignData);
    } else if (editingTask) {
      if (isMeeting) {
        // For editing meetings
        const updatedMeeting = {
          ...editingTask,
          meeting_name: meetingName,
          date: meetingDate,
          dept: dept,
          co_person: participants,
          time_in_mins: meetingTime,
          prop_slot: timeSlot,
          status: meetingStatus,
          notes: agenda,
          itemType: 'meeting',
        };
        updateTask(updatedMeeting);
      } else {
        // For editing tasks
        const updatedTask = {
          ...editingTask,
          task_name: taskName,
          date: dueDate,
          timeline: timeline,
          time_in_mins: time,
          task_type: taskType,
          status: status,
          file_link: attachments,
          itemType: 'task',
        };
        updateTask(updatedTask);
      }
    } else {
      if (isMeeting) {
        // For creating meetings
        const meeting = {
          name: meetingName,
          date: meetingDate,
          dept: dept,
          co_person: participants,
          time_in_mins: meetingTime,
          prop_slot: timeSlot,
          status: meetingStatus,
          notes: agenda,
          itemType: 'meeting',
        };
        addTask(meeting);
      } else {
        // For creating tasks
        const task = {
          name: taskName,
          dueDate: dueDate,
          timeline: timeline,
          time: time,
          type: taskType,
          status: status,
          attachments: attachments,
          remarks: remarks,
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
                  {mode === "assign" ? "Assign Task" : editingTask ? (isMeeting ? 'Edit Meeting' : 'Edit Task') : (isMeeting ? 'New Meeting' : 'New Task')}
                </h2>
                <p className="modal-subtitle">
                  {mode === "assign" ? "Assign tasks to team members" : editingTask ? (isMeeting ? 'Update meeting details' : 'Modify task details') : (isMeeting ? 'Plan and coordinate team collaboration' : 'Define objectives and assign responsibilities')}
                </p>
              </div>
            </div>
            {mode !== "assign" && (
              <ToggleSwitch
                onToggle={handleToggle}
                active={isMeeting ? "Meeting" : "Tasks"}
              />
            )}
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

            {mode === "assign" ? (
              // ASSIGN TASK FORM
              <>
                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    required
                  />
                </div>

                {/* Timeline */}
                <div className="field-box span-6">
                  <label className="field-label">Timeline (date)</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={assignTimeline}
                    onChange={(e) => setAssignTimeline(e.target.value)}
                  />
                </div>

                {/* Task Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter task name"
                    value={assignTaskName}
                    onChange={(e) => setAssignTaskName(e.target.value)}
                    required
                  />
                </div>

                {/* Parameter */}
                <div className="field-box span-6">
                  <label className="field-label">Parameter</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter parameter"
                    value={assignParameter}
                    onChange={(e) => setAssignParameter(e.target.value)}
                  />
                </div>

                {/* End goal */}
                <div className="field-box span-6">
                  <label className="field-label">End goal</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter end goal"
                    value={assignEndGoal}
                    onChange={(e) => setAssignEndGoal(e.target.value)}
                  />
                </div>

                {/* Assignee Remarks */}
                <div className="field-box span-12">
                  <label className="field-label">Assignee Remarks</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter assignee remarks"
                    value={assignRemarks}
                    onChange={(e) => setAssignRemarks(e.target.value)}
                  />
                </div>

                {/* Assign to */}
                <div className="field-box span-6">
                  <label className="field-label">Assign to</label>
                  <select className="enhanced-select" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                    <option value="">Select team member</option>
                    {teamMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select className="enhanced-select" value={assignStatus} onChange={(e) => setAssignStatus(e.target.value)}>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Done</option>
                    <option>Cancelled</option>
                    <option>On Hold</option>
                  </select>
                </div>

                {/* Remarks */}
                <div className="field-box span-12">
                  <label className="field-label">Remarks</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter task remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </>
            ) : !isMeeting ? (
              // TASK FORM
              <>
                {/* Task Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter task name"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    required
                  />
                </div>

                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  />
                </div>

                {/* Time (in mins) */}
                <div className="field-box span-6">
                  <label className="field-label">Time (in mins)</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                {/* Task Type */}
                <div className="field-box span-6">
                  <label className="field-label">Task Type</label>
                  <select className="enhanced-select" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
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
                  <select className="enhanced-select" value={status} onChange={(e) => setStatus(e.target.value)}>
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
                    value={attachments}
                    onChange={(e) => setAttachments(e.target.value)}
                  />
                </div>

                {/* Remarks */}
                <div className="field-box span-12">
                  <label className="field-label">Remarks</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter task remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
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
                    value={meetingName}
                    onChange={(e) => setMeetingName(e.target.value)}
                    required
                  />
                </div>

                {/* Date */}
                <div className="field-box span-6">
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                  />
                </div>

                {/* Dept */}
                <div className="field-box span-6">
                  <label className="field-label">Dept</label>
                  <select className="enhanced-select" value={dept} onChange={(e) => setDept(e.target.value)}>
                    <option>All</option>
                    <option>Marketing</option>
                    <option>Design</option>
                    <option>HR</option>
                    <option>Sales</option>
                    <option>IT</option>
                    <option>Operations</option>
                    <option>Finance</option>
                    <option>Tech</option>
                    <option>Delivery</option>
                    <option>Legal</option>
                  </select>
                </div>

                {/* Coperson */}
                <div className="field-box span-6">
                  <label className="field-label">Coperson</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter co-person name"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                  />
                </div>

                {/* Time in mins */}
                <div className="field-box span-6">
                  <label className="field-label">Time in mins</label>
                  <input
                    type="number"
                    className="enhanced-input"
                    placeholder="Enter time in minutes"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </div>

                {/* Time Slot */}
                <div className="field-box span-6">
                  <label className="field-label">Time Slot</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter time slot"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select className="enhanced-select" value={meetingStatus} onChange={(e) => setMeetingStatus(e.target.value)}>
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
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
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
              {loading ? 'Saving...' : (mode === "assign" ? 'Assign Task' : editingTask ? (isMeeting ? 'Update Meeting' : 'Update Task') : (isMeeting ? 'Create Meeting' : 'Create Task'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}