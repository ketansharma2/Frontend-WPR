import React, { useState, useEffect, useRef } from "react";
import "./weeklyTemplate.css";
import { FaTimes, FaSearch, FaChevronDown } from "react-icons/fa";
import { API_ENDPOINTS } from "../config/api";

export default function WeeklyTemplate({ tasks, loading, filter, setFilter, dateFilter, setDateFilter, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, viewTypeFilter, setViewTypeFilter, teamMemberFilter, setTeamMemberFilter, teamMembers, fetchWeeklyData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    date: '',
    tasktype: '',
    category: '',
    status: '',
    teammember: ''
  });
  const [filterTimeout, setFilterTimeout] = useState(null);
  const hasFetchedInitial = useRef(false);

  // Sync activeFilters with filter props
  useEffect(() => {
    setActiveFilters({
      date: (fromDate || toDate) ? 'range' : '',
      tasktype: taskTypeFilter,
      category: categoryFilter,
      status: statusFilter,
      teammember: teamMemberFilter
    });
  }, [fromDate, toDate, taskTypeFilter, categoryFilter, statusFilter, viewTypeFilter, teamMemberFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowTaskTypeDropdown(false);
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
        setShowTeamMemberDropdown(false);
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
        if (viewTypeFilter) filters.view_type = viewTypeFilter;
        if (viewTypeFilter === 'team' && teamMemberFilter) filters.target_user_id = teamMemberFilter;
        fetchWeeklyData(filters, !hasFetchedInitial.current); // Show loading only for initial fetch
        if (!hasFetchedInitial.current) hasFetchedInitial.current = true;
      }
    }, hasFetchedInitial.current ? 500 : 0); // No debounce for initial fetch
    setFilterTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [fromDate, toDate, taskTypeFilter, statusFilter, categoryFilter, viewTypeFilter, teamMemberFilter, fetchWeeklyData]);


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
            categoryFilter ||
            teamMemberFilter;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setTaskTypeFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setViewTypeFilter && setViewTypeFilter('self');
    setTeamMemberFilter && setTeamMemberFilter('');
  };

  // Helper function to get display text for filters
  const getFilterDisplayText = (filterType, value) => {
    if (!value) return filterType === 'date' ? 'Date Range' :
                       filterType === 'tasktype' ? 'Task Type' :
                       filterType === 'category' ? 'Category' :
                       filterType === 'teammember' ? 'Team Member' : 'Status';

    if (value === 'all') return 'All';

    const displayMap = {
      tasktype: { 'fixed': 'Fixed', 'variable': 'Variable', 'hod assigned': 'HOD Assigned' },
      category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
      teammember: {},
      status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'Scheduled': 'Scheduled', 'Cancelled': 'Cancelled', 'On Hold': 'On Hold', 'Re-Scheduled': 'Re-Scheduled', 'all': 'All' }
    };

    if (filterType === 'teammember') {
      const member = teamMembers?.find(m => m.user_id === value);
      return member ? member.name : 'Team Member';
    }

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
    const displayName = task.task_name || task.name || "Untitled Task";
    if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Show master tasks (source: "assigned") first, then self tasks
    if (a.source === 'assigned' && b.source !== 'assigned') return -1;
    if (a.source !== 'assigned' && b.source === 'assigned') return 1;
    return 0;
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
                setShowTeamMemberDropdown(false);
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

          {/* Team Member Filter - Only show for HOD */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.teammember ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeamMemberDropdown(!showTeamMemberDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowCategoryDropdown(false);
                  setShowStatusDropdown(false);
                }}
              >
                {getFilterDisplayText('teammember', activeFilters.teammember)}
                <FaChevronDown className="dropdown-arrow" />
              </button>
              {showTeamMemberDropdown && (
                <div className="dropdown-menu">
                  <div
                    className="dropdown-item"
                    onClick={() => { setViewTypeFilter('self'); setTeamMemberFilter(''); setShowTeamMemberDropdown(false); }}
                  >
                    My Tasks
                  </div>
                  {teamMembers.map(member => (
                    <div
                      key={member.user_id}
                      className="dropdown-item"
                      onClick={() => { setViewTypeFilter('team'); setTeamMemberFilter(member.user_id); setShowTeamMemberDropdown(false); }}
                    >
                      {member.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


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
            <tr key={index} className={task.source === 'assigned' ? 'assigned-row' : ''}>
              <td>{task.date || task.dueDate || "--"}</td>
              <td>{task.timeline || task.prop_slot || "--"}</td>
              <td>{task.task_name || task.name || "Untitled Task"}</td>
              <td>{task.source === 'assigned' ? 'Master' : (task.task_type || task.type || task.dept || "Work")}</td>
              <td style={task.source !== 'assigned' ? {color: task.status === 'Done' ? 'green' : task.status === 'In Progress' ? 'red' : task.status === 'Not Started' ? 'orange' : 'black'} : {}}>{task.status}</td>
              <td>{task.itemType === 'meeting' ? (task.co_person || 'Not specified') : 'Self'}</td>
              <td>{task.file_link || task.attachments ? <a href={task.file_link || task.attachments} target="_blank" rel="noopener noreferrer">Open</a> : 'No link'}</td>
            </tr>
          ))}
        </tbody>
      </table>


    </div>
  );
}