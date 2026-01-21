import React, { useState } from "react";
import "./Login.css";
import { api } from "../config/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const data = await api.login({ email, password });

      // Store user data and tokens
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("loginTime", Date.now().toString());
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("profile", JSON.stringify(data.profile));
      
      // Redirect based on role
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      }
      onLogin(data);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Minimal Professional Header */}
        <div className="login-header">
          <h1 className="login-title">Welcome</h1>
        </div>

        {/* Clean Form */}
        <div className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="login-input"
              disabled={loading}
              autoComplete="email"
            />
            <label className="floating-label">Email</label>
            <span className="input-icon">✉</span>
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="login-input"
              disabled={loading}
              autoComplete="current-password"
            />
            <label className="floating-label">Password</label>
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              disabled={loading}
              tabIndex={-1}
            >
              {showPassword ? "👁" : "👁‍🗨"}
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            className={`login-btn ${loading ? 'loading' : ''}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        {/* Minimal Footer */}
        <div className="login-footer">
          <p>Maven Jobs</p>
        </div>
      </div>
    </div>
  );
}