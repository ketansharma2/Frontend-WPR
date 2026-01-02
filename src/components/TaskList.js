import React, { useState, useEffect } from "react";
import "./TaskList.css";
import ToggleSwitch from "./ToggleSwitch";
import {
  FaTimes,
  FaEllipsisV,
  FaSearch,
  FaChevronDown,
  FaExternalLinkAlt
} from "react-icons/fa";

export default function TaskList({ tasks, onEdit, onViewDetails, onDelete, onViewHistory, filter, setFilter, dateFilter, setDateFilter, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, viewTypeFilter, setViewTypeFilter, teamMemberFilter, setTeamMemberFilter, teamMembers, dashboardViewType, showFilterBar = true, showMyTasksOption = true, isAdminView = false, userRole }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateActive, setDateActive] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    date: '',
    tasktype: '',
    category: '',
    status: '',
    viewtype: '',
    teammember: ''
  });
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showViewTypeDropdown, setShowViewTypeDropdown] = useState(false);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  // Sync activeFilters with filter props
  useEffect(() => {
    setActiveFilters({
      date: dateFilter !== 'all' ? dateFilter : '',
      tasktype: taskTypeFilter,
      category: categoryFilter,
      status: statusFilter,
      viewtype: viewTypeFilter,
      teammember: teamMemberFilter
    });
  }, [dateFilter, taskTypeFilter, categoryFilter, statusFilter, viewTypeFilter, teamMemberFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowDateDropdown(false);
        setShowTaskTypeDropdown(false);
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
        setShowViewTypeDropdown(false);
        setShowTeamMemberDropdown(false);
      }
      if (!event.target.closest('.task-menu') && !event.target.closest('.menu-icon')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close dropdowns when filter changes
  useEffect(() => {
    setShowTeamMemberDropdown(false);
  }, [filter]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery ||
           (dateFilter && dateFilter !== 'all') ||
           (filter !== 'meeting' && taskTypeFilter) ||
           statusFilter ||
           (filter !== 'meeting' && categoryFilter) ||
           teamMemberFilter;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setTaskTypeFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setViewTypeFilter && setViewTypeFilter('self');
    setTeamMemberFilter && setTeamMemberFilter('');
    setDateActive('');
  };

  // Helper function to get display text for filters
  const getFilterDisplayText = (filterType, value) => {
    if (!value) return filterType === 'date' ? 'Date' :
                      filterType === 'tasktype' ? 'Task Type' :
                      filterType === 'category' ? 'Category' :
                      filterType === 'viewtype' ? 'View' :
                      filterType === 'teammember' ? 'Team Member' : 'Status';

    if (value === 'all') return 'All';

    const displayMap = {
      date: { 'today': 'Today', 'yesterday': 'Yesterday', 'past_week': 'Past week', 'past_month': 'Past month' },
      tasktype: { 'Fixed': 'Fixed', 'Variable': 'Variable', 'HOD Assigned': 'HOD Assigned' },
      category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
      viewtype: { 'self': 'Self', 'team': 'Team' },
      teammember: {},
      status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'Scheduled': 'Scheduled', 'Cancelled': 'Cancelled', 'On Hold': 'On Hold', 'Re-Scheduled': 'Re-Scheduled', 'all': 'All' }
    };

    if (filterType === 'teammember') {
      if (value === 'all') return 'All Team Members';
      const member = teamMembers?.find(m => m.user_id === value);
      return member ? member.name : 'Team Member';
    }

    return displayMap[filterType]?.[value] || value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  // Helper function to get display name based on item type
  const getDisplayName = (task) => {
    if (task.itemType === 'meeting') {
      return task.meeting_name || task.name || 'Untitled Meeting';
    }
    return task.task_name || task.name || 'Untitled Task';
  };

  // Helper function to get description based on item type
  const getDescription = (task) => {
    if (task.itemType === 'meeting') {
      return task.notes || task.agenda || task.description || '';
    }
    return task.description || '';
  };

  // Helper function to get task type based on item type
  const getTaskType = (task) => {
    if (task.itemType === 'meeting') {
      return task.dept || 'Meeting';
    }
    if (task.category === 'assigned') {
      return 'Master';
    }
    return task.task_type || task.type || 'Work';
  };

  // Helper function to get due date based on item type
  const getDueDate = (task) => {
    if (task.itemType === 'meeting') {
      return task.date || task.dueDate || '';
    }
    return task.dueDate || task.date || '';
  };

  // Helper function to get timeline based on item type
  const getTimeline = (task) => {
    if (task.itemType === 'meeting') {
      return task.prop_slot || task.timeSlot || '';
    }
    return task.timeline || '';
  };

  // Helper function to get time in minutes based on item type
  const getTimeInMins = (task) => {
    return task.time || '';
  };

  // Helper function to get file link based on item type
  const getFileLink = (task) => {
    if (task.itemType === 'meeting') {
      return null; // Meetings don't typically have file links
    }
    return task.file_link || task.attachments || task.upload || null;
  };


  // Helper function to generate unique keys for React components
  const generateUniqueKey = (task, index) => {
    const taskId = task._id || task.task_id || task.meeting_id || '';
    const itemType = task.itemType || '';
    const timestamp = task.updated_at || task.created_at || '';
    // Create a composite key to ensure uniqueness
    return `${itemType}_${taskId}_${index}_${timestamp}`;
  };

  const filteredTasks = tasks.filter(task => {
    const displayName = getDisplayName(task);
    const description = getDescription(task);

    // Search filter
    if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Type filter (task/meeting)
    if (filter !== 'task' && filter !== 'meeting') return false;
    if (task.itemType !== filter) return false;

    // Task type filter (only for tasks, not meetings)
    if (task.itemType === 'task' && taskTypeFilter && getTaskType(task) !== taskTypeFilter) return false;

    // Status filter
    if (statusFilter && task.status !== statusFilter) return false;

    // Date filter - use task.date instead of created_at
    if (dateFilter === 'all') return true;
    const taskDateValue = task.date || task.created_at || task.createdAt;
    if (!taskDateValue) return false;
    const taskDate = new Date(taskDateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'today') {
      const compareDate = new Date(taskDate);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === today.getTime();
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const compareDate = new Date(taskDate);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate.getTime() === yesterday.getTime();
    } else if (dateFilter === 'past_week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const weekday = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((weekday + 6) % 7));
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      return taskDate >= monday && taskDate <= saturday;
    } else if (dateFilter === 'past_month') {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return taskDate >= first && taskDate <= last;
    }
    return true;
  }).sort((a, b) => {
    // Primary sort: Master tasks (assigned) first, then self tasks
    const isMasterA = a.itemType === 'task' && a.category === 'assigned';
    const isMasterB = b.itemType === 'task' && b.category === 'assigned';

    if (isMasterA && !isMasterB) return -1;
    if (!isMasterA && isMasterB) return 1;

    // Secondary sort: Owner name in ascending order (A-Z)
    const ownerNameA = a.users?.name || 'Unknown';
    const ownerNameB = b.users?.name || 'Unknown';

    if (ownerNameA < ownerNameB) return -1;
    if (ownerNameA > ownerNameB) return 1;

    // Tertiary sort: Latest first (new to old)
    const dateA = new Date(a.updated_at || a.created_at || a.date || 0);
    const dateB = new Date(b.updated_at || b.created_at || b.date || 0);
    return dateB - dateA; // Descending order (newest first)
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="cu-task-wrapper">
        {showFilterBar && (
          <div className="professional-filter-bar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks, meetings, and descriptions..."
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

          <div className="filter-controls">
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.date ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateDropdown(!showDateDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowCategoryDropdown(false);
                  setShowStatusDropdown(false);
                }}
              >
                {getFilterDisplayText('date', activeFilters.date)}
                <FaChevronDown className="dropdown-arrow" />
              </button>
              {showDateDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => { setDateFilter('all'); setDateActive(''); setShowDateDropdown(false); }}>All</div>
                  <div className="dropdown-item" onClick={() => { setDateFilter('today'); setDateActive('today'); setShowDateDropdown(false); }}>Today</div>
                  <div className="dropdown-item" onClick={() => { setDateFilter('yesterday'); setDateActive('yesterday'); setShowDateDropdown(false); }}>Yesterday</div>
                  <div className="dropdown-item" onClick={() => { setDateFilter('past_week'); setDateActive('past_week'); setShowDateDropdown(false); }}>Past week</div>
                  <div className="dropdown-item" onClick={() => { setDateFilter('past_month'); setDateActive('past_month'); setShowDateDropdown(false); }}>Past month</div>
                </div>
              )}
            </div>

            {filter !== 'meeting' && (
              <div className="filter-dropdown">
                <button
                  className={`filter-btn ${activeFilters.tasktype ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTaskTypeDropdown(!showTaskTypeDropdown);
                    setShowDateDropdown(false);
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
            )}

            {filter !== 'meeting' && (
              <div className="filter-dropdown">
                <button
                  className={`filter-btn ${activeFilters.category ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowDateDropdown(false);
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
            )}

            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.status ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowDateDropdown(false);
                  setShowTaskTypeDropdown(false);
                  setShowCategoryDropdown(false);
                }}
              >
                {getFilterDisplayText('status', activeFilters.status)}
                <FaChevronDown className="dropdown-arrow" />
              </button>
              {showStatusDropdown && (
                <div className="dropdown-menu">
                  {filter === 'meeting' ? (
                    <>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Scheduled'); setShowStatusDropdown(false); }}>Scheduled</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Cancelled'); setShowStatusDropdown(false); }}>Cancelled</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('On Hold'); setShowStatusDropdown(false); }}>On Hold</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Re-scheduled'); setShowStatusDropdown(false); }}>Re-Scheduled</div>
                    </>
                  ) : (
                    <>
                      <div className="dropdown-item" onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}>All</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('In Progress'); setShowStatusDropdown(false); }}>In Progress</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                      <div className="dropdown-item" onClick={() => { setStatusFilter('Not Started'); setShowStatusDropdown(false); }}>Not Started</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {setTeamMemberFilter && (filter === 'meeting' || filter === 'task') && (
              <div className="filter-dropdown">
                <button
                  className={`filter-btn ${activeFilters.teammember ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTeamMemberDropdown(!showTeamMemberDropdown);
                    setShowDateDropdown(false);
                    setShowTaskTypeDropdown(false);
                    setShowCategoryDropdown(false);
                    setShowStatusDropdown(false);
                    setShowViewTypeDropdown(false);
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
                      {filter === 'task' ? 'My Tasks' : 'My Meetings'}
                    </div>
                    <div
                      className="dropdown-item"
                      onClick={() => { setViewTypeFilter('all'); setTeamMemberFilter('all'); setShowTeamMemberDropdown(false); }}
                    >
                      All Team Members
                    </div>
                    {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                      <div
                        key={member.user_id}
                        className="dropdown-item"
                        onClick={() => { setViewTypeFilter('team'); setTeamMemberFilter(member.user_id); setShowTeamMemberDropdown(false); }}
                      >
                        {member.name}
                      </div>
                    )) : (
                      <div className="dropdown-item disabled">No team members available</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {setViewTypeFilter && filter !== 'task' && filter !== 'meeting' && (
              <div className="filter-dropdown">
                <button
                  className={`filter-btn ${activeFilters.viewtype ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowViewTypeDropdown(!showViewTypeDropdown);
                    setShowDateDropdown(false);
                    setShowTaskTypeDropdown(false);
                    setShowCategoryDropdown(false);
                    setShowStatusDropdown(false);
                    setShowTeamMemberDropdown(false);
                  }}
                >
                  {getFilterDisplayText('viewtype', activeFilters.viewtype)}
                  <FaChevronDown className="dropdown-arrow" />
                </button>
                {showViewTypeDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => { setViewTypeFilter('self'); setShowViewTypeDropdown(false); }}>Self</div>
                    <div className="dropdown-item" onClick={() => { setViewTypeFilter('team'); setShowViewTypeDropdown(false); }}>Team</div>
                  </div>
                )}
              </div>
            )}


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

          <div className="toggle-container">
            <ToggleSwitch onToggle={setFilter} active={filter === 'task' ? 'Tasks' : 'Meeting'} />
          </div>
        </div>
        )}

        <div className="enhanced-row-container">
          <div className="no-tasks-message">
            <p>
              {isAdminView && !teamMemberFilter
                ? `Choose a team member from the dropdown above to see their ${filter === 'task' ? 'tasks' : 'meetings'}`
                : 'Try adjusting your search parameters or filters'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="cu-task-wrapper">
      {/* Keep existing Professional Filter Bar unchanged */}
      {showFilterBar && (
        <div className="professional-filter-bar">
        {/* Search Bar */}
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks, meetings, and descriptions..."
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
          {/* Date Filter */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${activeFilters.date ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowDateDropdown(!showDateDropdown);
                setShowTaskTypeDropdown(false);
                setShowCategoryDropdown(false);
                setShowStatusDropdown(false);
              }}
            >
              {getFilterDisplayText('date', activeFilters.date)}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showDateDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setDateFilter('all'); setDateActive(''); setShowDateDropdown(false); }}>All</div>
                <div className="dropdown-item" onClick={() => { setDateFilter('today'); setDateActive('today'); setShowDateDropdown(false); }}>Today</div>
                <div className="dropdown-item" onClick={() => { setDateFilter('yesterday'); setDateActive('yesterday'); setShowDateDropdown(false); }}>Yesterday</div>
                <div className="dropdown-item" onClick={() => { setDateFilter('past_week'); setDateActive('past_week'); setShowDateDropdown(false); }}>Past week</div>
                <div className="dropdown-item" onClick={() => { setDateFilter('past_month'); setDateActive('past_month'); setShowDateDropdown(false); }}>Past month</div>
              </div>
            )}
          </div>

          {/* Task Type Filter - Hide for meetings */}
          {filter !== 'meeting' && (
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.tasktype ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTaskTypeDropdown(!showTaskTypeDropdown);
                  setShowDateDropdown(false);
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
          )}

          {/* Category Filter - Hide for meetings */}
          {filter !== 'meeting' && (
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.category ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowDateDropdown(false);
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
          )}

          {/* Status Filter */}
          <div className="filter-dropdown">
            <button
              className={`filter-btn ${activeFilters.status ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowDateDropdown(false);
                setShowTaskTypeDropdown(false);
                setShowCategoryDropdown(false);
              }}
            >
              {getFilterDisplayText('status', activeFilters.status)}
              <FaChevronDown className="dropdown-arrow" />
            </button>
            {showStatusDropdown && (
              <div className="dropdown-menu">
                {filter === 'meeting' ? (
                  <>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Scheduled'); setShowStatusDropdown(false); }}>Scheduled</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Cancelled'); setShowStatusDropdown(false); }}>Cancelled</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('On Hold'); setShowStatusDropdown(false); }}>On Hold</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Re-Scheduled'); setShowStatusDropdown(false); }}>Re-Scheduled</div>
                  </>
                ) : (
                  <>
                    <div className="dropdown-item" onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}>All</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('In Progress'); setShowStatusDropdown(false); }}>In Progress</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Done'); setShowStatusDropdown(false); }}>Done</div>
                    <div className="dropdown-item" onClick={() => { setStatusFilter('Not Started'); setShowStatusDropdown(false); }}>Not Started</div>
                  </>
                )}
              </div>
            )}
          </div>

          {setTeamMemberFilter && (filter === 'meeting' || filter === 'task') && (
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.teammember ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTeamMemberDropdown(!showTeamMemberDropdown);
                  setShowDateDropdown(false);
                  setShowTaskTypeDropdown(false);
                  setShowCategoryDropdown(false);
                  setShowStatusDropdown(false);
                  setShowViewTypeDropdown(false);
                }}
              >
                {getFilterDisplayText('teammember', activeFilters.teammember)}
                <FaChevronDown className="dropdown-arrow" />
              </button>
              {showTeamMemberDropdown && (
                <div className="dropdown-menu">
                  {showMyTasksOption && (
                    <div
                      className="dropdown-item"
                      onClick={() => { setViewTypeFilter('self'); setTeamMemberFilter(''); setShowTeamMemberDropdown(false); }}
                    >
                      {filter === 'task' ? 'My Tasks' : 'My Meetings'}
                    </div>
                  )}
                  <div
                    className="dropdown-item"
                    onClick={() => { setViewTypeFilter('all'); setTeamMemberFilter('all'); setShowTeamMemberDropdown(false); }}
                  >
                    All Team Members
                  </div>
                  {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                    <div
                      key={member.user_id}
                      className="dropdown-item"
                      onClick={() => { setViewTypeFilter('team'); setTeamMemberFilter(member.user_id); setShowTeamMemberDropdown(false); }}
                    >
                      {member.name}
                    </div>
                  )) : (
                    <div className="dropdown-item disabled">No team members available</div>
                  )}
                </div>
              )}
            </div>
          )}

          {setViewTypeFilter && filter !== 'task' && filter !== 'meeting' && (
            <div className="filter-dropdown">
              <button
                className={`filter-btn ${activeFilters.viewtype ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewTypeDropdown(!showViewTypeDropdown);
                  setShowDateDropdown(false);
                  setShowTaskTypeDropdown(false);
                  setShowCategoryDropdown(false);
                  setShowStatusDropdown(false);
                  setShowTeamMemberDropdown(false);
                }}
              >
                {getFilterDisplayText('viewtype', activeFilters.viewtype)}
                <FaChevronDown className="dropdown-arrow" />
              </button>
              {showViewTypeDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => { setViewTypeFilter('self'); setShowViewTypeDropdown(false); }}>Self</div>
                  <div className="dropdown-item" onClick={() => { setViewTypeFilter('team'); setShowViewTypeDropdown(false); }}>Team</div>
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

        {/* Toggle Switch */}
        <div className="toggle-container">
          <ToggleSwitch onToggle={setFilter} active={filter === 'task' ? 'Tasks' : 'Meeting'} />
        </div>
      </div>
      )}

      {/* Table Container */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        overflow: 'hidden',
        marginBottom: '20px',
        marginTop: typeof dashboardViewType !== 'undefined' ? '20px' : (filter === 'meeting' ? '30px' : '25px')
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
              {filter === 'meeting' ? (
                <>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '80px',
                    width: 'auto'
                  }}>Date</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '150px',
                    width: 'auto'
                  }}>Meeting Name</th>
                  {viewTypeFilter === 'all' && (
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'white',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '100px',
                      width: 'auto'
                    }}>Owner</th>
                  )}
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '80px',
                    width: 'auto'
                  }}>Dept</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    width: 'auto'
                  }}>Co Person</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    width: 'auto'
                  }}>Time</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    width: 'auto'
                  }}>Time Slot</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '80px',
                    width: 'auto'
                  }}>Status</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '120px',
                    width: 'auto'
                  }}>Notes</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    minWidth: '60px',
                    width: 'auto'
                  }}>Edit</th>
                </>
              ) : (
                <>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '120px',
                    width: 'auto'
                  }}>Task Name</th>
                  {teamMemberFilter === 'all' && (
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'white',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '100px',
                      width: 'auto'
                    }}>Owner</th>
                  )}
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '90px',
                    width: 'auto'
                  }}>Date</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '90px',
                    width: 'auto'
                  }}>Timeline</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    width: 'auto'
                  }}>Type</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '90px',
                    width: 'auto'
                  }}>Time</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '100px',
                    width: 'auto'
                  }}>Status</th>
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    borderRight: '1px solid #e5e7eb',
                    minWidth: '60px',
                    width: 'auto'
                  }}>Link</th>
                  {teamMemberFilter !== 'all' && (
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'white',
                      borderRight: '1px solid #e5e7eb',
                      minWidth: '100px',
                      width: 'auto'
                    }}>Assign By</th>
                  )}
                  <th style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'white',
                    minWidth: '60px',
                    width: 'auto'
                  }}>Edit</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => (
                <tr key={generateUniqueKey(task, index)} style={{
                  backgroundColor: task.category === 'assigned' ? '#cfe2f3' : (index % 2 === 0 ? '#f8fafc' : 'white'),
                  borderBottom: '1px solid #e2e8f0',
                  height: typeof dashboardViewType !== 'undefined' ? '35px' : 'auto'
                }}>
                  {task.itemType === 'meeting' ? (
                    <>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{formatDate(getDueDate(task)) || 'Not set'}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'left' }}>{getDisplayName(task)}</td>
                      {viewTypeFilter === 'all' && (
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{task.owner_name || 'Unknown'}</td>
                      )}
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{getTaskType(task)}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{task.co_person || 'Not specified'}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: 'bold' }}>{task.time}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{getTimeline(task) || 'Not set'}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: task.status === 'completed' ? '#dcfce7' :
                                         task.status === 'scheduled' ? '#dbeafe' : '#fef3c7',
                          color: task.status === 'completed' ? '#166534' :
                                task.status === 'scheduled' ? '#1e40af' : '#92400e'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{task.notes || task.agenda || task.description || 'No notes'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', width: '40px', minWidth: '40px' }}>
                        <FaEllipsisV
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === index ? null : index);
                          }}
                        />
                        {menuOpen === index && (
                          <div style={{
                            position: 'absolute',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            marginTop: '5px'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const today = new Date().toISOString().split('T')[0];
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                const yesterdayStr = yesterday.toISOString().split('T')[0];
                                const taskDate = task.date ? new Date(task.date).toISOString().split('T')[0] : null;
                                const isBeforeYesterday = taskDate && taskDate < yesterdayStr;
                                if (isBeforeYesterday && userRole !== 'hod' && userRole !== 'HOD') {
                                  alert(`You can't edit tasks from before yesterday`);
                                  setMenuOpen(null);
                                  return;
                                }
                                onEdit(task);
                                setMenuOpen(null);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                            >
                              Edit Item
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'left' }}>{getDisplayName(task)}</td>
                      {teamMemberFilter === 'all' && (
                        <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center' }}>{task.users?.name || 'Unknown'}</td>
                      )}
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', whiteSpace: 'nowrap' }}>{formatDate(getDueDate(task)) || 'Not set'}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', whiteSpace: 'nowrap' }}>{getTimeline(task) ? formatDate(getTimeline(task)) : 'Not set'}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', whiteSpace: 'nowrap' }}>{getTaskType(task)}</td>
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', whiteSpace: 'nowrap' }}>{getTimeInMins(task) || 'Not set'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: task.status === 'completed' ? '#dcfce7' :
                                         task.status === 'in-progress' ? '#dbeafe' : '#fef3c7',
                          color: task.status === 'completed' ? '#166534' :
                                task.status === 'in-progress' ? '#1e40af' : '#92400e'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center' }}>
                        {getFileLink(task) ? (
                          <a
                            href={getFileLink(task)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6' }}
                            onClick={(e) => e.stopPropagation()}
                            title="Open link"
                          >
                            <FaExternalLinkAlt style={{ fontSize: '14px' }} />
                          </a>
                        ) : 'NA'}
                      </td>
                      {teamMemberFilter !== 'all' && (
                        <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center' }}>
                          {task.category === 'self' && viewTypeFilter !== 'all' ? 'Self' : (task.assigned_by_user?.name || task.users?.name || 'Unknown')}
                        </td>
                      )}
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <FaEllipsisV
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === index ? null : index);
                          }}
                        />
                        {menuOpen === index && (
                          <div style={{
                            position: 'absolute',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 1000,
                            marginTop: '5px'
                          }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const today = new Date().toISOString().split('T')[0];
                                const yesterday = new Date();
                                yesterday.setDate(yesterday.getDate() - 1);
                                const yesterdayStr = yesterday.toISOString().split('T')[0];
                                const taskDate = task.date ? new Date(task.date).toISOString().split('T')[0] : null;
                                const isBeforeYesterday = taskDate && taskDate < yesterdayStr;
                                if (isBeforeYesterday && userRole !== 'hod' && userRole !== 'HOD') {
                                  alert(`You can't edit tasks from before yesterday`);
                                  setMenuOpen(null);
                                  return;
                                }
                                onEdit(task);
                                setMenuOpen(null);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                            >
                              Edit Item
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // For TaskList, we need to pass the taskId to parent component
                                // This will need to be handled by the parent component (Home.js)
                                if (onViewHistory) {
                                  onViewHistory(task);
                                }
                                setMenuOpen(null);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 16px',
                                border: 'none',
                                background: 'none',
                                textAlign: 'left',
                                cursor: 'pointer'
                              }}
                            >
                              View History
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={filter === 'meeting' ? (viewTypeFilter === 'all' ? 10 : 9) : 9} style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  {isAdminView && !teamMemberFilter
                    ? `Select a team member to view their ${filter === 'task' ? 'tasks' : 'meetings'}`
                    : `No ${filter === 'task' ? 'tasks' : 'meetings'} found`
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}