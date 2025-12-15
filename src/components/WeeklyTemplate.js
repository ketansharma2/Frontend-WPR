import React, { useState, useEffect } from "react";
import "./weeklyTemplate.css";
import { FaTimes, FaSearch, FaChevronDown } from "react-icons/fa";
import { API_ENDPOINTS } from "../config/api";

export default function WeeklyTemplate({ tasks, loading, filter, setFilter, dateFilter, setDateFilter, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, fetchWeeklyData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    date: '',
    tasktype: '',
    category: '',
    status: ''
  });
  const [filterTimeout, setFilterTimeout] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown') && !event.target.closest('.btn')) {
        setShowTaskTypeDropdown(false);
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch data when filters change with debounce
  useEffect(() => {
    if (filterTimeout) clearTimeout(filterTimeout);
    const timeout = setTimeout(() => {
      if (fetchWeeklyData) {
        const filters = {};
        if (fromDate) filters.from_date = fromDate;
        if (toDate) filters.to_date = toDate;
        if (taskTypeFilter) filters.task_type = taskTypeFilter;
        if (statusFilter) filters.status = statusFilter || 'all';
        if (categoryFilter) filters.category = categoryFilter;
        fetchWeeklyData(filters, false); // No loading for filter changes
      }
    }, 500); // 500ms debounce
    setFilterTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [fromDate, toDate, taskTypeFilter, statusFilter, categoryFilter, fetchWeeklyData]);

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));
      const response = await fetch(`${API_ENDPOINTS.REPORTS}/download`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          start_date: fromDate,
          end_date: toDate,
          task_type: taskTypeFilter || 'all',
          category: categoryFilter || 'all',
          status: statusFilter || 'all'
        })
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weekly_report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download report');
      }
    } catch (err) {
      alert('Error downloading report');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="weekly-wrapper">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading weekly report data...</p>
        </div>
      </div>
    );
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery ||
           fromDate || toDate ||
           taskTypeFilter ||
           statusFilter ||
           categoryFilter;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setTaskTypeFilter('');
    setStatusFilter('');
    setCategoryFilter('');
  };

  // Helper function to get display text for filters
  const getFilterDisplayText = (filterType, value) => {
    if (!value) return filterType === 'date' ? 'Date Range' :
                      filterType === 'tasktype' ? 'Task Type' :
                      filterType === 'category' ? 'Category' : 'Status';
    
    if (value === 'all') return 'All';
    
    const displayMap = {
      tasktype: { 'fixed': 'Fixed', 'variable': 'Variable', 'hod assigned': 'HOD Assigned' },
      category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
      status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'Scheduled': 'Scheduled', 'Cancelled': 'Cancelled', 'On Hold': 'On Hold', 'Re-Scheduled': 'Re-Scheduled', 'all': 'All' }
    };
    
    return displayMap[filterType]?.[value] || value;
  };

  // Get date filter display text
  const getDateFilterDisplay = () => {
    if (!fromDate && !toDate) return 'Date Range';
    if (fromDate && toDate) return `${fromDate} to ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `To ${toDate}`;
    return 'Date Range';
  };

  const completedTasks = tasks.filter(task => task.status === 'Done');
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const notStartedTasks = tasks.filter(task => task.status === 'Not Started');
  const allTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="weekly-wrapper">

      {/* Professional Search and Filter Bar */}
      <div className="professional-filter-bar">
        {/* Search Bar */}
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks and meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <FaTimes
              className="clear-search"
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          {/* Date Range Filter - Always Visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: fromDate || toDate ? '#e3f2fd' : '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', minWidth: '280px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', whiteSpace: 'nowrap' }}>Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="From"
              style={{
                padding: '4px 6px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '11px',
                width: '100px'
              }}
            />
            <span style={{ fontSize: '11px', color: '#6c757d' }}>to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="To"
              style={{
                padding: '4px 6px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '11px',
                width: '100px'
              }}
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                style={{
                  padding: '4px 6px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Clear dates"
              >
                ×
              </button>
            )}
          </div>

          {/* Task Type Filter */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${activeFilters.tasktype ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskTypeDropdown(!showTaskTypeDropdown);
                setShowCategoryDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              {getFilterDisplayText('tasktype', activeFilters.tasktype)}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showTaskTypeDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter(''); setShowTaskTypeDropdown(false); }}>All</div>
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('fixed'); setShowTaskTypeDropdown(false); }}>Fixed</div>
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('variable'); setShowTaskTypeDropdown(false); }}>Variable</div>
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('hod assigned'); setShowTaskTypeDropdown(false); }}>HOD Assigned</div>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${activeFilters.category ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowTaskTypeDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              {getFilterDisplayText('category', activeFilters.category)}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showCategoryDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setCategoryFilter(''); setShowCategoryDropdown(false); }}>All</div>
                <div className="dropdown-item" onClick={() => { setCategoryFilter('self'); setShowCategoryDropdown(false); }}>Self</div>
                <div className="dropdown-item" onClick={() => { setCategoryFilter('assigned'); setShowCategoryDropdown(false); }}>Assigned</div>
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${activeFilters.status ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowTaskTypeDropdown(false);
                setShowCategoryDropdown(false);
              }}
            >
              {getFilterDisplayText('status', activeFilters.status)}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}>All</div>
                <div className="dropdown-item" onClick={() => { setStatusFilter('In Progress'); setShowStatusDropdown(false); }}>In Progress</div>
                <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                <div className="dropdown-item" onClick={() => { setStatusFilter('Not Started'); setShowStatusDropdown(false); }}>Not Started</div>
              </div>
            )}
          </div>

          {/* Clear All Filters Button - Show when filters are active */}
          {hasActiveFilters() && (
            <button
              className="clear-all-filters-btn"
              onClick={clearAllFilters}
              title="Clear all filters"
            >
              <FaTimes className="clear-all-icon" />
              Clear All
            </button>
          )}
        </div>

      </div>

      <h1 className="main-title">Weekly Progress with Task and Due Date</h1>

      {/* Top Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, padding: '20px', background: '#103c7f', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#fff' }}>
          <p style={{ margin: 0 }}>Total Tasks</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px' }}>{allTasks.length}</h2>
        </div>
        <div style={{ flex: 1, padding: '20px', background: '#103c7f', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#fff' }}>
          <p style={{ margin: 0 }}>In Progress</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px' }}>{inProgressTasks.length}</h2>
        </div>
        <div style={{ flex: 1, padding: '20px', background: '#103c7f', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#fff' }}>
          <p style={{ margin: 0 }}>Done</p>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px' }}>{completedTasks.length}</h2>
        </div>
      </div>

      <table className="report-table">
        <tbody>
          {/* ALL TASKS SECTION */}
          <tr>
            <th colSpan="10" className="completed-title">All Tasks</th>
          </tr>

          <tr className="header-row">
            <th>Date</th>
            <th>Timeline</th>
            <th>Task Name</th>
            <th>Task Type</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Link</th>
          </tr>
          {/* All tasks rows */}
          {allTasks.map((task, index) => (
            <tr key={index}>
              <td>{task.date || task.dueDate || "--"}</td>
              <td>{task.timeline || task.prop_slot || "--"}</td>
              <td>{task.task_name || task.name || "Untitled Task"}</td>
              <td>{task.task_type || task.type || task.dept || "Work"}</td>
              <td style={{color: task.status === 'Done' ? 'green' : task.status === 'In Progress' ? 'red' : task.status === 'Not Started' ? 'orange' : 'black'}}>{task.status}</td>
              <td>{task.itemType === 'meeting' ? (task.co_person || 'Not specified') : 'Self'}</td>
              <td>{task.file_link || task.attachments ? <a href={task.file_link || task.attachments} target="_blank" rel="noopener noreferrer">Open</a> : 'No link'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="download-btn" onClick={handleDownload}>Download Report</button>

    </div>
  );
}