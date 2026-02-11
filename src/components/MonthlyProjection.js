import React, { useState, useEffect } from 'react';
import './MonthlyProjection.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const MonthlyProjection = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [projections, setProjections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    task_name: '',
    status: 'Not Started',
    deadline: ''
  });

  useEffect(() => {
    fetchProjections();
  }, [selectedMonth]);

  const fetchProjections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const monthParam = `${selectedMonth}-01`;

      const response = await fetch(
        `${API_BASE_URL}/projection?month=${monthParam}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjections(data || []);
      } else {
        setProjections([]);
      }
    } catch (error) {
      console.error(error);
      setProjections([]);
    } finally {
      setLoading(false);
    }
  };

  const openSubtaskModal = (projectId) => {
    setSelectedProjectId(projectId);
    setSelectedSubtaskId(null);
    setIsEditMode(false);
    setNewSubtask({
      task_name: '',
      status: 'Not Started',
      deadline: ''
    });
    setShowSubtaskModal(true);
  };

  const openEditSubtaskModal = (projectId, subtaskId) => {
    const project = projections.find(p => p.project_id === projectId);
    const subtasks = project?.project_subtasks || [];
    const subtask = subtasks.find(s => s.subtask_id === subtaskId || s.id === subtaskId);
    
    if (subtask) {
      setSelectedProjectId(projectId);
      setSelectedSubtaskId(subtaskId);
      setIsEditMode(true);
      setNewSubtask({
        task_name: subtask.task_name || subtask.name || '',
        status: subtask.status || 'Not Started',
        deadline: subtask.deadline || ''
      });
      setShowSubtaskModal(true);
    }
  };

  const closeSubtaskModal = () => {
    setShowSubtaskModal(false);
    setSelectedProjectId(null);
    setSelectedSubtaskId(null);
    setIsEditMode(false);
  };

  const handleSubtaskChange = (e) => {
    const { name, value } = e.target;
    setNewSubtask((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (isEditMode && selectedSubtaskId) {
        // Update existing subtask
        const response = await fetch(
          `${API_BASE_URL}/projection/${selectedProjectId}/subtasks/${selectedSubtaskId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              task_name: newSubtask.task_name,
              status: newSubtask.status,
              deadline: newSubtask.deadline || null
            })
          }
        );

        if (response.ok) {
          closeSubtaskModal();
          fetchProjections();
          alert("Subtask updated successfully!");
        } else {
          throw new Error('Failed to update subtask');
        }
      } else {
        // Create new subtask
        const response = await fetch(
          `${API_BASE_URL}/projection/${selectedProjectId}/subtasks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              task_name: newSubtask.task_name,
              status: newSubtask.status,
              deadline: newSubtask.deadline || null
            })
          }
        );

        if (response.ok) {
          closeSubtaskModal();
          fetchProjections();
          alert("Subtask added successfully!");
        } else {
          throw new Error('Failed to create subtask');
        }
      }
    } catch (error) {
      alert(`Error ${isEditMode ? 'updating' : 'creating'} subtask`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short"
    });
  };

  return (
    <div className="monthly-projection-container">
      <div className="projection-card">
        <div className="projection-header">
          <h2 className="projection-title">
            Monthly Projection - {selectedMonth}
          </h2>
          <input
            type="month"
            className="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              Loading projections...
            </div>
          ) : (
            <table className="projection-table">
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
                {projections.map((project) => {
                  const subtasks = project.project_subtasks || [];

                  if (subtasks.length === 0) {
                    return (
                      <tr key={project.project_id}>
                        <td>
                          <div className="project-info">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <strong className="project-name">{project.project_name}</strong>
                              <button
                                className="add-subtask-btn-inline"
                                onClick={() => {
                                  if (project.is_locked) {
                                    alert('Permission not given by HOD to add subtasks for this project.');
                                  } else {
                                    openSubtaskModal(project.project_id);
                                  }
                                }}
                                title={project.is_locked ? 'Permission not given by HOD' : 'Add Subtask'}
                              >
                                +
                              </button>
                            </div>
                            <div className="project-meta">
                              <div>Deadline: {formatDate(project.deadline)}</div>
                              <div>Assigned By: {project.assigned_by_name || project.assigned_by || '--'}</div>
                              <div>Remarks: {project.remarks || '--'}</div>
                            </div>
                          </div>
                        </td>
                        <td colSpan="4" style={{ color: '#9ca3af', fontStyle: 'italic', padding: '12px 16px' }}>No subtasks</td>
                      </tr>
                    );
                  }

                  return subtasks.map((subtask, index) => (
                    <tr key={subtask.id || index} className="subtask-row">
                      {index === 0 && (
                        <td rowSpan={subtasks.length}>
                          <div className="project-info">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <strong className="project-name">{project.project_name}</strong>
                              <button
                                className="add-subtask-btn-inline"
                                onClick={() => {
                                  if (project.is_locked) {
                                    alert('Permission not given by HOD to add subtasks for this project.');
                                  } else {
                                    openSubtaskModal(project.project_id);
                                  }
                                }}
                                title={project.is_locked ? 'Permission not given by HOD' : 'Add Subtask'}
                              >
                                +
                              </button>
                            </div>
                            <div className="project-meta">
                              <div>Deadline: {formatDate(project.deadline)}</div>
                              <div>Assigned By: {project.assigned_by_name || project.assigned_by || '--'}</div>
                              <div>Remarks: {project.remarks || '--'}</div>
                            </div>
                          </div>
                        </td>
                      )}

                      <td>
                        <div className="subtask-info">
                          <span className="subtask-name">{subtask.task_name || subtask.name || subtask.title || 'Unnamed'}</span>
                          <span className="subtask-meta">
                            {/* Deadline: {formatDate(subtask.deadline)} */}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(subtask.deadline)}</td>
                      <td>
                        <span className={`status-badge status-${(subtask.status || 'Not Started').toLowerCase().replace(' ', '-')}`}>
                          {subtask.status || 'Not Started'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn"
                          onClick={() => {
                            if (project.is_locked) {
                              alert('Permission not given by HOD to edit subtasks for this project.');
                            } else {
                              openEditSubtaskModal(project.project_id, subtask.subtask_id || subtask.id);
                            }
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showSubtaskModal && (
        <div className="modal-overlay" onClick={closeSubtaskModal}>
          <div className="enhanced-task-popup" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="popup-header">
              <div className="header-content">
                <div className="title-section">
                  <h2 className="modal-title">{isEditMode ? 'Edit Subtask' : 'Add New Subtask'}</h2>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="popup-content">
              <div className="form-grid-container">
                {/* Subtask Name */}
                <div className="field-box span-12">
                  <label className="field-label required">Subtask Name</label>
                  <input
                    type="text"
                    className="enhanced-input"
                    placeholder="Enter subtask name"
                    value={newSubtask.task_name}
                    onChange={handleSubtaskChange}
                    name="task_name"
                    required
                  />
                </div>

                {/* Status */}
                <div className="field-box span-6">
                  <label className="field-label required">Status</label>
                  <select
                    className="enhanced-select"
                    value={newSubtask.status}
                    onChange={handleSubtaskChange}
                    name="status"
                    required
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Deadline */}
                <div className="field-box span-6">
                  <label className="field-label">Deadline</label>
                  <input
                    type="date"
                    className="enhanced-input"
                    value={newSubtask.deadline}
                    onChange={handleSubtaskChange}
                    name="deadline"
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
                <button className="cancel-btn" onClick={closeSubtaskModal}>
                  Cancel
                </button>
                <button className="submit-btn" onClick={handleCreateSubtask}>
                  {isEditMode ? 'Update Subtask' : 'Add Subtask'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyProjection;
