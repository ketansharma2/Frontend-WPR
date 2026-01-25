import React, { useState, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";
import { api } from "../config/api";
import "./TaskPopup.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function TaskPopup({ open, onClose, addTask, editingTask, updateTask, mode = "create", teamMembers = [], isRestrictedEdit = false, isPreviousDay = false }) {
  const [isMeeting, setIsMeeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [taskSuggestions, setTaskSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [meetingTeamMembers, setMeetingTeamMembers] = useState([]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Task state
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDate());
  const [timeline, setTimeline] = useState(getTodayDate());
  const [time, setTime] = useState('');
  const [taskType, setTaskType] = useState('Fixed');
  const [status, setStatus] = useState('Not Started');
  const [attachments, setAttachments] = useState('');
  const [remarks, setRemarks] = useState('');

  // Meeting state
  const [meetingName, setMeetingName] = useState('');
  const [meetingDate, setMeetingDate] = useState(getTodayDate());
  const [dept, setDept] = useState('Marketing');
  const [participants, setParticipants] = useState('');
  const [selectedCoPersons, setSelectedCoPersons] = useState([]);
  const [showCoPersonDropdown, setShowCoPersonDropdown] = useState(false);
  const [meetingTime, setMeetingTime] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [meetingStatus, setMeetingStatus] = useState('Scheduled');
  const [agenda, setAgenda] = useState('');
  const [tagWithTask, setTagWithTask] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);

  // Assign task state - unified formData for create and edit
  const [assignFormData, setAssignFormData] = useState({
    date: '',
    timeline: '',
    taskName: '',
    parameter: '',
    endGoal: '',
    assignerRemarks: '',
    remarks: '',
    assignTo: '',
    status: 'Not Started',
    uploadClosing: ''
  });

  // Legacy assign task state variables (keeping for backward compatibility but not used)
  // const [assignDate, setAssignDate] = useState('');
  // const [assignTimeline, setAssignTimeline] = useState('');
  // const [assignTaskName, setAssignTaskName] = useState('');
  // const [assignParameter, setAssignParameter] = useState('');
  // const [assignEndGoal, setAssignEndGoal] = useState('');
  // const [assignRemarks, setAssignRemarks] = useState('');
  // const [assignTo, setAssignTo] = useState('');
  // const [assignStatus, setAssignStatus] = useState('Not Started');
  // const [assignUploadClosing, setAssignUploadClosing] = useState('');

  // Check if editing assigned task
  const isAssignEdit = mode === "assign" && editingTask;

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

  // Fetch task suggestions when creating a new task
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (open && !editingTask && !isMeeting && mode === "create") {
        try {
          const profile = JSON.parse(localStorage.getItem("profile"));
          if (profile?.user_id) {
            const data = await api.getTaskSuggestions(profile.user_id);
            console.log("Task suggestions fetched:", data.suggestions);
            setTaskSuggestions(data.suggestions || []);
          }
        } catch (err) {
          console.error("Failed to fetch task suggestions:", err);
          setTaskSuggestions([]);
        }
      }
    };

    fetchSuggestions();
  }, [open, editingTask, isMeeting, mode]);

  // Fetch meeting team members and tasks when creating a new meeting
  useEffect(() => {
    if (open && isMeeting && !editingTask && mode === "create") {
      api.getMembers().then(data => {
        setMeetingTeamMembers(data.members || []);
      }).catch(err => {
        console.error("Failed to fetch meeting members:", err);
        setMeetingTeamMembers([]);
      });

      // Fetch available tasks for tagging
      const profile = JSON.parse(localStorage.getItem("profile"));
      if (profile?.user_id) {
        // Use the same filter API as Home.js
        const token = localStorage.getItem("token");
        fetch(`${API_BASE_URL}/tasks/filter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: profile.user_id,
            date_filter: 'all',
            task_type: 'all',
            status: 'all',
            category: 'all'
          })
        }).then(response => response.json()).then(data => {
          // Combine master_tasks and self_tasks like in Home.js
          const allTasks = [
            ...(data.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned' })),
            ...(data.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self' }))
          ];
          setAvailableTasks(allTasks);
        }).catch(err => {
          console.error("Failed to fetch tasks:", err);
          setAvailableTasks([]);
        });
      }
    }
  }, [open, isMeeting, editingTask, mode]);

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

  useEffect(() => {
    // Only populate form if component is mounted and popup is open
    if (!isMounted || !open) return;

    if (editingTask) {
       if (mode === "assign") {
         // Populate assign fields for editing assigned task
         setAssignFormData({
           date: editingTask.date || '',
           timeline: editingTask.timeline || '',
           taskName: editingTask.task_name || editingTask.name || '',
           parameter: editingTask.parameter || '',
           endGoal: editingTask.end_goal || '',
           assignerRemarks: editingTask.assignee_remarks || '',
           remarks: editingTask.remarks || '',
           assignTo: editingTask.assigned_to || '',
           status: editingTask.status || 'Not Started',
           uploadClosing: editingTask.upload_closing || editingTask.file_link || ''
         });
       } else {
        const isMeetingType = editingTask.itemType === 'meeting';
        setIsMeeting(isMeetingType);

        if (isMeetingType) {
          // Meeting fields mapping
          setMeetingName(editingTask.meeting_name || editingTask.name || '');
          setMeetingDate(editingTask.date || '');
          setDept(editingTask.dept || editingTask.department || 'Marketing');
          const coPersonValue = editingTask.co_person || editingTask.participants || '';
          setParticipants(coPersonValue);
          // Parse comma-separated co-persons into array for checkbox state
          setSelectedCoPersons(coPersonValue ? coPersonValue.split(',').map(name => name.trim()).filter(name => name) : []);
          setMeetingTime(editingTask.time || '');
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
      }
    } else {
      // Reset form for new task/meeting
      setIsMeeting(false);
      clearForm();
    }
    setError('');
  }, [editingTask, open, isMounted, mode]);

  const clearForm = () => {
    // Clear task fields
    setTaskName('');
    setDueDate(getTodayDate());
    setTimeline(getTodayDate());
    setTime('');
    setTaskType('Fixed');
    setStatus('Not Started');
    setAttachments('');
    setRemarks('');
    setRemarks('');

    // Clear meeting fields
    setMeetingName('');
    setMeetingDate(getTodayDate());
    setDept('Marketing');
    setParticipants('');
    setSelectedCoPersons([]);
    setShowCoPersonDropdown(false);
    setMeetingTime('');
    setTimeSlot('');
    setMeetingStatus('Scheduled');
    setAgenda('');
    setTagWithTask('');
    setAvailableTasks([]);

    // Clear assign fields
    setAssignFormData({
      date: '',
      timeline: '',
      taskName: '',
      parameter: '',
      endGoal: '',
      assignerRemarks: '',
      remarks: '',
      assignTo: '',
      status: 'Not Started',
      uploadClosing: ''
    });
  };

  const handleToggle = (type) => {
    setIsMeeting(type === 'meeting');
    clearForm();
  };

  // Handle co-person checkbox selection
  const handleCoPersonToggle = (memberName) => {
    setSelectedCoPersons(prev => {
      const isSelected = prev.includes(memberName);
      const newSelection = isSelected
        ? prev.filter(name => name !== memberName)
        : [...prev, memberName];

      // Update the participants field with comma-separated values
      setParticipants(newSelection.join(', '));
      return newSelection;
    });
  };



  const handleCreate = async () => {
   console.log('handleCreate called with mode:', mode, 'editingTask:', editingTask);
   if (mode === "assign") {
     if (editingTask) {
       // For updating assigned tasks
       console.log('Updating assigned task:', editingTask);
       const updatedTask = {
         ...editingTask,
         date: assignFormData.date,
         timeline: assignFormData.timeline,
         task_name: assignFormData.taskName,
         parameter: assignFormData.parameter,
         end_goal: assignFormData.endGoal,
         assignee_remarks: assignFormData.assignerRemarks,
         status: assignFormData.status,
         upload_closing: assignFormData.uploadClosing,
         remarks: assignFormData.remarks
       };
       console.log('Calling updateTask with:', updatedTask);
       updateTask(updatedTask);
     } else {
       // For assigning tasks
       const assignData = {
         date: assignFormData.date,
         timeline: assignFormData.timeline,
         taskName: assignFormData.taskName,
         parameter: assignFormData.parameter,
         endGoal: assignFormData.endGoal,
         assignerRemarks: assignFormData.assignerRemarks,
         remarks: assignFormData.remarks,
         assignTo: assignFormData.assignTo,
         status: assignFormData.status,
         uploadClosing: assignFormData.uploadClosing,
       };
       addTask(assignData);
     }
   } else if (editingTask) {
      if (isMeeting) {
        // For editing meetings
        const updatedMeeting = {
          ...editingTask,
          meeting_name: meetingName,
          date: meetingDate,
          dept: dept,
          co_person: participants,
          time: meetingTime,
          prop_slot: timeSlot,
          status: meetingStatus,
          notes: agenda,
          itemType: 'meeting',
        };
        updateTask(updatedMeeting);
      } else {
        // For editing tasks
        if (isRestrictedEdit) {
          const updatedTask = {
            ...editingTask,
            time_in_mins: time,
            status: status,
            file_link: attachments,
            remarks: remarks,
            itemType: 'task',
          };
          updateTask(updatedTask);
        } else {
          const updatedTask = {
            ...editingTask,
            task_name: taskName,
            date: dueDate,
            timeline: timeline,
            time_in_mins: time,
            task_type: taskType,
            status: status,
            file_link: attachments,
            remarks: remarks,
            itemType: 'task',
          };
          updateTask(updatedTask);
        }
      }
    } else {
      if (isMeeting) {
        // For creating meetings
        const meeting = {
          name: meetingName,
          date: meetingDate,
          dept: dept,
          co_person: participants,
          time: meetingTime,
          prop_slot: timeSlot,
          status: meetingStatus,
          notes: agenda,
          task_id: tagWithTask || null,
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
              <div style={mode === "assign" ? { textAlign: 'left' } : {}}>
                <h2 className="modal-title">
                  {mode === "assign" ? (editingTask ? "Update Assigned Task" : "Assign Task") : editingTask ? (isMeeting ? 'Edit Meeting' : 'Edit Task') : (isMeeting ? 'New Meeting' : 'New Task')}
                </h2>
                <p className="modal-subtitle">
                  {mode === "assign" ? (editingTask ? "Modify assigned task details" : "Assign tasks to team members") : editingTask ? (isMeeting ? 'Update meeting details' : 'Modify task details') : (isMeeting ? 'Plan and coordinate team collaboration' : 'Define objectives and assign responsibilities')}
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
                    value={assignFormData.date}
                    onChange={(e) => setAssignFormData({...assignFormData, date: e.target.value})}
                    required
                  />
                </div>

                {/* Timeline */}
                <div className="field-box span-6">
                  <label className="field-label">Timeline (date)</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={assignFormData.timeline}
                    onChange={(e) => setAssignFormData({...assignFormData, timeline: e.target.value})}
                  />
                </div>

                {/* Task Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter task name"
                    value={assignFormData.taskName}
                    onChange={(e) => setAssignFormData({...assignFormData, taskName: e.target.value})}
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
                    value={assignFormData.parameter}
                    onChange={(e) => setAssignFormData({...assignFormData, parameter: e.target.value})}
                  />
                </div>

                {/* End goal */}
                <div className="field-box span-6">
                  <label className="field-label">End goal</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter end goal"
                    value={assignFormData.endGoal}
                    onChange={(e) => setAssignFormData({...assignFormData, endGoal: e.target.value})}
                  />
                </div>

                {/* Assign To */}
                {!isAssignEdit && (
                  <div className="field-box span-6">
                    <label className="field-label required">Assign To</label>
                    <select
                      className="enhanced-select"
                      value={assignFormData.assignTo}
                      onChange={(e) => setAssignFormData({...assignFormData, assignTo: e.target.value})}
                      required
                    >
                      <option value="">Select team member</option>
                      {teamMembers && teamMembers.length > 0 ? teamMembers
                        .filter(member => member.user_id !== 'all') // Exclude "All Team Members" option
                        .map(member => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.name}
                          </option>
                        )) : (
                        <option disabled>No team members available</option>
                      )}
                    </select>
                  </div>
                )}

                {/* Assigner Remarks */}
                <div className="field-box span-12">
                  <label className="field-label">Assigner Remarks</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter assigner remarks"
                    value={assignFormData.assignerRemarks}
                    onChange={(e) => setAssignFormData({...assignFormData, assignerRemarks: e.target.value})}
                  />
                </div>


                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label">Status</label>
                  <select className="enhanced-select" value={assignFormData.status} onChange={(e) => setAssignFormData({...assignFormData, status: e.target.value})}>
                    <option>Not Started</option>
                    <option>In Progress</option>
                    <option>Done</option>
                    <option>Cancelled</option>
                    <option>On Hold</option>
                  </select>
                </div>

                {/* Upload Closing */}
                {(() => {
                  // Disable for new assignments
                  const isDisabled = mode === "assign" && !editingTask;
                  return (
                    <div className={`field-box span-6 ${isDisabled ? 'restricted-field' : ''}`}>
                      <label className="field-label">Upload Closing</label>
                      <input
                        type="text"
                        className="enhanced-input"
                        placeholder="Enter upload closing link"
                        value={assignFormData.uploadClosing}
                        onChange={(e) => setAssignFormData({...assignFormData, uploadClosing: e.target.value})}
                        disabled={isDisabled}
                        title={isDisabled ? "This field is disabled for new assignments" : ""}
                      />
                    </div>
                  );
                })()}

                {/* Remarks */}
                {(() => {
                  // Disable for new assignments
                  const isDisabled = mode === "assign" && !editingTask;
                  return (
                    <div className={`field-box span-12 ${isDisabled ? 'restricted-field' : ''}`}>
                      <label className="field-label">Remarks</label>
                      <textarea
                        className="enhanced-textarea"
                        placeholder="Enter task remarks"
                        value={assignFormData.remarks}
                        onChange={(e) => setAssignFormData({...assignFormData, remarks: e.target.value})}
                        disabled={isDisabled}
                        title={isDisabled ? "This field is disabled for new assignments" : ""}
                      />
                    </div>
                  );
                })()}
              </>
            ) : !isMeeting ? (
              // TASK FORM
              <>
                {/* Task Name */}
                <div className={`field-box span-12 ${isRestrictedEdit ? 'restricted-field' : ''}`}>
                  <label className="field-label required">Task Name</label>
                  <div className="custom-dropdown-container">
                    <input
                      type="text"
                      className="enhanced-input"
                      placeholder="Enter task name"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      onFocus={() => !isRestrictedEdit && setShowSuggestions(true)}
                      onBlur={(e) => {
                        // Don't hide if clicking on dropdown items
                        const relatedTarget = e.relatedTarget;
                        if (relatedTarget && relatedTarget.closest('.custom-suggestions-dropdown')) {
                          return;
                        }
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      disabled={isRestrictedEdit}
                      readOnly={isRestrictedEdit}
                      title={isRestrictedEdit ? "This field is restricted and cannot be edited" : ""}
                      required
                    />
                    {!isRestrictedEdit && showSuggestions && taskSuggestions.length > 0 && (
                      <div
                        className="custom-suggestions-dropdown"
                        onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
                      >
                        {taskSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="suggestion-item"
                            onClick={() => {
                              setTaskName(suggestion.task_name);
                              setTaskType(suggestion.task_type);
                              // Keep date as today, status as default "Not Started"
                              setShowSuggestions(false);
                            }}
                          >
                            <span className="suggestion-text">{suggestion.task_name}</span>
                            <span className="suggestion-status">{suggestion.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Date */}
                <div className={`field-box span-6 ${isRestrictedEdit ? 'restricted-field' : ''}`}>
                  <label className="field-label required">Date</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={getTodayDate()}
                    disabled={isRestrictedEdit}
                    readOnly={isRestrictedEdit}
                    title={isRestrictedEdit ? "This field is restricted and cannot be edited" : ""}
                    required
                  />
                </div>

                {/* Timeline */}
                <div className={`field-box span-6 ${isRestrictedEdit ? 'restricted-field' : ''}`}>
                  <label className="field-label">Timeline</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    placeholder="Select timeline date"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    min={getTodayDate()}
                    disabled={isRestrictedEdit}
                    readOnly={isRestrictedEdit}
                    title={isRestrictedEdit ? "This field is restricted and cannot be edited" : ""}
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
                <div className={`field-box span-6 ${isRestrictedEdit ? 'restricted-field' : ''}`}>
                  <label className="field-label">Task Type</label>
                  <select className="enhanced-select" value={taskType} onChange={(e) => setTaskType(e.target.value)} disabled={isRestrictedEdit} title={isRestrictedEdit ? "This field is restricted and cannot be edited" : ""}>
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
                    min={getTodayDate()}
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

                {/* Tag with Task */}
                <div className="field-box span-6">
                  <label className="field-label">Tag with Task</label>
                  <select className="enhanced-select" value={tagWithTask} onChange={(e) => setTagWithTask(e.target.value)}>
                    <option value="">Select task (optional)</option>
                    {availableTasks.map(task => (
                      <option key={task.task_id} value={task.task_id}>
                        {task.task_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coperson */}
                <div className="field-box span-6">
                  <label className="field-label">Coperson</label>
                  <div className="coperson-dropdown-container">
                    <input
                      type="text"
                      className="enhanced-input coperson-input"
                      placeholder="Select co-persons"
                      value={participants}
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
                        { (isMeeting ? meetingTeamMembers : teamMembers) && (isMeeting ? meetingTeamMembers : teamMembers).length > 0 ? (isMeeting ? meetingTeamMembers : teamMembers).map(member => (
                          <div key={member.user_id} className="dropdown-item">
                            <label className="coperson-checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedCoPersons.includes(member.name)}
                                onChange={() => handleCoPersonToggle(member.name)}
                                className="coperson-checkbox"
                              />
                              <span className="coperson-name">{member.name}</span>
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
                <div className="field-box span-6">
                  <label className="field-label">Notes</label>
                  <input
                    type="text"
                    className="enhanced-input"
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
              {loading ? 'Saving...' : (mode === "assign" ? (editingTask ? 'Update Task' : 'Assign Task') : editingTask ? (isMeeting ? 'Update Meeting' : 'Update Task') : (isMeeting ? 'Create Meeting' : 'Create Task'))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}