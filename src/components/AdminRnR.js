import React, { useState, useEffect } from 'react';
import './Home.css'; // Reuse Home.css for styling

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AdminRnR = () => {
  // Data will be loaded from API
  const [rnrData, setRnrData] = useState([]);
  const [fixedTasks, setFixedTasks] = useState([]);

  // User profile and all users
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // R&R filter state
  const [selectedRnrUser, setSelectedRnrUser] = useState('');
  const [showRnrUserDropdown, setShowRnrUserDropdown] = useState(false);

  // Modal states
  const [showRnrModal, setShowRnrModal] = useState(false);
  const [showFixedTaskModal, setShowFixedTaskModal] = useState(false);

  // Edit states
  const [editingRnr, setEditingRnr] = useState(null);
  const [editingFixedTask, setEditingFixedTask] = useState(null);

  // R&R form state
  const [rnrForm, setRnrForm] = useState({
    rnr: '',
    description: '',
    end_goal: '',
    timings: '',
    guideline: '',
    process_limitations: ''
  });

  // Fixed Task form state
  const [fixedTaskForm, setFixedTaskForm] = useState({
    taskName: '',
    frequency: 'Daily',
    assignedBy: '',
    assignTo: selectedRnrUser || ''
  });

  // Fetch R&R data from API
  const fetchRnrData = async (userId = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let url = `${API_BASE_URL}/admin/rnr`;
      if (userId && userId !== 'all') {
        url += `?user_id=${userId}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRnrData(result || []);
      }
    } catch (error) {
      console.error('Error fetching R&R data:', error);
    }
  };

  // Fetch fixed tasks from API
  const fetchFixedTasks = async (userId = null) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      let url = `${API_BASE_URL}/hod/fixed-tasks`;
      if (userId && userId !== 'all') {
        url += `?user_id=${userId}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        setFixedTasks(result || []);
      }
    } catch (error) {
      console.error('Error fetching fixed tasks:', error);
    }
  };

  // Fetch all users for the dropdown
   const fetchAllUsers = async () => {
     try {
       const token = localStorage.getItem("token");

       if (!token) {
         console.error("Authentication required");
         return;
       }

       const response = await fetch(`${API_BASE_URL}/sub-admin/users`, {
         headers: {
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json"
         }
       });

       if (response.ok) {
         const data = await response.json();
         setAllUsers(data.users || []);
       } else {
         console.error('Failed to fetch users');
       }
     } catch (err) {
       console.error("Error fetching users:", err);
     }
   };

  // Handle edit R&R
  const handleEditRnr = (rnrItem) => {
    setEditingRnr(rnrItem);
    setRnrForm({
      rnr: rnrItem.rnr,
      description: rnrItem.description,
      end_goal: rnrItem.end_goal,
      timings: rnrItem.timings,
      guideline: rnrItem.guideline,
      process_limitations: rnrItem.process_limitations
    });
    setShowRnrModal(true);
  };

  // Handle edit Fixed Task
  const handleEditFixedTask = (taskItem) => {
    setEditingFixedTask(taskItem);
    setFixedTaskForm({
      taskName: taskItem.task_name,
      frequency: taskItem.frequency,
      assignedBy: taskItem.assigned_by || '',
      assignTo: taskItem.user_id || ''
    });
    setShowFixedTaskModal(true);
  };

  const handleRnrSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication failed: No token found");
        return;
      }

      const isEditing = !!editingRnr;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_BASE_URL}/rnr/${editingRnr.rnr_id}` : `${API_BASE_URL}/rnr`;

      const requestData = {
        rnr: rnrForm.rnr,
        description: rnrForm.description,
        end_goal: rnrForm.end_goal,
        timings: rnrForm.timings,
        guideline: rnrForm.guideline,
        process_limitations: rnrForm.process_limitations
      };

      // For editing, use the existing R&R's user_id; for creating, use the selected user or admin's
      if (editingRnr) {
        requestData.user_id = editingRnr.user_id;
      } else {
        requestData.user_id = selectedRnrUser !== 'all' ? selectedRnrUser : userProfile?.user_id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('R&R saved:', result);
        // Refresh the R&R list
        fetchRnrData(selectedRnrUser || userProfile?.user_id);
        alert(`✅ Success: R&R ${isEditing ? 'updated' : 'created'} successfully!`);
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error submitting R&R:', error);
      alert('❌ Failed: Network error while saving R&R');
    }

    setShowRnrModal(false);
    setEditingRnr(null);
    setRnrForm({
      rnr: '',
      description: '',
      end_goal: '',
      timings: '',
      guideline: '',
      process_limitations: ''
    });
  };

  const closeRnrModal = () => {
    setShowRnrModal(false);
    setEditingRnr(null);
    setRnrForm({
      rnr: '',
      description: '',
      end_goal: '',
      timings: '',
      guideline: '',
      process_limitations: ''
    });
  };

  const closeFixedTaskModal = () => {
    setShowFixedTaskModal(false);
    setEditingFixedTask(null);
    setFixedTaskForm({
      taskName: '',
      frequency: 'Daily',
      assignedBy: '',
      assignTo: selectedRnrUser === 'all' ? '' : selectedRnrUser || ''
    });
  };

  const handleFixedTaskSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication failed: No token found");
        return;
      }

      const isEditing = !!editingFixedTask;
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_BASE_URL}/hod/fixed-tasks/${editingFixedTask.fixed_task_id}` : `${API_BASE_URL}/hod/fixed-tasks`;

      const requestData = {
        task_name: fixedTaskForm.taskName,
        frequency: fixedTaskForm.frequency,
        assigned_by: fixedTaskForm.assignedBy || null,
        user_id: fixedTaskForm.assignTo || userProfile?.user_id
      };

      console.log('Sending fixed task data:', requestData);
      console.log('Selected assignTo:', fixedTaskForm.assignTo);
      console.log('Admin user_id:', userProfile?.user_id);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Fixed task saved:', result);
        // Refresh the fixed tasks list
        fetchFixedTasks(selectedRnrUser || userProfile?.user_id);
        alert(`✅ Success: Fixed task ${isEditing ? 'updated' : 'created'} successfully!`);
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error submitting fixed task:', error);
      alert('❌ Failed: Network error while saving fixed task');
    }

    setShowFixedTaskModal(false);
    setEditingFixedTask(null);
    setFixedTaskForm({
      taskName: '',
      frequency: 'Daily',
      assignedBy: '',
      assignTo: selectedRnrUser === 'all' ? '' : selectedRnrUser || ''
    });
  };

  // Fetch user profile and all users on component mount
  useEffect(() => {
    // Get user profile from localStorage
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        setUserProfile(parsed);
        fetchRnrData();
        fetchFixedTasks();
        fetchAllUsers();
      } catch (error) {
        console.error("Error parsing user profile:", error);
      }
    }
  }, []);

  // Set default selected user to empty when profile loads
  useEffect(() => {
    if (userProfile && selectedRnrUser === null) {
      setSelectedRnrUser('');
    }
  }, [userProfile, selectedRnrUser]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowRnrUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Refetch R&R and fixed tasks data when user filter changes
  useEffect(() => {
    if (userProfile) {
      fetchRnrData(selectedRnrUser || null);
      fetchFixedTasks(selectedRnrUser || null);
    }
  }, [selectedRnrUser, userProfile]);

  // Update fixed task form assignTo when selectedRnrUser changes
  useEffect(() => {
    setFixedTaskForm(prev => ({ ...prev, assignTo: selectedRnrUser === 'all' ? '' : selectedRnrUser || '' }));
  }, [selectedRnrUser]);

  return (
    <div className="dashboard-container">
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        textAlign: 'center',
        marginTop: '20px'
      }}>
        <h1 style={{ fontSize: '24px' }}>Admin - Roles and Responsibilities</h1>
      </div>

      {/* R&R Filter Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginTop: '15px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* User Filter */}
          <div className="filter-dropdown" style={{ position: 'relative' }}>
            <button
              className={`filter-btn ${selectedRnrUser ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowRnrUserDropdown(!showRnrUserDropdown);
              }}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {allUsers?.find(u => u.user_id === selectedRnrUser)?.name || 'Select User'}
              <span>▼</span>
            </button>
            {showRnrUserDropdown && (
              <div className="dropdown-menu" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '200px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {/* Individual Users */}
                {allUsers && allUsers.length > 0 ? allUsers.map(user => (
                  <div
                    key={user.user_id}
                    className="dropdown-item"
                    onClick={() => { setSelectedRnrUser(user.user_id); setShowRnrUserDropdown(false); }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: allUsers.indexOf(user) < allUsers.length - 1 ? '1px solid #f3f4f6' : 'none',
                      fontSize: '14px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    {user.name}
                  </div>
                )) : (
                  <div
                    className="dropdown-item disabled"
                    style={{
                      padding: '8px 12px',
                      color: '#9ca3af',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                  >
                    No users available
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflow: 'hidden',
        marginTop: '20px'
      }}>
        <div style={{
          background: '#166534',
          borderRadius: '12px 12px 0 0',
          padding: '12px 20px',
          margin: '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white'
          }}>
            R&R
          </h3>
        </div>

        <div style={{
          padding: '0',
          margin: '0',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0',
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{
                background: '#9dcfb0',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '60px',
                  minWidth: '60px'
                }}>S.No</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '15%',
                  minWidth: '120px'
                }}>R&R</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '20%',
                  minWidth: '150px'
                }}>Description</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '15%',
                  minWidth: '120px'
                }}>End Goal</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '10%',
                  minWidth: '100px'
                }}>Timings</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '15%',
                  minWidth: '120px'
                }}>Guideline</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  width: '20%',
                  minWidth: '150px'
                }}>Process and Limitations</th>
              </tr>
            </thead>
            <tbody>
              {rnrData.length > 0 ? (
                rnrData.map((item, index) => (
                  <tr key={item.id || index} style={{
                    backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'left' }}>{item.rnr}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>{item.description}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>{item.end_goal}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>{item.timings}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>{item.guideline}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>{item.process_limitations}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No R&R data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflow: 'hidden',
        marginTop: '20px'
      }}>
        <div style={{
          background: '#5580ff',
          borderRadius: '12px 12px 0 0',
          padding: '12px 20px',
          margin: '0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'white'
          }}>
            Fixed Tasks
          </h3>
        </div>

        <div style={{
          padding: '0',
          margin: '0'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0'
          }}>
            <thead>
              <tr style={{
                background: '#9fc5e8',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '60px'
                }}>S.No</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '30%'
                }}>Task Name</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  borderRight: '1px solid #e5e7eb',
                  width: '15%'
                }}>Frequency</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'black',
                  width: '20%'
                }}>Assigned by</th>
              </tr>
            </thead>
            <tbody>
              {fixedTasks.length > 0 ? (
                fixedTasks.map((task, index) => (
                  <tr key={task.fixed_task_id || index} style={{
                    backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'left' }}>{task.task_name}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center' }}>{task.frequency}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center' }}>{task.assigned_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No fixed tasks assigned
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* R&R Modal */}
      {showRnrModal && (
        <div className="modal-overlay" onClick={closeRnrModal}>
          <div className="enhanced-task-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2 className="modal-title">{editingRnr ? 'Edit R&R' : 'Add R&R'}</h2>
            </div>
            <div className="popup-content">
              <div className="form-grid-container">
                <div className="field-box span-12">
                  <label className="field-label required">R&R</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter R&R title"
                    value={rnrForm.rnr}
                    onChange={(e) => setRnrForm({...rnrForm, rnr: e.target.value})}
                    required
                  />
                </div>
                <div className="field-box span-12">
                  <label className="field-label">Description</label>
                  <textarea
                    className="enhanced-textarea"
                    placeholder="Enter description"
                    value={rnrForm.description}
                    onChange={(e) => setRnrForm({...rnrForm, description: e.target.value})}
                  />
                </div>
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
                <div className="field-box span-6">
                  <label className="field-label">Timings</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter timings"
                    value={rnrForm.timings}
                    onChange={(e) => setRnrForm({...rnrForm, timings: e.target.value})}
                  />
                </div>
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
                <div className="field-box span-6">
                  <label className="field-label">Process and Limitations</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter process and limitations"
                    value={rnrForm.process_limitations}
                    onChange={(e) => setRnrForm({...rnrForm, process_limitations: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="popup-footer">
              <div className="footer-tips">
                <span>💡</span>
                <span>Fields marked with * are required</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-btn" onClick={closeRnrModal}>
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

      {/* Fixed Task Modal */}
      {showFixedTaskModal && (
        <div className="modal-overlay" onClick={closeFixedTaskModal}>
          <div className="enhanced-task-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2 className="modal-title">{editingFixedTask ? 'Edit Fixed Task' : 'Add Fixed Task'}</h2>
            </div>
            <div className="popup-content">
              <div className="form-grid-container">
                <div className="field-box span-4">
                  <label className="field-label required">Task Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter task name"
                    value={fixedTaskForm.taskName}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, taskName: e.target.value})}
                    required
                  />
                </div>
                <div className="field-box span-2">
                  <label className="field-label required">Frequency</label>
                  <select
                    className="enhanced-select"
                    value={fixedTaskForm.frequency}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, frequency: e.target.value})}
                    required
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="field-box span-3">
                  <label className="field-label">Assigned by</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter assigner name"
                    value={fixedTaskForm.assignedBy}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, assignedBy: e.target.value})}
                  />
                </div>
                <div className="field-box span-3">
                  <label className="field-label">Assign to</label>
                  <select
                    className="enhanced-select"
                    value={fixedTaskForm.assignTo}
                    onChange={(e) => setFixedTaskForm({...fixedTaskForm, assignTo: e.target.value})}
                  >
                    <option value="">Select User</option>
                    {allUsers.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="popup-footer">
              <div className="footer-tips">
                <span>💡</span>
                <span>Fields marked with * are required</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="cancel-btn" onClick={closeFixedTaskModal}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleFixedTaskSubmit}>
                  {editingFixedTask ? 'Update Fixed Task' : 'Add Fixed Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRnR;