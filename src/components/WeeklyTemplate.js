import React, { useState, useEffect, useRef } from "react";
import "./weeklyTemplate.css";
import { FaTimes, FaSearch, FaChevronDown, FaExternalLinkAlt ,FaInfoCircle} from "react-icons/fa";
import { API_ENDPOINTS } from "../config/api";

export default function WeeklyTemplate({ tasks, loading, filter, setFilter, dateFilter, setDateFilter, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, viewTypeFilter, setViewTypeFilter, teamMemberFilter, setTeamMemberFilter, teamMembers, fetchWeeklyData, isAdminView = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
const [popupView, setPopupView] = useState("task");
  // Set default dates to current week's Monday and Saturday on mount
  useEffect(() => {
    if (!fromDate && !toDate) {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Calculate Monday of current week
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

      // Calculate Saturday of current week
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setFromDate(formatDate(monday));
      setToDate(formatDate(saturday));
    }
  }, []);
  const [showFilters, setShowFilters] = useState(true);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
const [showPopup, setShowPopup] = useState(false);

const openTaskPopup = (task) => {
  setSelectedTask(task);
  setShowPopup(true);
};

const closeTaskPopup = () => {
  setSelectedTask(null);
  setShowPopup(false);
};
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
      teammember: ((viewTypeFilter === 'team' && teamMemberFilter) || (viewTypeFilter === 'all' && teamMemberFilter === 'all')) ? teamMemberFilter : ''
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
// Fetch data when filters change with debounce
useEffect(() => {
  if (filterTimeout) clearTimeout(filterTimeout);
  
  const timeout = setTimeout(() => {
    if (fetchWeeklyData) {
      // Build filters object - ALWAYS include ALL filters
      const filters = {};
      
      // ALWAYS include date filters if they exist
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;
      
      // Include other filters (convert empty to 'all')
      filters.task_type = taskTypeFilter || 'all';
      filters.status = statusFilter || 'all';
      filters.category = categoryFilter || 'all';
      filters.view_type = viewTypeFilter || (isAdminView ? 'all' : 'self');
      
      // Add team member filter if applicable
      if (viewTypeFilter === 'team' && teamMemberFilter) {
        filters.target_user_id = teamMemberFilter;
      }
      
      console.log('Fetching with filters:', filters); // Debug log
      
      // ALWAYS fetch - no condition blocking
      fetchWeeklyData(filters, !hasFetchedInitial.current);
      
      if (!hasFetchedInitial.current) hasFetchedInitial.current = true;
    }
  }, hasFetchedInitial.current ? 500 : 0);
  
  setFilterTimeout(timeout);
  return () => clearTimeout(timeout);
}, [fromDate, toDate, taskTypeFilter, statusFilter, categoryFilter, viewTypeFilter, teamMemberFilter, fetchWeeklyData, isAdminView]);

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
    setViewTypeFilter && setViewTypeFilter(isAdminView ? 'all' : 'self');
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
      tasktype: { 'Fixed': 'Fixed', 'Variable': 'Variable', 'HOD Assigned': 'HOD Assigned' },
      category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
      teammember: {},
      status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'Scheduled': 'Scheduled', 'Cancelled': 'Cancelled', 'On Hold': 'On Hold', 'Re-Scheduled': 'Re-Scheduled', 'all': 'All' }
    };

    if (filterType === 'teammember') {
      if (!value) return isAdminView ? 'All Users' : 'My Tasks';
      if (value === 'all') return 'All Team Members';
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

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  // const allTasks = tasks.filter(task => {
  //   // Search filter
  //   const displayName = task.task_name || task.name || "Untitled Task";
  //   if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
  //       !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
  //     return false;
  //   }

  //   return true;
  // }).sort((a, b) => {
  //   // For "All Team Members" view, sort by source first (master tasks at top), then by owner name, then by date
  //   if (viewTypeFilter === 'all') {
  //     // Primary sort: Master tasks first
  //     if (a.source === 'assigned' && b.source !== 'assigned') return -1;
  //     if (a.source !== 'assigned' && b.source === 'assigned') return 1;

  //     // Secondary sort: Owner name in ascending order (A-Z)
  //     const ownerNameA = a.source === 'assigned' ? (a.assigned_to_user?.name || 'Unknown') : (a.users?.name || 'Unknown');
  //     const ownerNameB = b.source === 'assigned' ? (b.assigned_to_user?.name || 'Unknown') : (b.users?.name || 'Unknown');

  //     if (ownerNameA < ownerNameB) return -1;
  //     if (ownerNameA > ownerNameB) return 1;

  //     // Tertiary sort: Latest tasks first (by updated_at or created_at)
  //     const dateA = new Date(a.start_date || a.date || 0);
  //     const dateB = new Date(b.start_date  || b.date || 0);
  //     return dateB - dateA; // Descending order (newest first)
  //   } else {
  //     // Default sorting: Show master tasks first, then self tasks, then by date
  //     if (a.source === 'assigned' && b.source !== 'assigned') return -1;
  //     if (a.source !== 'assigned' && b.source === 'assigned') return 1;

  //     // Secondary sort: Latest tasks first (by updated_at or created_at)
  //     const dateA = new Date(a.updated_at || a.created_at || a.date || 0);
  //     const dateB = new Date(b.updated_at || b.created_at || b.date || 0);
  //     return dateB - dateA; // Descending order (newest first)
  //   }
  // });


  const allTasks = tasks.filter(task => {
  const displayName = task.task_name || task.name || "Untitled Task";
  if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(task.description || '').toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  return true;
}).sort((a, b) => {
  // Master tasks first
  if (a.source === 'assigned' && b.source !== 'assigned') return -1;
  if (a.source !== 'assigned' && b.source === 'assigned') return 1;

  if (viewTypeFilter === 'all') {
    // Secondary: Owner name ascending
    const ownerNameA = a.source === 'assigned' ? (a.assigned_to_user?.name || 'Unknown') : (a.users?.name || 'Unknown');
    const ownerNameB = b.source === 'assigned' ? (b.assigned_to_user?.name || 'Unknown') : (b.users?.name || 'Unknown');
    if (ownerNameA < ownerNameB) return -1;
    if (ownerNameA > ownerNameB) return 1;
  }

  // Sort by start_date descending
  const dateA = new Date(a.start_date || a.date || 0);
  const dateB = new Date(b.start_date || b.date || 0);
  return dateA - dateB;
});

  return (
    <div className="weekly-wrapper" style={{ padding: '0 50px' }}>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
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
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('Fixed'); setShowTaskTypeDropdown(false); }}>Fixed</div>
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('Variable'); setShowTaskTypeDropdown(false); }}>Variable</div>
                <div className="dropdown-item" onClick={() => { setTaskTypeFilter('HOD Assigned'); setShowTaskTypeDropdown(false); }}>HOD Assigned</div>
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
                    onClick={() => { setViewTypeFilter(isAdminView ? 'all' : 'self'); setTeamMemberFilter(isAdminView ? 'all' : ''); setShowTeamMemberDropdown(false); }}
                  >
                    {isAdminView ? 'All Users' : 'My Tasks'}
                  </div>
                  {teamMembers.map(member => (
                    <div
                      key={member.user_id}
                      className="dropdown-item"
                      onClick={() => {
                        if (member.user_id === 'all') {
                          setViewTypeFilter('all');
                          setTeamMemberFilter('all');
                        } else {
                          setViewTypeFilter('team');
                          setTeamMemberFilter(member.user_id);
                        }
                        setShowTeamMemberDropdown(false);
                      }}
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

      {/* Top Cards */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginTop: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#000', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <p style={{ margin: 0 }}>Total Tasks</p>
            <h2 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>{allTasks.length}</h2>
          </div>
          <div style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#000', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <p style={{ margin: 0 }}>In Progress</p>
            <h2 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>{inProgressTasks.length}</h2>
          </div>
          <div style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#000', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <p style={{ margin: 0 }}>Done</p>
            <h2 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>{completedTasks.length}</h2>
          </div>
          <div style={{ flex: 1, padding: '15px', background: 'white', border: '1px solid #e1e5e9', borderRadius: '8px', textAlign: 'center', color: '#000', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <p style={{ margin: 0 }}>Not Started</p>
            <h2 style={{ margin: '10px 0 0 0', fontSize: '20px' }}>{notStartedTasks.length}</h2>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <table className="report-table">
          <tbody>
            <tr className="header-row">
              <th>Task Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Task Type</th>
              <th>Status</th>
              {(viewTypeFilter === 'all' || viewTypeFilter === 'team') && <th>Owner</th>}
              <th>Assignee</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
            {allTasks.length > 0 ? (
              allTasks.map((task, index) => (
                <tr key={index} style={task.source === 'assigned' ? { backgroundColor: '#cfe2f3' } : {}} className={task.source === 'assigned' ? 'assigned-row' : ''}>
<td
  style={{
    textAlign: 'left',
    maxWidth: '180px',
    width: '180px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  }}
  title={task.task_name || task.name || "Untitled Task"}
>
  {task.task_name || task.name || "Untitled Task"}
</td>                  <td>{formatDate(task.start_date)}</td>
                  <td>{formatDate(task.date || task.dueDate)}</td>
                  <td>{task.source === 'assigned' ? 'Master' : (task.task_type || task.type || task.dept || "Work")}</td>
                  <td>{task.status}</td>
                  {(viewTypeFilter === 'all' || viewTypeFilter === 'team') && <td>{task.source === 'assigned' ? (task.assigned_to_user?.name || 'Unknown') : (task.users?.name || 'Unknown')}</td>}
                  <td>{task.source === 'assigned' ? (task.assigned_by_user?.name || 'Unknown') : 'Self'}</td>
<td>
  {(task.latest_remarks || task.remarks || "").length > 20
    ? (task.latest_remarks || task.remarks).slice(0, 20) + "..."
    : (task.latest_remarks || task.remarks)}
</td>                 
<td>
  <span
    onClick={() => openTaskPopup(task)}
    title="View Details"
    style={{
      display: "inline-block",
      padding: "5px 12px",
      background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#fff",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "0.3s ease"
    }}
  >
    View
  </span>
</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={(viewTypeFilter === 'all' || viewTypeFilter === 'team') ? 8 : 7} style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  {isAdminView && viewTypeFilter === 'all' && teamMemberFilter !== 'all'
                    ? 'Choose a team member from the dropdown above to see their tasks'
                    : 'No tasks found'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
{showPopup && selectedTask && (
  <div className="history-popup-overlay">
    <div className="history-popup-box">

      {/* Header */}
      <div className="history-popup-header">

        <div className="header-left">
          <span className="calendar-icon">📅</span>

          <div>
            <h2>{selectedTask.task_name}</h2>
            <small>Task History</small>
          </div>
        </div>

        <div className="header-actions">

          <div className="popup-switch">
            <button
              className={popupView === "task" ? "active" : ""}
              onClick={() => setPopupView("task")}
            >
              Task
            </button>

            <button
              className={popupView === "meeting" ? "active" : ""}
              onClick={() => setPopupView("meeting")}
            >
              Meeting
            </button>
          </div>

          <FaTimes className="history-close-icon" onClick={closeTaskPopup} />

        </div>
      </div>

      {/* Task View */}
      {/* Task View */}
{popupView === "task" && (
  <>
    <div className="history-table-header task-header">
      <div>Date</div>
      <div>Time</div>
      <div>Remarks</div>
      <div>Status</div>
    </div>

    <div className="history-table-body">
      {selectedTask.remarks_between_dates ? (
        selectedTask.remarks_between_dates.split("|").map((item, index) => {
          const parts = item.split(":");
          
              const remarkDate = parts[0]?.trim();
    const remarkText = parts.slice(1, -2).join(":").trim(); 
    const hours = parts[parts.length - 2]?.trim();
    const status = parts[parts.length - 1]?.trim();


          return (
                  <div key={index} className="history-row task-row">
        <div>{formatDate(remarkDate)}</div>
        <div>{hours}</div>
        <div>{remarkText}</div>
        <div>
          <span className="status-pill">{status}</span>
        </div>
      </div>

          );
        })
      ) : (
        <div className="history-row task-row">
          <div>No history available</div>
        </div>
      )}
    </div>
  </>
)}

{/* Meeting View */}
{popupView === "meeting" && (
  <>
    <div className="history-table-header meeting-header" style={{color: '#000'}}>
      <div>Date</div>
      <div>Meeting</div>
      <div>Department</div>
      <div>Co-Person</div>
      <div>Slot</div>
      <div>Time</div>
      <div>Note</div>
    </div>

    <div className="history-table-body">
      {selectedTask.meeting_details?.length > 0 ? (
        selectedTask.meeting_details.map((meeting, index) => (
          <div key={index} className="history-row meeting-row">
            <div>{formatDate(meeting.date)}</div>
            <div>{meeting.meeting_name}</div>
            <div>{meeting.dept || "-"}</div>
            <div>{meeting.co_person || "-"}</div>
            <div>{meeting.prop_slot || "-"}</div>
            <div>{meeting.time || "-"} min</div>
            <div>{meeting.notes || "-"}</div>

          </div>
        ))
      ) : (
        <div className="history-row meeting-row">
          <div>No meetings available</div>
        </div>
      )}
    </div>
  </>
)}
    </div>
  </div>
)}

    </div>
  );
}