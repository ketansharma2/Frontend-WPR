import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../config/api";
import "./AdminUsers.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    department: "",
    role: "employee",
    username: ""
  });
  const [error, setError] = useState("");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error("Fetch users error:", data);
        setError(data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Network error fetching users:", err);
      setError("Network error. Please check your connection.");
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
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const url = editingUser
        ? `${API_BASE_URL}/admin/users/${editingUser.user_id}`
        : `${API_BASE_URL}/admin/users`;
      
      const method = editingUser ? "PUT" : "POST";

      // Prepare form data for submission
      const submitData = { ...formData };
      
      // If editing and password is empty, remove it from the request
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          email: "",
          password: "",
          name: "",
          department: "",
          role: "employee",
          username: ""
        });
        fetchUsers(); // Refresh the users list
        console.log("User operation successful:", data.message);
      } else {
        console.error("User operation error:", data);
        setError(data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Network error during user operation:", err);
      setError("Network error. Please check your connection.");
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
      department: user.department || "",
      role: user.role || "employee",
      username: user.username || ""
    });
    setShowModal(true);
    setError(""); // Clear any previous errors
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setError("");
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in again.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (response.ok) {
          console.log("User deleted successfully");
          fetchUsers(); // Refresh the users list
        } else {
          console.error("Delete user error:", data);
          setError(data.message || "Failed to delete user");
        }
      } catch (err) {
        console.error("Network error deleting user:", err);
        setError("Network error. Please check your connection.");
      }
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      name: "",
      department: "",
      role: "employee",
      username: ""
    });
    setShowModal(true);
    setError(""); // Clear any previous errors
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError("");
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <h2>User Management</h2>
        <button className="create-user-btn" onClick={openCreateModal}>
          Create New User
        </button>
      </div>

      {error && (
        <div className="error-message" style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Username</th>
              <th>Department</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No users found. Create your first user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.email}</td>
                  <td>{user.name}</td>
                  <td>{user.username || 'N/A'}</td>
                  <td>{user.department || 'N/A'}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(user.user_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password {editingUser ? "(leave blank to keep current)" : "*"}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  disabled={loading}
                >
                  <option value="employee">Employee</option>
                  <option value="hod">HOD</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Processing..." : (editingUser ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}