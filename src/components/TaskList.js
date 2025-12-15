import React, { useState, useEffect } from "react";
import "./TaskList.css";
import ToggleSwitch from "./ToggleSwitch";
import {
  FaUserCircle,
  FaTimes,
  FaEllipsisV,
  FaSearch,
  FaChevronDown,
  FaCalendarAlt,
  FaClock,
  FaBuilding,
  FaUsers,
  FaFileAlt,
  FaCheckCircle,
  FaPlayCircle,
  FaPauseCircle,
  FaCircle
} from "react-icons/fa";
import { FiFlag } from "react-icons/fi";
import { RiCheckboxBlankCircleLine } from "react-icons/ri";

export default function TaskList({ tasks, onEdit, onViewDetails, onDelete, filter, setFilter, dateFilter, setDateFilter, taskTypeFilter, setTaskTypeFilter, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateActive, setDateActive] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    date: '',
    tasktype: '',
    category: '',
    status: ''
  });
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-dropdown') && !event.target.closest('.btn')) {
        setShowDateDropdown(false);
        setShowTaskTypeDropdown(false);
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
      }
      if (!event.target.closest('.task-menu') && !event.target.closest('.menu-icon')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Sync activeFilters with filter props
  useEffect(() => {
    setActiveFilters({
      date: dateFilter !== 'all' ? dateFilter : '',
      tasktype: taskTypeFilter,
      category: categoryFilter,
      status: statusFilter
    });
  }, [dateFilter, taskTypeFilter, categoryFilter, statusFilter]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchQuery ||
           (dateFilter && dateFilter !== 'all') ||
           taskTypeFilter ||
           statusFilter ||
           categoryFilter;
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setTaskTypeFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setDateActive('');
  };

  // Helper function to get display text for filters
  const getFilterDisplayText = (filterType, value) => {
    if (!value) return filterType === 'date' ? 'Date' :
                      filterType === 'tasktype' ? 'Task Type' :
                      filterType === 'category' ? 'Category' : 'Status';
    
    if (value === 'all') return 'All';
    
    const displayMap = {
      date: { 'today': 'Today', 'yesterday': 'Yesterday', 'past_week': 'Past week', 'past_month': 'Past month' },
      tasktype: { 'Fixed': 'Fixed', 'Variable': 'Variable', 'HOD Assigned': 'HOD Assigned' },
      category: { 'self': 'Self', 'assigned': 'Assigned', 'all': 'All' },
      status: { 'In Progress': 'In Progress', 'Done': 'Done', 'Not Started': 'Not Started', 'Scheduled': 'Scheduled', 'Cancelled': 'Cancelled', 'On Hold': 'On Hold', 'Re-Scheduled': 'Re-Scheduled', 'all': 'All' }
    };
    
    return displayMap[filterType]?.[value] || value;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
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

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('completed')) return <FaCheckCircle />;
    if (statusLower.includes('progress')) return <FaPlayCircle />;
    if (statusLower.includes('hold') || statusLower.includes('pending')) return <FaPauseCircle />;
    return <FaCircle />;
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
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="cu-task-wrapper">
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

        <div className="enhanced-row-container">
          <div className="no-tasks-message">
            <FaFileAlt className="no-tasks-icon" />
            <h3>No {filter === 'task' ? 'tasks' : 'meetings'} found</h3>
            <p>Try adjusting your search parameters or filters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cu-task-wrapper">
      {/* Keep existing Professional Filter Bar unchanged */}
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

      {/* BEAUTIFUL ROW-BASED TASK LIST */}
      <div className="enhanced-row-container">
        {/* Enhanced Header Row - Dynamic based on filter */}
        <div className="enhanced-row-header">
          {filter === 'meeting' ? (
            <>
              <div className="col-date">Date</div>
              <div className="col-task">Meeting Name</div>
              <div className="col-type">Dept</div>
              <div className="col-assignee">Coperson</div>
              <div className="col-time-mins">Time(in mins)</div>
              <div className="col-timeline">Time Slot</div>
              <div className="col-status">Status</div>
              <div className="col-link">Notes</div>
              <div className="col-actions"></div>
            </>
          ) : (
            <>
              <div className="col-date">Date</div>
              <div className="col-timeline">Timeline</div>
              <div className="col-task">Task Name</div>
              <div className="col-time-mins">Time(in mins)</div>
              <div className="col-type">Type</div>
              <div className="col-status">Status</div>
              <div className="col-link">Link</div>
              <div className="col-assignee">Assignee</div>
              <div className="col-actions"></div>
            </>
          )}
        </div>

        {/* Enhanced Task Rows */}
        {filteredTasks.map((task, i) => (
          <div 
            key={generateUniqueKey(task, i)} 
            className={`enhanced-task-row ${task.itemType === 'meeting' ? 'meeting-row' : 'task-row'}`}
            onClick={() => onEdit(task)}
          >
            {task.itemType === 'meeting' ? (
              <>
                {/* Date Column */}
                <div className="col-date">
                  <div className="date-info">
                    <FaCalendarAlt className="date-icon" />
                    <span className="date-text">{formatDate(getDueDate(task)) || 'Not set'}</span>
                  </div>
                </div>

                {/* Meeting Name Column */}
                <div className="col-task">
                  <div className="task-title-section">
                    <div className="task-title-content">
                      <h4 className="task-title">{getDisplayName(task)}</h4>
                    </div>
                  </div>
                </div>

                {/* Dept Column */}
                <div className="col-type">
                  <div className="type-info">
                    <FaBuilding className="type-icon" />
                    <span className="type-text">{getTaskType(task)}</span>
                  </div>
                </div>

                {/* Coperson Column */}
                <div className="col-assignee">
                  <div className="assignee-info">
                    <FaUsers className="assignee-icon" />
                    <span className="assignee-text">{task.co_person || 'Not specified'}</span>
                  </div>
                </div>

                {/* Time(in mins) Column */}
                <div className="col-time-mins">
                  <div className="time-mins-info">
                    <FaClock className="time-mins-icon" />
                    <span className="time-mins-text" style={{ color: 'black', fontWeight: 'bold' }}>
                      {console.log('Task', task.task_id, 'time:', task.time) || task.time}
                    </span>
                  </div>
                </div>

                {/* Time Slot Column */}
                <div className="col-timeline">
                  <div className="timeline-info">
                    <FaClock className="timeline-icon" />
                    <span className="timeline-text">{getTimeline(task) || 'Not set'}</span>
                  </div>
                </div>

                {/* Status Column */}
                <div className="col-status">
                  <div className="status-badge">
                    <span className="status-icon">{getStatusIcon(task.status)}</span>
                    <span className="status-text">{task.status || 'Not Started'}</span>
                  </div>
                </div>

                {/* Notes Column */}
                <div className="col-link">
                  <div className="link-info">
                    <FaFileAlt className="link-icon" />
                    <span className="link-text">{task.notes || task.agenda || task.description || 'No notes'}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Date Column */}
                <div className="col-date">
                  <div className="date-info">
                    <FaCalendarAlt className="date-icon" />
                    <span className="date-text">{formatDate(getDueDate(task)) || 'Not set'}</span>
                  </div>
                </div>

                {/* Timeline Column */}
                <div className="col-timeline">
                  <div className="timeline-info">
                    <FaClock className="timeline-icon" />
                    <span className="timeline-text">{getTimeline(task) || 'Not set'}</span>
                  </div>
                </div>

                {/* Task Name Column */}
                <div className="col-task">
                  <div className="task-title-section">
                    <div className="task-title-content">
                      <h4 className="task-title">{getDisplayName(task)}</h4>
                    </div>
                  </div>
                </div>

                {/* Time(in mins) Column */}
                <div className="col-time-mins">
                  <div className="time-mins-info">
                    <FaClock className="time-mins-icon" />
                    <span className="time-mins-text">{getTimeInMins(task) || 'Not set'}</span>
                  </div>
                </div>

                {/* Type Column */}
                <div className="col-type">
                  <div className="type-info">
                    <FaBuilding className="type-icon" />
                    <span className="type-text">{getTaskType(task)}</span>
                  </div>
                </div>

                {/* Status Column */}
                <div className="col-status">
                  <div className="status-badge">
                    <span className="status-icon">{getStatusIcon(task.status)}</span>
                    <span className="status-text">{task.status || 'Not Started'}</span>
                  </div>
                </div>

                {/* Link Column */}
                <div className="col-link">
                  <div className="link-info">
                    {getFileLink(task) ? (
                      <a
                        href={getFileLink(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                        onClick={(e) => e.stopPropagation()}
                        title="Open file link"
                      >
                        <FaFileAlt className="link-icon" />
                        <span className="link-text">Open</span>
                      </a>
                    ) : (
                      <span className="no-link">
                        <FaFileAlt className="link-icon" />
                        <span className="link-text">No link</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignee Column */}
                <div className="col-assignee">
                  <div className="assignee-info">
                    <FaUsers className="assignee-icon" />
                    <span className="assignee-text">Self</span>
                  </div>
                </div>
              </>
            )}

            {/* Actions Column - Just 3 dots */}
            <div className="col-actions">
              <div className="actions-container">
                {/* Menu */}
                <div className="menu-container">
                  <FaEllipsisV
                    className="menu-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === i ? null : i);
                    }}
                  />
                  {menuOpen === i && (
                    <div className="task-menu">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(task); setMenuOpen(null); }}>
                        Edit Item
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onViewDetails(task); setMenuOpen(null); }}>
                        View Information
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete this ${task.itemType}?`)) {
                            onDelete(task);
                          }
                          setMenuOpen(null);
                        }}
                        style={{ color: '#dc3545' }}
                      >
                        Delete Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}