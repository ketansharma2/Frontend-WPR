import React, { useState, useEffect } from "react";
import { api } from "../config/api";
import "./AdminUsers.css";

export default function AdminUsers() {
  // Removed activeTab state since only one section remains
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
     email: "",
     password: "",
     name: "",
     dept: "",
     designation: "",
     user_type: "Team Member"
   });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setError("");
      const data = await api.getMembers();
      setUsers(data.members || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare form data for submission
      const submitData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        dept: formData.dept,
        designation: formData.designation,
        role: formData.user_type,
        user_type: formData.user_type
      };

      // If editing and password is empty, remove it from the request
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      let data;
      if (editingUser) {
        data = await api.updateMember(editingUser.user_id, submitData);
      } else {
        data = await api.createMember(submitData);
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({
        email: "",
        password: "",
        name: "",
        dept: "",
        designation: "",
        user_type: "Team Member"
      });
      setShowPassword(false);
      fetchUsers(); // Refresh the users list
      console.log("User operation successful:", data.message);
    } catch (err) {
      console.error("User operation error:", err);
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      password: "", // Don't pre-fill password for security
      name: user.name || "",
      dept: user.dept || "",
      designation: user.role || "", // Designation from role field
      user_type: user.user_type || "Team Member" // User type from user_type field
    });
    setShowPassword(false);
    setShowModal(true);
    setError(""); // Clear any previous errors
    console.log("Editing user:", user); // Debug log
    console.log("Form data dept:", user.dept); // Debug log
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setError("");
        await api.deleteMember(userId);
        console.log("User deleted successfully");
        fetchUsers(); // Refresh the users list
      } catch (err) {
        console.error("Delete user error:", err);
        setError(err.message || "Failed to delete user");
      }
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      name: "",
      dept: "",
      designation: "",
      user_type: "Team Member"
    });
    setShowPassword(false);
    setShowModal(true);
    setError(""); // Clear any previous errors
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError("");
  };

  return (
    <div style={{ padding: '50px 50px 20px 50px', backgroundColor: '#e0e0e0', minHeight: '100vh' }}>
      {/* Header Strip */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          margin: '0',
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          User Management
        </h2>
        <button
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(135deg, #103c7f 0%, #0d2e5c 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(16, 60, 127, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #0d2e5c 0%, #103c7f 100%)'}
          onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #103c7f 0%, #0d2e5c 100%)'}
        >
          <span>+</span>
          Add User
        </button>
      </div>


      <>
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* User Management Table - Same design as dashboard */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
          overflow: 'hidden'
        }}>

          {/* Table */}
          <div style={{
            padding: '0',
            margin: '0'
          }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            margin: '0',
            borderSpacing: '0'
          }}>
            <thead>
              <tr style={{
                background: '#5580ff',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  width: '60px'
                }}>S.No</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  width: 'auto'
                }}>Name</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '200px',
                  width: 'auto'
                }}>Email</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '120px',
                  width: 'auto'
                }}>Department</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '150px',
                  width: 'auto'
                }}>Designation</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  borderRight: '1px solid #e5e7eb',
                  minWidth: '100px',
                  width: 'auto'
                }}>User Type</th>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'white',
                  minWidth: '120px',
                  width: 'auto'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No users found. Create your first user to get started.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.user_id} style={{
                    backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                    <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{user.email}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{user.dept || 'N/A'}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{user.role || 'N/A'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: (user.user_type === 'Admin' || user.user_type === 'admin') ? '#dbeafe' :
                                        (user.user_type === 'HOD' || user.user_type === 'hod') ? '#fef3c7' :
                                        (user.user_type === 'Sub Admin') ? '#f59e0b' : '#dcfce7',
                        color: (user.user_type === 'Admin' || user.user_type === 'admin') ? '#1e40af' :
                              (user.user_type === 'HOD' || user.user_type === 'hod') ? '#92400e' :
                              (user.user_type === 'Sub Admin') ? '#92400e' : '#166534'
                      }}>
                        {user.user_type === 'Team Member' ? 'Team Member' :
                         user.user_type === 'HOD' ? 'HOD' :
                         user.user_type === 'Admin' ? 'Admin' :
                         user.user_type === 'Sub Admin' ? 'Sub Admin' :
                         user.user_type === 'employee' ? 'Team Member' :
                         user.user_type === 'hod' ? 'HOD' :
                         user.user_type === 'admin' ? 'Admin' :
                         user.user_type}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </>


      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid-container">
                  <div className="field-box span-6">
                    <label className="field-label required">Name</label>
                    <input
                      type="text"
                      className="enhanced-input"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      disabled={loading}
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="field-box span-6">
                    <label className="field-label required">Email</label>
                    <input
                      type="email"
                      className="enhanced-input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={loading}
                      placeholder="user@example.com"
                    />
                  </div>

                  {!editingUser && (
                    <div className="field-box span-6">
                      <label className="field-label required">Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="enhanced-input"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required={!editingUser}
                          disabled={loading}
                          placeholder="Enter password"
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6b7280',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '14px'
                          }}
                          disabled={loading}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="field-box span-6">
                    <label className="field-label required">Department</label>
                    <select
                      className="enhanced-select"
                      value={formData.dept}
                      onChange={(e) => setFormData({...formData, dept: e.target.value})}
                      disabled={loading}
                    >
                      <option value="">Select Department</option>
                      <option value="Tech & DM">Tech & DM</option>
                      <option value="IT">IT</option>
                      <option value="Sales">Sales</option>
                      <option value="Corporate Sales">Corporate Sales</option>
                      <option value="Domestic Sales">Domestic Sales</option>
                      <option value="HR">HR</option>
                      <option value="Deliveries">Deliveries</option>
                    </select>
                  </div>

                  <div className="field-box span-6">
                    <label className="field-label">Designation</label>
                    <input
                      type="text"
                      className="enhanced-input"
                      value={formData.designation}
                      onChange={(e) => setFormData({...formData, designation: e.target.value})}
                      disabled={loading}
                      placeholder="Job Title/Position"
                    />
                  </div>

                  <div className="field-box span-6">
                    <label className="field-label required">User Type</label>
                    <select
                      className="enhanced-select"
                      value={formData.user_type}
                      onChange={(e) => setFormData({...formData, user_type: e.target.value})}
                      disabled={loading}
                    >
                      <option value="Team Member">Team Member</option>
                      <option value="HOD">HOD</option>
                      <option value="Sub Admin">Sub Admin</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                >
                  {loading ? "Processing..." : (editingUser ? "Update" : "Create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}