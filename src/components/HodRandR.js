import React, { useState, useEffect } from 'react';
import './RandR.css';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';


const HodRnR = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('R&R');
  const [userProfile, setUserProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Data States
  const [rnrData, setRnrData] = useState([]);
  const [fixedTasks, setFixedTasks] = useState([]);
  const [roleOverviewData, setRoleOverviewData] = useState(null);


  // Modal Visibility States
  const [showRnrModal, setShowRnrModal] = useState(false);
  const [showFixedTaskModal, setShowFixedTaskModal] = useState(false);
  const [showRoleOverviewModal, setShowRoleOverviewModal] = useState(false);
  const [editingRoleOverview, setEditingRoleOverview] = useState(false);
  const [editingRnr, setEditingRnr] = useState(null);
  const [editingFixedTask, setEditingFixedTask] = useState(null);

  // Form States
  const [roleOverviewForm, setRoleOverviewForm] = useState({
    name: '', designation: '', subject: '', object: '', goal: '', reportingPerson: ''
  });


  const [rnrForm, setRnrForm] = useState({
    rnr: '', description: '', end_goal: '', timings: '', guideline: '', process_limitations: ''
  });


  const [fixedTaskForm, setFixedTaskForm] = useState({
    taskName: '', frequency: 'Daily', assignTo: '', assignedBy: ''
  });


  // --- Effects & Fetching ---
  useEffect(() => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserProfile(parsed);
      setSelectedUserId(parsed.user_id); // Default to self
      setFixedTaskForm(prev => ({ ...prev, assignTo: parsed.name || 'HOD', assignedBy: parsed.name || 'HOD' }));
      fetchTeamMembers(parsed);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      setRoleOverviewData(null); // Clear previous data
      fetchRnrData(selectedUserId);
      fetchFixedTasks(selectedUserId);
      fetchRoleOverview(selectedUserId);
    }
  }, [selectedUserId]);


  const fetchTeamMembers = async (profile) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/hod/meetings/team-members/${profile.dept}/${profile.user_id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.team_members || []);
      } else {
        console.error('Failed to fetch team members');
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };


  const fetchRnrData = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE_URL}/rnr${userId ? `?user_id=${userId}` : ''}`;
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (response.ok) {
        const result = await response.json();
        setRnrData(result || []);
      }
    } catch (error) { console.error('Error fetching R&R:', error); }
  };


  const fetchFixedTasks = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE_URL}/hod/fixed-tasks${userId ? `?user_id=${userId}` : ''}`;
      const response = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (response.ok) {
        const result = await response.json();
        setFixedTasks(result || []);
      }
    } catch (error) { console.error('Error fetching tasks:', error); }
  };

  const fetchRoleOverview = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/role_overview/${userId}`, { headers: { "Authorization": `Bearer ${token}` } });
      if (response.ok) {
        const result = await response.json();
        setRoleOverviewData(result.role_overview || null);
      } else if (response.status === 404) {
        setRoleOverviewData(null);
      }
    } catch (error) { console.error('Error fetching role overview:', error); }
  };


  // --- Handlers ---
  const handleRoleOverviewSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = selectedUserId;
      if (!userId) return;

      const payload = {
        user_id: userId,
        name: roleOverviewForm.name,
        designation: roleOverviewForm.designation,
        subject: roleOverviewForm.subject,
        object: roleOverviewForm.object,
        goal: roleOverviewForm.goal,
        reporting_person: roleOverviewForm.reportingPerson
      };

      let response;
      if (roleOverviewData) {
        // Update
        response = await fetch(`${API_BASE_URL}/role_overview/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch(`${API_BASE_URL}/role_overview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const result = await response.json();
        setRoleOverviewData(result.role_overview);
        setRoleOverviewForm({
          name: '',
          designation: '',
          subject: '',
          object: '',
          goal: '',
          reportingPerson: ''
        });
        setEditingRoleOverview(false);
        setShowRoleOverviewModal(false);
      } else {
        console.error('Error saving role overview');
      }
    } catch (error) {
      console.error('Error submitting role overview:', error);
    }
  };


  const handleRnrSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = selectedUserId;
      if (!userId) return;

      const payload = {
        user_id: userId,
        rnr: rnrForm.rnr,
        description: rnrForm.description,
        end_goal: rnrForm.end_goal,
        timings: rnrForm.timings,
        guideline: rnrForm.guideline,
        process_limitations: rnrForm.process_limitations
      };

      let response;
      if (editingRnr) {
        // Update
        response = await fetch(`${API_BASE_URL}/rnr/${editingRnr.rnr_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch(`${API_BASE_URL}/rnr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const result = await response.json();
        // Refresh data
        fetchRnrData(userId);
        setRnrForm({
          rnr: '',
          description: '',
          end_goal: '',
          timings: '',
          guideline: '',
          process_limitations: ''
        });
        setEditingRnr(null);
        setShowRnrModal(false);
      } else {
        console.error('Error saving R&R');
      }
    } catch (error) {
      console.error('Error submitting R&R:', error);
    }
  };


  const handleFixedTaskSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = selectedUserId;
      if (!userId) return;

      // Determine target user_id based on Assign To selection
      let targetUserId = userProfile?.user_id; // Default to HOD
      if (fixedTaskForm.assignTo !== (userProfile?.name || 'HOD')) {
        // Find the selected team member's user_id
        const selectedMember = teamMembers.find(member => member.name === fixedTaskForm.assignTo);
        if (selectedMember) {
          targetUserId = selectedMember.user_id;
        }
      }

      const payload = {
        user_id: targetUserId,
        task_name: fixedTaskForm.taskName,
        frequency: fixedTaskForm.frequency,
        assigned_by: fixedTaskForm.assignedBy
      };

      let response;
      if (editingFixedTask) {
        // Update
        response = await fetch(`${API_BASE_URL}/hod/fixed-tasks/${editingFixedTask.fixed_task_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        response = await fetch(`${API_BASE_URL}/hod/fixed-tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const result = await response.json();
        // Refresh data
        fetchFixedTasks(userId);
        setFixedTaskForm({
          taskName: '',
          frequency: 'Daily',
          assignTo: '',
          assignedBy: userProfile?.name || 'HOD'
        });
        setEditingFixedTask(null);
        setShowFixedTaskModal(false);
      } else {
        console.error('Error saving fixed task');
      }
    } catch (error) {
      console.error('Error submitting fixed task:', error);
    }
  };


  return (
    <div className="rnr-container">

      {/* Team Member Filter */}
      <div className="professional-filter-bar" style={{ marginTop: '0', marginBottom: '10px' }}>
        <div className="filter-controls">
          <div className="filter-dropdown">
            <label style={{ fontWeight: '600', color: '#374151', marginRight: '10px' }}>View R&R for:</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                fontSize: '14px'
              }}
            >
              <option value={userProfile?.user_id}>My R&R</option>
              {teamMembers.map(member => (
                <option key={member.user_id} value={member.user_id}>{member.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 1: Role Overview */}
      <div className="section-container first-section" style={{ marginTop: '0' }}>
        <div className="brand-header-green">
          <h3>Role Overview</h3>
          <button className="add-btn-dark" onClick={() => {
            if (roleOverviewData) {
              alert("You already have role filled in");
            } else {
              setShowRoleOverviewModal(true);
            }
          }}>
            + Add Role Overview
          </button>
        </div>
        <div className="table-responsive">
          <table className="brand-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Subject</th>
                <th>Object</th>
                <th>Goal</th>
                <th>Reporting Person</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roleOverviewData ? (
                <tr>
                  <td>{roleOverviewData.name}</td>
                  <td>{roleOverviewData.designation}</td>
                  <td>{roleOverviewData.subject}</td>
                  <td>{roleOverviewData.object}</td>
                  <td>{roleOverviewData.goal}</td>
                  <td>{roleOverviewData.reporting_person}</td>
                  <td><button className="action-link" onClick={() => {
                    setRoleOverviewForm({
                      name: roleOverviewData.name,
                      designation: roleOverviewData.designation,
                      subject: roleOverviewData.subject,
                      object: roleOverviewData.object,
                      goal: roleOverviewData.goal,
                      reportingPerson: roleOverviewData.reporting_person
                    });
                    setEditingRoleOverview(true);
                    setShowRoleOverviewModal(true);
                  }}>Edit</button></td>
                </tr>
              ) : (
                <tr><td colSpan="7" className="no-data">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* SECTION 2: Horizontal Tab Bar (Fixed Task Button Removed from here) */}
      <div className="brand-tab-wrapper">
        {['R&R', 'SOP', 'Leave Policy', 'Reporting Structure', 'Variable Task'].map((tab) => (
          <button
            key={tab}
            className={`brand-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>


      {/* SECTION 3: Dynamic Content Area */}
      <div className="content-area">
        {activeTab === 'R&R' && (
          <div className="table-card">
            <div className="card-inner-header">
              <h4 className="brand-blue-text">Roles and Responsibilities</h4>
              <button className="add-btn-green" onClick={() => setShowRnrModal(true)}>+ Add R&R</button>
            </div>
            <div className="table-responsive">
              <table className="brand-table">
                <thead className="sub-head-gray">
                  <tr>
                    <th>S.No</th>
                    <th>R&R</th>
                    <th>Description</th>
                    <th>End Goal</th>
                    <th>Timings</th>
                    <th>Guideline</th>
                    <th>Process and Limitations</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rnrData.length > 0 ? rnrData.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.rnr}</td>
                      <td>{item.description}</td>
                      <td>{item.end_goal}</td>
                      <td>{item.timings}</td>
                      <td>{item.guideline}</td>
                      <td>{item.process_limitations}</td>
                      <td><button className="action-link" onClick={() => {
                        setRnrForm({
                          rnr: item.rnr,
                          description: item.description,
                          end_goal: item.end_goal,
                          timings: item.timings,
                          guideline: item.guideline,
                          process_limitations: item.process_limitations
                        });
                        setEditingRnr(item);
                        setShowRnrModal(true);
                      }}>Edit</button></td>
                    </tr>
                  )) : <tr><td colSpan="8" className="no-data">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {!['R&R'].includes(activeTab) && (
          <div className="empty-state">
            <p>Content for <strong>{activeTab}</strong> is coming soon.</p>
          </div>
        )}
      </div>


      {/* NEW SECTION 4: Fixed Tasks (Visible only in R&R tab) */}
      {activeTab === 'R&R' && (
        <div className="table-card fixed-tasks-bottom-section">
          <div className="card-inner-header">
            <h4 className="brand-blue-text">Fixed Tasks</h4>
            <button className="add-btn-green" onClick={() => setShowFixedTaskModal(true)}>+ Add Fixed Task</button>
          </div>
          <div className="table-responsive">
            <table className="brand-table">
              <thead className="sub-head-gray">
                <tr>
                  <th>S.No</th>
                  <th>Task Name</th>
                  <th>Frequency</th>
                  <th>Assigned by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fixedTasks.length > 0 ? fixedTasks.map((task, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{task.task_name}</td>
                    <td>{task.frequency}</td>
                    <td>{task.assigned_by}</td>
                    <td><button className="action-link" onClick={() => {
                      setFixedTaskForm({
                        taskName: task.task_name,
                        frequency: task.frequency,
                        assignTo: task.assigned_by,
                        assignedBy: userProfile?.name || 'HOD'
                      });
                      setEditingFixedTask(task);
                      setShowFixedTaskModal(true);
                    }}>Edit</button></td>
                  </tr>
                )) : <tr><td colSpan="5" className="no-data">No data available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* --- MODALS --- */}


      {/* 1. Modal: Add Role Overview */}
      {showRoleOverviewModal && (
        <div className="modal-overlay">
          <div className="enhanced-task-popup">
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">{editingRoleOverview ? 'Edit Role Overview' : 'Add Role Overview'}</h2>
                  <p className="modal-subtitle">Define role details and responsibilities</p>
                </div>
              </div>
            </div>

            {/* Form Content - Professional Layout */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* Name */}
                <div className="field-box span-6">
                  <label className="field-label required">Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter name"
                    value={roleOverviewForm.name}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, name: e.target.value})}
                    required
                  />
                </div>

                {/* Designation */}
                <div className="field-box span-6">
                  <label className="field-label">Designation</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter designation"
                    value={roleOverviewForm.designation}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, designation: e.target.value})}
                  />
                </div>

                {/* Subject */}
                <div className="field-box span-6">
                  <label className="field-label">Subject</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter subject"
                    value={roleOverviewForm.subject}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, subject: e.target.value})}
                  />
                </div>

                {/* Object */}
                <div className="field-box span-6">
                  <label className="field-label">Object</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter object"
                    value={roleOverviewForm.object}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, object: e.target.value})}
                  />
                </div>

                {/* Goal */}
                <div className="field-box span-6">
                  <label className="field-label">Goal</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter goal"
                    value={roleOverviewForm.goal}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, goal: e.target.value})}
                  />
                </div>

                {/* Reporting Person */}
                <div className="field-box span-6">
                  <label className="field-label">Reporting Person</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter reporting person"
                    value={roleOverviewForm.reportingPerson}
                    onChange={(e) => setRoleOverviewForm({...roleOverviewForm, reportingPerson: e.target.value})}
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
                <button className="cancel-btn" onClick={() => setShowRoleOverviewModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleRoleOverviewSubmit}>
                  {editingRoleOverview ? 'Update Overview' : 'Save Overview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 2. Modal: Add R&R */}
      {showRnrModal && (
        <div className="modal-overlay">
          <div className="enhanced-task-popup">
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">{editingRnr ? 'Edit Role and Responsibility' : 'Add Role and Responsibility'}</h2>
                  <p className="modal-subtitle">Define roles and responsibilities</p>
                </div>
              </div>
            </div>

            {/* Form Content - Professional Layout */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* R&R Title */}
                <div className="field-box span-6">
                  <label className="field-label required">R&R Title</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter title"
                    value={rnrForm.rnr}
                    onChange={(e) => setRnrForm({...rnrForm, rnr: e.target.value})}
                    required
                  />
                </div>

                {/* End Goal */}
                <div className="field-box span-6">
                  <label className="field-label">End Goal</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter end goal"
                    value={rnrForm.end_goal}
                    onChange={(e) => setRnrForm({...rnrForm, end_goal: e.target.value})}
                  />
                </div>

                {/* Description */}
                <div className="field-box span-12">
                  <label className="field-label">Description</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter description"
                    value={rnrForm.description}
                    onChange={(e) => setRnrForm({...rnrForm, description: e.target.value})}
                  />
                </div>

                {/* Timings */}
                <div className="field-box span-6">
                  <label className="field-label">Timings</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="e.g. 9 AM - 6 PM"
                    value={rnrForm.timings}
                    onChange={(e) => setRnrForm({...rnrForm, timings: e.target.value})}
                  />
                </div>

                {/* Guideline */}
                <div className="field-box span-6">
                  <label className="field-label">Guideline</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter guideline"
                    value={rnrForm.guideline}
                    onChange={(e) => setRnrForm({...rnrForm, guideline: e.target.value})}
                  />
                </div>

                {/* Process and Limitations */}
                <div className="field-box span-12">
                  <label className="field-label">Process and Limitations</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter process and limitations"
                    value={rnrForm.process_limitations}
                    onChange={(e) => setRnrForm({...rnrForm, process_limitations: e.target.value})}
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
                <button className="cancel-btn" onClick={() => setShowRnrModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleRnrSubmit}>
                  {editingRnr ? 'Update R&R' : 'Add R&R'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 3. Modal: Add Fixed Task */}
      {showFixedTaskModal && (
        <div className="modal-overlay">
          <div className="enhanced-task-popup">
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">{editingFixedTask ? 'Edit Fixed Task' : 'Add Fixed Task'}</h2>
                  <p className="modal-subtitle">Define recurring tasks</p>
                </div>
              </div>
            </div>

            {/* Form Content - Professional Layout */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* Task Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="e.g. Fill WPR"
                    value={fixedTaskForm.taskName}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, taskName: e.target.value})}
                    required
                  />
                </div>

                {/* Frequency */}
                <div className="field-box span-6">
                  <label className="field-label">Frequency</label>
                  <select
                    className="enhanced-select"
                    value={fixedTaskForm.frequency}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, frequency: e.target.value})}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                {/* Assign To */}
                <div className="field-box span-6">
                  <label className="field-label">Assign To</label>
                  <select
                    className="enhanced-select"
                    value={fixedTaskForm.assignTo}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, assignTo: e.target.value})}
                  >
                    <option value={userProfile?.name || 'HOD'}>Assign to Me</option>
                    {teamMembers.map(member => (
                      <option key={member.user_id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assigned By */}
                <div className="field-box span-6">
                  <label className="field-label">Assigned By</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Name"
                    value={fixedTaskForm.assignedBy}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, assignedBy: e.target.value})}
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
                <button className="cancel-btn" onClick={() => setShowFixedTaskModal(false)}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleFixedTaskSubmit}>
                  {editingFixedTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default HodRnR;