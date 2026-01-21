import React, { useState, useEffect } from 'react';
import './RandR.css';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';


const RnR = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('R&R');
  const [userProfile, setUserProfile] = useState(null);
 
  // Data States
  const [rnrData, setRnrData] = useState([]);
  const [fixedTasks, setFixedTasks] = useState([]);


  // Modal Visibility States
  const [showRnrModal, setShowRnrModal] = useState(false);
  const [showFixedTaskModal, setShowFixedTaskModal] = useState(false);
  const [showRoleOverviewModal, setShowRoleOverviewModal] = useState(false);


  // Form States
  const [roleOverviewForm, setRoleOverviewForm] = useState({
    name: '', description: '', subject: '', object: '', goal: ''
  });


  const [rnrForm, setRnrForm] = useState({
    rnr: '', description: '', end_goal: '', timings: '', guideline: '', process_limitations: ''
  });


  const [fixedTaskForm, setFixedTaskForm] = useState({
    taskName: '', frequency: 'Daily', assignedBy: ''
  });


  // --- Effects & Fetching ---
  useEffect(() => {
    const profile = localStorage.getItem("profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserProfile(parsed);
      fetchRnrData(parsed.user_id);
      fetchFixedTasks(parsed.user_id);
    }
  }, []);


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


  // --- Handlers ---
  const handleRoleOverviewSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Role Overview:", roleOverviewForm);
    setShowRoleOverviewModal(false);
  };


  const handleRnrSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting R&R:", rnrForm);
    setShowRnrModal(false);
  };


  const handleFixedTaskSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Fixed Task:", fixedTaskForm);
    setShowFixedTaskModal(false);
  };


  return (
    <div className="rnr-container">
     
      {/* SECTION 1: Role Overview */}
      <div className="section-container first-section">
        <div className="brand-header-green">
          <h3>Role Overview</h3>
          <button className="add-btn-dark" onClick={() => setShowRoleOverviewModal(true)}>
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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Lovekush</td>
                <td>Social Media Intern</td>
                <td>Social Media Management</td>
                <td>Promote Brand & Improve Engagement</td>
                <td>Build Strong Online Presence & Learning Experience</td>
                 <td>Ajay</td>
               
              </tr>
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
                      <td><button className="action-link">Edit</button></td>
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


      {/* NEW SECTION 4: Fixed Tasks (Always visible in the bottom free space) */}
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
                    <td><button className="action-link">Edit</button></td>
                  </tr>
                )) : <tr><td colSpan="5" className="no-data">No data available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>


      {/* --- MODALS --- */}


      {/* 1. Modal: Add Role Overview */}
      {showRoleOverviewModal && (
        <div className="modal-overlay">
          <div className="brand-modal">
            <div className="modal-header-blue">
              <h2>Add Role Overview</h2>
              <button className="close-x" onClick={() => setShowRoleOverviewModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRoleOverviewSubmit} className="modal-form">
              <div className="form-group"><label>Name</label>
                <input type="text" value={roleOverviewForm.name} onChange={(e) => setRoleOverviewForm({...roleOverviewForm, name: e.target.value})} placeholder="Name" required />
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows="2" value={roleOverviewForm.description} onChange={(e) => setRoleOverviewForm({...roleOverviewForm, description: e.target.value})} placeholder="Description" />
              </div>
              <div className="form-row">
                <div className="form-group flex-1"><label>Subject</label>
                  <input type="text" value={roleOverviewForm.subject} onChange={(e) => setRoleOverviewForm({...roleOverviewForm, subject: e.target.value})} placeholder="Subject" />
                </div>
                <div className="form-group flex-1"><label>Object</label>
                  <input type="text" value={roleOverviewForm.object} onChange={(e) => setRoleOverviewForm({...roleOverviewForm, object: e.target.value})} placeholder="Object" />
                </div>
              </div>
              <div className="form-group"><label>Goal</label>
                <input type="text" value={roleOverviewForm.goal} onChange={(e) => setRoleOverviewForm({...roleOverviewForm, goal: e.target.value})} placeholder="Goal" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowRoleOverviewModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-green">Save Overview</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 2. Modal: Add R&R */}
      {showRnrModal && (
        <div className="modal-overlay">
          <div className="brand-modal modal-wide">
            <div className="modal-header-blue">
              <h2>Add Role and Responsibility</h2>
              <button className="close-x" onClick={() => setShowRnrModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRnrSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group flex-1"><label>R&R Title</label>
                  <input type="text" placeholder="Title" onChange={(e) => setRnrForm({...rnrForm, rnr: e.target.value})} required />
                </div>
                <div className="form-group flex-1"><label>End Goal</label>
                  <input type="text" placeholder="End Goal" onChange={(e) => setRnrForm({...rnrForm, end_goal: e.target.value})} />
                </div>
              </div>
              <div className="form-group"><label>Description</label>
                <textarea rows="2" placeholder="Description" onChange={(e) => setRnrForm({...rnrForm, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group flex-1"><label>Timings</label>
                  <input type="text" placeholder="e.g. 9 AM - 6 PM" onChange={(e) => setRnrForm({...rnrForm, timings: e.target.value})} />
                </div>
                <div className="form-group flex-1"><label>Guideline</label>
                  <input type="text" placeholder="Guideline" onChange={(e) => setRnrForm({...rnrForm, guideline: e.target.value})} />
                </div>
              </div>
              <div className="form-group"><label>Process and Limitations</label>
                <textarea rows="2" placeholder="Process and Limitations" onChange={(e) => setRnrForm({...rnrForm, process_limitations: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowRnrModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-green">Add R&R</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* 3. Modal: Add Fixed Task */}
      {showFixedTaskModal && (
        <div className="modal-overlay">
          <div className="brand-modal">
            <div className="modal-header-blue">
              <h2>Add Fixed Task</h2>
              <button className="close-x" onClick={() => setShowFixedTaskModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleFixedTaskSubmit} className="modal-form">
              <div className="form-group"><label>Task Name</label>
                <input type="text" placeholder="e.g. Fill WPR" onChange={(e) => setFixedTaskForm({...fixedTaskForm, taskName: e.target.value})} required />
              </div>
              <div className="form-group"><label>Frequency</label>
                <select onChange={(e) => setFixedTaskForm({...fixedTaskForm, frequency: e.target.value})}>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group"><label>Assigned By</label>
                <input type="text" placeholder="Name" onChange={(e) => setFixedTaskForm({...fixedTaskForm, assignedBy: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowFixedTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-green">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default RnR;

