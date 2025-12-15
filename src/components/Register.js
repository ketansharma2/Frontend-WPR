import React from "react";
import "./Login.css";

export default function Register({ onBackToLogin, onRegisterSuccess }) {
  return (
    <div className="login-container">
      <div className="login-card" >

        <h2 className="login-title">Register</h2>

        <label>Username</label>
        <input
          type="text"
          placeholder="Enter username"
          className="login-input"
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter email"
          className="login-input"
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          className="login-input"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm password"
          className="login-input"
        />

        <button className="login-btn" onClick={onRegisterSuccess}>Register</button>

        <p className="register-text" onClick={onBackToLogin} style={{ cursor: 'pointer' }}>Already have an account? Login</p>
      </div>
    </div>
  );
}