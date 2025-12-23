import React from 'react';
import './TaskStatsPanel.css';

const TaskStatsPanel = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="task-stats-panel">
        <div className="stats-loading">
          <p>Loading monthly stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-stats-panel">
        <div className="stats-error">
          <p>Failed to load stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-stats-panel">
      <div className="stats-header">
        <h3>Current Month Stats</h3>
      </div>
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-number">{stats?.total_tasks || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Done</div>
            <div className="stat-number">{stats?.completed || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">In Progress</div>
            <div className="stat-number">{stats?.in_progress || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-label">Not Started</div>
            <div className="stat-number">{stats?.not_started || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskStatsPanel;