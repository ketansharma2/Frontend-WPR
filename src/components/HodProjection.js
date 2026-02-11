import React, { useState, useEffect } from 'react';
import './HodProjection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const HodProjection = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUser, setSelectedUser] = useState('self');
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProject, setNewProject] = useState({
    project_name: '',
    month: '',
    deadline: '',
    assigned_to: '',
    remarks: '',
    lock_subtasks: false
  });
  const [userProfile, setUserProfile] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [subtaskForm, setSubtaskForm] = useState({
    task_name: '',
    deadline: '',
    status: ''
  });

  // Get user profile from localStorage
  useEffect(() => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserProfile(parsed);
      fetchTeamMembers(parsed);
    }
  }, []);

  // Fetch team members from API
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

  // Fetch projections from backend API
  const fetchProjections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // Convert YYYY-MM to YYYY-MM-01 for DATE format
      const monthParam = `${selectedMonth}-01`;
      const response = await fetch(`${API_BASE_URL}/hod/monthly-projection?month=${monthParam}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly
        setProjections(data || []);
      } else {
        console.error('Error fetching projections');
        setProjections([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setProjections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjections();
  }, [selectedMonth, selectedUser]);

  // Get current month display name
  const getMonthDisplayName = (monthStr) => {
    if (!monthStr) return '--';
    // Handle DATE format (YYYY-MM-DD) from database
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open Add Project modal
  const openAddModal = () => {
    setIsEditing(false);
    setEditingProject(null);
    setNewProject({
      project_name: '',
      month: selectedMonth, // YYYY-MM format for input
      deadline: '',
      assigned_to: '', // Default to empty (user must select)
      remarks: '',
      lock_subtasks: false
    });
    setShowModal(true);
  };

  // Open Edit Project modal
  const handleEditProject = (project) => {
    setIsEditing(true);
    setEditingProject(project);
    setNewProject({
      project_name: project.project_name,
      month: project.month ? project.month.substring(0, 7) : '', // Convert YYYY-MM-DD to YYYY-MM for input
      deadline: project.deadline || '',
      assigned_to: project.assigned_to || '',
      remarks: project.remarks || '',
      lock_subtasks: project.is_locked || false
    });
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));
      
      // Convert month from YYYY-MM to YYYY-MM-01 for database DATE format
      const monthForDB = `${newProject.month}-01`;
      
      if (isEditing && editingProject) {
        // Update existing project
        const response = await fetch(`${API_BASE_URL}/hod/monthly-projection/${editingProject.project_id}`, {
          method: 'PUT',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_name: newProject.project_name,
            month: monthForDB,
            deadline: newProject.deadline,
            assigned_to: newProject.assigned_to,
            remarks: newProject.remarks,
            lock_subtasks: newProject.lock_subtasks
          })
        });

        if (response.ok) {
          console.log('Project updated successfully');
          alert('Project updated successfully!');
        } else {
          throw new Error('Failed to update project');
        }
      } else {
        // Add new project
        const response = await fetch(`${API_BASE_URL}/hod/monthly-projection`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            project_name: newProject.project_name,
            month: monthForDB,
            deadline: newProject.deadline,
            assigned_to: newProject.assigned_to,
            remarks: newProject.remarks,
            lock_subtasks: newProject.lock_subtasks,
            assigned_by: profile?.user_id
          })
        });

        if (response.ok) {
          console.log('Project added successfully');
          alert('Project added successfully!');
        } else {
          throw new Error('Failed to add project');
        }
      }

      setShowModal(false);
      fetchProjections();
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project: ' + error.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewProject({
      project_name: '',
      month: '',
      deadline: '',
      assigned_to: '',
      remarks: '',
      lock_subtasks: false
    });
    setIsEditing(false);
    setEditingProject(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowModal(false);
    resetForm();
  };

  // Open Add Subtask modal
  const openSubtaskModal = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedSubtaskId(null);
    setIsEditMode(false);
    setSubtaskForm({
      task_name: '',
      deadline: '',
      status: ''
    });
    setShowSubtaskModal(true);
  };

  // Open Edit Subtask modal
  const openEditSubtaskModal = (projectId, subtask) => {
    setSelectedProjectId(projectId);
    setSelectedSubtaskId(subtask.subtask_id);
    setIsEditMode(true);
    setSubtaskForm({
      task_name: subtask.task_name,
      deadline: subtask.deadline || '',
      status: subtask.status || 'Not Started'
    });
    setShowSubtaskModal(true);
  };

  // Handle subtask form input changes
  const handleSubtaskInputChange = (e) => {
    const { name, value } = e.target;
    setSubtaskForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle subtask form submit
  const handleSubtaskSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      
      if (isEditMode && selectedSubtaskId) {
        // Update existing subtask
        const response = await fetch(`${API_BASE_URL}/hod/monthly-projection/${selectedProjectId}/subtasks/${selectedSubtaskId}`, {
          method: 'PUT',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            task_name: subtaskForm.task_name,
            deadline: subtaskForm.deadline,
            status: subtaskForm.status
          })
        });

        if (response.ok) {
          console.log('Subtask updated successfully');
          alert('Subtask updated successfully!');
        } else {
          throw new Error('Failed to update subtask');
        }
      } else {
        // Add new subtask
        const response = await fetch(`${API_BASE_URL}/hod/monthly-projection/${selectedProjectId}/subtasks`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            task_name: subtaskForm.task_name,
            deadline: subtaskForm.deadline,
            status: subtaskForm.status
          })
        });

        if (response.ok) {
          console.log('Subtask added successfully');
          alert('Subtask added successfully!');
        } else {
          throw new Error('Failed to add subtask');
        }
      }

      setShowSubtaskModal(false);
      fetchProjections();
      resetSubtaskForm();
    } catch (error) {
      console.error('Error saving subtask:', error);
      alert('Error saving subtask: ' + error.message);
    }
  };

  // Reset subtask form
  const resetSubtaskForm = () => {
    setSubtaskForm({
      task_name: '',
      deadline: '',
      status: ''
    });
    setIsEditMode(false);
    setSelectedProjectId(null);
    setSelectedSubtaskId(null);
  };

  // Handle subtask modal cancel
  const handleSubtaskCancel = () => {
    setShowSubtaskModal(false);
    resetSubtaskForm();
  };

  // Filter projections based on selected user
  const filteredProjections = projections.filter(p => {
    if (selectedUser === 'self') {
      return p.assigned_to === userProfile?.user_id;
    }
    return p.assigned_to === selectedUser;
  });

  return (
    <div className="hod-projection-container">
      {/* Header Strip */}
      <div className="hod-projection-header">
        <div className="header-left">
          <h2 className="hod-projection-title">
            Monthly Projection - {getMonthDisplayName(selectedMonth)}
          </h2>
        </div>
        <div className="header-right">
          {/* Team Member Filter */}
          <select
            className="month-select"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="self">My Projection</option>
            {teamMembers.map(member => (
              <option key={member.user_id} value={member.user_id}>{member.name}</option>
            ))}
          </select>

          {/* Month Selector */}
          <input
            type="month"
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          {/* Add Project Button */}
          <button 
            className="add-project-btn"
            onClick={openAddModal}
          >
            + Add Project
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading projections...
          </div>
        ) : filteredProjections.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No projections found for the selected filters
          </div>
        ) : (
          <table className="hod-projection-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Subtasks</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjections.map((project, index) => {
                const subtasks = project.subtasks || [];
                const subtaskCount = subtasks.length > 0 ? subtasks.length : 1;
                const isSelfProjection = selectedUser === 'self';
                const isLocked = project.is_locked === true;
                
                return (
                  <React.Fragment key={project.project_id}>
                    {subtasks.length > 0 ? (
                      subtasks.map((subtask, subtaskIndex) => (
                        <tr key={`${project.project_id}-${subtask.subtask_id}`}>
                          {subtaskIndex === 0 && (
                            <td rowSpan={subtaskCount} className="project-cell">
                              <div className="project-info">
                                <div className="project-header">
                                  <div className="project-name">{project.project_name}</div>
                                  <div className="project-actions">
                                    <button 
                                      className="action-btn edit-btn"
                                      onClick={() => handleEditProject(project)}
                                    >
                                      Edit Project
                                    </button>
                                    {isSelfProjection && (
                                      <button 
                                        className="action-btn add-subtask-btn"
                                        onClick={() => {
                                          if (isLocked) {
                                            alert('This project is locked. You cannot add subtasks.');
                                          } else {
                                            openSubtaskModal(project.project_id);
                                          }
                                        }}
                                      >
                                        + Add Subtask
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="project-meta-container">
                                  <div className="project-meta">
                                    <span className="meta-label">Deadline:</span>
                                    <span className="meta-value">{formatDate(project.deadline)}</span>
                                  </div>
                                  <div className="project-meta">
                                    <span className="meta-label">Assigned By:</span>
                                    <span className="meta-value">{project.assigned_by_name || '--'}</span>
                                  </div>
                                  {project.remarks && (
                                    <div className="project-meta">
                                      <span className="meta-label">Remarks:</span>
                                      <span className="meta-value">{project.remarks}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="subtask-cell">
                            <div className="subtask-info">
                              <div className="subtask-name">{subtask.task_name}</div>
                             
                            </div>
                          </td>
                          <td className="deadline-cell">
                            {formatDate(subtask.deadline)}
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge status-${subtask.status?.toLowerCase() || 'pending'}`}>
                              {subtask.status || 'Pending'}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => {
                                if (isLocked) {
                                  alert('This project is locked. You cannot edit subtasks.');
                                } else {
                                  openEditSubtaskModal(project.project_id, subtask);
                                }
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={project.project_id}>
                        <td className="project-cell">
                          <div className="project-info">
                            <div className="project-header">
                              <div className="project-name">{project.project_name}</div>
                              <div className="project-actions">
                                <button 
                                  className="action-btn edit-btn"
                                  onClick={() => handleEditProject(project)}
                                >
                                  Edit Project
                                </button>
                                {isSelfProjection && (
                                  <button 
                                    className="action-btn add-subtask-btn"
                                    onClick={() => {
                                      if (isLocked) {
                                        alert('This project is locked. You cannot add subtasks.');
                                      } else {
                                        openSubtaskModal(project.project_id);
                                      }
                                    }}
                                  >
                                    + Add Subtask
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="project-meta-container">
                              <div className="project-meta">
                                <span className="meta-label">Deadline:</span>
                                <span className="meta-value">{formatDate(project.deadline)}</span>
                              </div>
                              <div className="project-meta">
                                <span className="meta-label">Assigned By:</span>
                                <span className="meta-value">{project.assigned_by_name || '--'}</span>
                              </div>
                              {project.remarks && (
                                <div className="project-meta">
                                  <span className="meta-label">Remarks:</span>
                                  <span className="meta-value">{project.remarks}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="subtask-cell">
                          <div className="no-subtasks">No subtasks</div>
                        </td>
                        <td className="deadline-cell">
                          {formatDate(project.deadline)}
                        </td>
                        <td className="status-cell">
                          <span className="status-badge status-pending">Pending</span>
                        </td>
                        <td className="action-cell">
                          {/* No action when there are no subtasks */}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Project' : 'Add New Project'}</h3>
              <button className="close-btn" onClick={handleCancel}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Row 1: Month + Project Name */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="month">Month</label>
                  <input
                    type="month"
                    id="month"
                    name="month"
                    value={newProject.month}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="project_name">Project Name</label>
                  <input
                    type="text"
                    id="project_name"
                    name="project_name"
                    value={newProject.project_name}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Deadline + Assign To */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={newProject.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="assigned_to">Assign To</label>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={newProject.assigned_to}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select team member</option>
                    <option value={userProfile?.user_id}>Self</option>
                    {teamMembers.map(member => (
                      <option key={member.user_id} value={member.user_id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={newProject.remarks || ''}
                  onChange={handleInputChange}
                  placeholder="Enter any additional notes"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Lock Subtasks */}
              <div className="form-group">
                <label htmlFor="lock_subtasks">Lock (Edit/Add Subtask)</label>
                <select
                  id="lock_subtasks"
                  name="lock_subtasks"
                  value={newProject.lock_subtasks ? 'true' : 'false'}
                  onChange={(e) => setNewProject(prev => ({ ...prev, lock_subtasks: e.target.value === 'true' }))}
                >
                  <option value="false">NO</option>
                  <option value="true">YES</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditing ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Subtask Modal */}
      {showSubtaskModal && (
        <div className="modal-overlay" onClick={handleSubtaskCancel}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{isEditMode ? 'Edit Subtask' : 'Add New Subtask'}</h3>
              <button className="close-btn" onClick={handleSubtaskCancel}>&times;</button>
            </div>
            <form onSubmit={handleSubtaskSubmit}>
              {/* Row 1: Task Name + Deadline */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task_name">Task Name</label>
                  <input
                    type="text"
                    id="task_name"
                    name="task_name"
                    value={subtaskForm.task_name}
                    onChange={handleSubtaskInputChange}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={subtaskForm.deadline}
                    onChange={handleSubtaskInputChange}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={subtaskForm.status || ''}
                  onChange={handleSubtaskInputChange}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Done">Done</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleSubtaskCancel}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditMode ? 'Update Subtask' : 'Add Subtask'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodProjection;
