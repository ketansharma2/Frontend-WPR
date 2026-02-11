 import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
 import { useNavigate, useLocation } from 'react-router-dom';
 import Sidebar from './Sidebar';
 import Header from './Header';
 import TaskList from './TaskList';
 import WeeklyTemplate from './WeeklyTemplate';
 import TaskPopup from './TaskPopup';
 import TaskDetails from './TaskDetails';
 import ProfilePanel from './ProfilePanel';
 import TaskHistoryPopup from './TaskHistoryPopup';
 import HodRnR from './HodRandR';
import HodProjection from './HodProjection';
 import { FaChevronDown, FaTimes, FaExternalLinkAlt, FaEllipsisV } from 'react-icons/fa';
 import { api } from '../config/api';
 import './Home.css';
 import './TaskList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const HodHome = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current page from URL path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/home' || path === '/hod/home') return 'home';
    if (path === '/tasks' || path === '/hod/tasks') return 'tasks';
    if (path === '/meetings' || path === '/hod/meetings') return 'meetings';
    if (path === '/calendar' || path === '/hod/calendar') return 'calendar';
    if (path === '/rnr' || path === '/hod/rnr') return 'rnr';
    if (path === '/projection' || path === '/hod/projection') return 'projection';
    return 'home'; // default
  };

  const currentPage = getCurrentPage();
  const [userProfile, setUserProfile] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('task');
  const [taskDateFilter, setTaskDateFilter] = useState('all');
  const [meetingDateFilter, setMeetingDateFilter] = useState('all');
  const [weeklyDateFilter, setWeeklyDateFilter] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(() => {
    // Load category filter from localStorage or default to empty string ('all')
    const saved = localStorage.getItem('hodCategoryFilter');
    return saved !== null ? saved : '';
  });

  // Custom setter for categoryFilter that saves to localStorage
  const handleSetCategoryFilter = (value) => {
    setCategoryFilter(value);
    localStorage.setItem('hodCategoryFilter', value);
  };
  const [weeklyTaskTypeFilter, setWeeklyTaskTypeFilter] = useState('');
  const [weeklyStatusFilter, setWeeklyStatusFilter] = useState('');
  const [weeklyCategoryFilter, setWeeklyCategoryFilter] = useState('');
  const [weeklyViewTypeFilter, setWeeklyViewTypeFilter] = useState('self');
  const [weeklyTeamMemberFilter, setWeeklyTeamMemberFilter] = useState('');
  const [taskViewTypeFilter, setTaskViewTypeFilter] = useState('self'); // 'self' or 'team' for tasks
  const [taskTeamMemberFilter, setTaskTeamMemberFilter] = useState(''); // for team view tasks
  const [meetingViewTypeFilter, setMeetingViewTypeFilter] = useState('self'); // 'self' or 'team' for meetings
  const [meetingTeamMemberFilter, setMeetingTeamMemberFilter] = useState(''); // for team view meetings
  const [teamMembers, setTeamMembers] = useState([]); // list of team members
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksPageTasks, setTasksPageTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [dashboardTasks, setDashboardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [dashboardViewType, setDashboardViewType] = useState('self'); // 'self' or 'team' for dashboard
  const [dashboardDateFilter, setDashboardDateFilter] = useState('today');
  const [dashboardTaskTypeFilter, setDashboardTaskTypeFilter] = useState('');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('');
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState('');
  const [dashboardTeamMemberFilter, setDashboardTeamMemberFilter] = useState('');
  const [showDashboardDateDropdown, setShowDashboardDateDropdown] = useState(false);
  const [showDashboardTaskTypeDropdown, setShowDashboardTaskTypeDropdown] = useState(false);
  const [showDashboardStatusDropdown, setShowDashboardStatusDropdown] = useState(false);
  const [showDashboardCategoryDropdown, setShowDashboardCategoryDropdown] = useState(false);
  const [showDashboardTeamMemberDropdown, setShowDashboardTeamMemberDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  const [isRemarksRequired, setIsRemarksRequired] = useState(null);
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [yesterdayMeetings, setYesterdayMeetings] = useState([]);
  const [yesterdayDate, setYesterdayDate] = useState(null);

  // Fetch HOD data from backend
  async function fetchHodData(taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, category = 'all', dateFilter = 'all', showLoading = true) {
  
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      // Fetch tasks with HOD-specific filter
      let viewTasksOf = taskViewType;
      let targetUserId = taskViewType === 'team' && taskTeamMember && taskTeamMember !== 'all' ? taskTeamMember : null;
      if (taskTeamMember === 'all') {
        viewTasksOf = 'all';
        targetUserId = null;
      }

      const tasksResponse = await fetch(`${API_BASE_URL}/hod/tasks/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
           user_id: profile.user_id,
           view_tasks_of: viewTasksOf,
           target_user_id: targetUserId,
           date_filter: dateFilter,
           task_type: 'all',
           status: 'all',
           category
         })
      });

      // Fetch meetings with HOD-specific filter
      let viewType = meetingViewType;
      let targetUserIdMeetings = meetingViewType === 'team' && meetingTeamMember && meetingTeamMember !== 'all' ? meetingTeamMember : null;
      if (meetingTeamMember === 'all') {
        viewType = 'all';
        targetUserIdMeetings = null;
      }

      const meetingsResponse = await fetch(`${API_BASE_URL}/hod/meetings/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          view_type: viewType,
          target_user_id: targetUserIdMeetings,
          date_filter: 'all',
          status: 'all'
        })
      });

      if (meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json();
        console.log('Meetings data:', meetingsData);

        let allTasks = [];

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          console.log('Tasks data:', tasksData);

          // Combine tasks and meetings into a single array - master_tasks first, then self_tasks
          // Note: history_tasks is NOT included here as it's only shown on the history page
          allTasks = [
            ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users })),
            ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: task.itemType || 'task', category: 'self', owner_name: task.users?.name || 'Unknown' })),
            ...(meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting', owner_name: meeting.owner_name || 'Unknown' }))
          ];
        } else {
          // If tasks failed, still show meetings
          console.warn('Tasks API failed, showing only meetings');
          allTasks = (meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting' }));
        }

        console.log('Combined tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description, type: t.itemType, date: t.date })));

        // Sort tasks by date descending only
        allTasks.sort((a, b) => {
          if (a.itemType === 'meeting' || b.itemType === 'meeting') return 0; // Don't sort meetings
          const aDate = a.date || '';
          const bDate = b.date || '';
          return bDate.localeCompare(aDate);
        });

        // For HOD, backend already filters based on viewType, so use all returned tasks
        const filteredTasks = allTasks;

        setTasks(filteredTasks);
        setPendingTasks(filteredTasks.filter(t => t.category === 'assigned' && t.status !== 'Not Started' && t.status !== 'In Progress'));
      } else {
        const meetingsError = await meetingsResponse.json();

        // Don't log or set error for expected 400 when team selected but no member chosen
        if (meetingsResponse.status === 400 && meetingViewTypeFilter === 'team' && !meetingTeamMemberFilter) {
          console.log('Expected: Team view selected without choosing a team member');
        } else {
          console.error('Meetings error:', meetingsError);
          setError("Failed to fetch meetings from server");
        }
        setLoading(false); // Ensure loading is set to false on error
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error fetching tasks:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  };

  // Fetch dashboard tasks data
  const fetchDashboardTasks = async (taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, category = 'all', dateFilter = 'all', showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      // Fetch tasks with HOD-specific filter
      let viewTasksOf = taskViewType;
      let targetUserId = taskViewType === 'team' && taskTeamMember && taskTeamMember !== 'all' ? taskTeamMember : null;
      if (taskTeamMember === 'all') {
        viewTasksOf = 'all';
        targetUserId = null;
      }

      const tasksResponse = await fetch(`${API_BASE_URL}/hod/tasks/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          view_tasks_of: viewTasksOf,
          target_user_id: targetUserId,
          date_filter: dateFilter,
          task_type: 'all',
          status: 'all',
          category
        })
      });

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();

        // Combine tasks - master_tasks first, then self_tasks
        // Note: history_tasks is NOT included here as it's only shown on the history page
        const allTasks = [
          ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users })),
          ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self', owner_name: task.users?.name || 'Unknown' }))
        ];

        console.log('Combined dashboard tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));

        // For HOD, backend already filters based on viewType, so use all returned tasks
        const filteredTasks = allTasks;

        console.log('Dashboard tasks received:', filteredTasks.length, 'items');
        setDashboardTasks(filteredTasks);
      } else {
        console.error('Dashboard tasks API failed');
        setError("Failed to fetch dashboard tasks from server");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error fetching dashboard tasks:", err);
    } finally {
      if (showLoading) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  };

  // Fetch team members for the dropdown
  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/hod/meetings/team-members/${profile.dept}/${profile.user_id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.team_members || []);
      } else {
        console.error('Failed to fetch team members');
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  // Fetch HOD dashboard data
  const fetchHodDashboardData = async (viewType = 'self', targetUserId = null) => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/hod/dashboard/data`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          view_type: viewType,
          target_user_id: targetUserId,
          date_filter: dashboardDateFilter
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyStats(data.monthly_stats);
        setTodayTasks(data.today.tasks || []);
        setTodayMeetings(data.today.meetings || []);
        setPendingTasks(data.pending_tasks || []);
        console.log('HOD dashboard data loaded:', data);
      } else {
        console.error('Failed to fetch HOD dashboard data');
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching HOD dashboard data:", err);
      setError("Network error while loading dashboard");
    }
  };

  // Auto-populate fixed tasks for team members
  const autoPopulateFixedTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/hod/fixed-tasks/auto-populate`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('HOD Auto-populate result:', result);
        if (result.populated_tasks?.length > 0) {
          alert(`✅ Success: ${result.populated_tasks.length} fixed tasks populated for team members today!`);
        }
        // Refresh dashboard data
        fetchHodDashboardData();
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error auto-populating fixed tasks:', error);
      alert('❌ Failed: Network error while auto-populating tasks');
    }
  };

  // Fetch last working day's tasks and meetings for remarks check
  const fetchLastWorkingDayData = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem("profile"));
      if (!profile?.user_id) return;

      // For HOD, we need to check remarks for all team members
      const workingDayData = await api.getLastWorkingDayTasks(profile.user_id);

      if (workingDayData.found) {
        // Get tasks from the response (only self_tasks now)
        const tasks = workingDayData.tasks;

        // Fetch meetings for the same date
        const meetingsData = await api.getMeetingsByDate(profile.user_id, workingDayData.date);
        const meetings = meetingsData.meetings || [];

        setYesterdayTasks(tasks);
        setYesterdayMeetings(meetings);
        setYesterdayDate(workingDayData.date);

        // Check if any yesterday's tasks have unfilled remarks
        const hasUnfilledRemarks = tasks.some(task => !task.remarks || task.remarks.trim() === '');
        setIsRemarksRequired(hasUnfilledRemarks);

        console.log(`Found last working day: ${workingDayData.date} (${workingDayData.days_back} days back)`);
        console.log(`Tasks: ${tasks.length}, Meetings: ${meetings.length}, Remarks required: ${hasUnfilledRemarks}`);
      } else {
        // No working days found, allow auto-populate
        setYesterdayTasks([]);
        setYesterdayMeetings([]);
        setYesterdayDate(null);
        setIsRemarksRequired(false);
        console.log("No working days found in last 30 days");
      }
    } catch (err) {
      console.error("Error fetching last working day data:", err);
      setYesterdayTasks([]);
      setYesterdayMeetings([]);
      setYesterdayDate(null);
      setIsRemarksRequired(false); // Allow auto-populate even on error
    }
  };

  // Fetch weekly report data
  const fetchWeeklyData = useCallback(async (filters = {}, showLoading = true) => {
    try {
      if (showLoading) setWeeklyLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/hod/weekly`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          ...filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWeeklyTasks(data.tasks || []);
      } else {
        const errorData = await response.json();
        console.error('Weekly data error:', errorData);
        setError("Failed to fetch weekly report data");
      }
    } catch (err) {
      setError("Network error while fetching weekly data.");
      console.error("Error fetching weekly data:", err);
    } finally {
      if (showLoading) setWeeklyLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get user profile from localStorage
    const profile = localStorage.getItem("profile");
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch (error) {
        console.error("Error parsing user profile:", error);
        setError("Error loading user profile");
      }
    } else {
      setError("No user profile found");
    }
    fetchHodData('self', '', 'self', '', categoryFilter || 'self', taskDateFilter, true);
    fetchHodDashboardData('self'); // Fetch dashboard data on mount
    fetchTeamMembers(); // Fetch team members on mount
  }, []);

  // Refetch tasks when category filter changes
  useEffect(() => {
    if (userProfile) {
      const cat = categoryFilter === '' ? 'all' : categoryFilter;
      fetchHodData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, cat, false);
    }
  }, [categoryFilter, userProfile]);

  // Refetch data when any filter changes
  useLayoutEffect(() => {
    if (userProfile && (currentPage === 'tasks' || currentPage === 'meetings')) {
      setLoading(false); // Ensure loading is false for filter changes
      setTasks([]); // Clear current tasks to prevent showing old data
      // Only fetch meetings if team view has a selected member
      if (!(meetingViewTypeFilter === 'team' && !meetingTeamMemberFilter)) {
        fetchHodData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, categoryFilter || 'self', taskDateFilter, false);
      }
      if (taskViewTypeFilter === 'team' || meetingViewTypeFilter === 'team' || taskViewTypeFilter === 'all' || meetingViewTypeFilter === 'all') {
        fetchTeamMembers();
      }
    }
  }, [taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, taskDateFilter, userProfile, currentPage]);

  // Refetch dashboard data when dashboard filters change
  useEffect(() => {
    if (userProfile) {
      const viewType = dashboardViewType;
      const targetUserId = dashboardViewType === 'team' ? dashboardTeamMemberFilter : null;
      fetchHodDashboardData(viewType, targetUserId);
    }
  }, [dashboardViewType, dashboardTeamMemberFilter, userProfile]);

  // Refetch dashboard data when date filter changes
  useEffect(() => {
    if (userProfile) {
      const viewType = dashboardViewType;
      const targetUserId = dashboardViewType === 'team' ? dashboardTeamMemberFilter : null;
      fetchHodDashboardData(viewType, targetUserId);
    }
  }, [dashboardDateFilter, userProfile]);

  // Refetch tasks and meetings data when dashboard view type or team member changes
  useEffect(() => {
    if (userProfile) {
      const taskViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
      const taskTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
      const meetingViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
      const meetingTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
      fetchHodData(taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, 'all', false);
    }
  }, [dashboardViewType, dashboardTeamMemberFilter, userProfile]);

   // Refetch tasks and meetings data when dashboard view type or team member changes
    useEffect(() => {
      if (userProfile) {
        setDashboardTasks([]); // Clear tasks to show loading state
        const taskViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
        const taskTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
        const meetingViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
        const meetingTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
        fetchDashboardTasks(taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, 'all', dashboardDateFilter, false);
      }
    }, [dashboardViewType, dashboardTeamMemberFilter, dashboardDateFilter, userProfile]);

   // Check remarks requirement when dashboard loads
   useEffect(() => {
     if (userProfile?.user_id && currentPage === 'home' && isRemarksRequired === null) {
       fetchLastWorkingDayData();
     }
   }, [userProfile, currentPage, isRemarksRequired]);

   // Auto-populate fixed tasks when dashboard loads and remarks are checked
   useEffect(() => {
     if (userProfile?.user_id && currentPage === 'home' && !hasAutoPopulated && isRemarksRequired === false) {
       autoPopulateFixedTasks();
       setHasAutoPopulated(true);
     }
   }, [userProfile, currentPage, hasAutoPopulated, isRemarksRequired]);




  // Sync filter with current page on page changes
  useEffect(() => {
    if (currentPage === 'tasks' && filter !== 'task') {
      setFilter('task');
    } else if (currentPage === 'meetings' && filter !== 'meeting') {
      setFilter('meeting');
    }
  }, [currentPage, filter]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowDashboardDateDropdown(false);
        setShowDashboardTaskTypeDropdown(false);
        setShowDashboardStatusDropdown(false);
        setShowDashboardCategoryDropdown(false);
        setShowDashboardTeamMemberDropdown(false);
      }
      if (!event.target.closest('.task-menu') && !event.target.closest('.menu-icon')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  const openPopup = () => { setIsPopupOpen(true); };
  const closePopup = () => {
    setIsPopupOpen(false);
    setEditingTask(null);
    setError(''); // Clear any errors when closing popup
  };

  const openAssignPopup = () => { setIsAssignPopupOpen(true); };
  const closeAssignPopup = () => {
    setIsAssignPopupOpen(false);
    setError(''); // Clear any errors when closing popup
  };

  const assignTask = async (task) => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      const apiData = {
        user_id: profile.user_id,
        assigned_by: profile.user_id,
        assigned_to: task.assignTo,
        date: task.date,
        timeline: task.timeline,
        task_name: task.taskName,
        status: task.status,
        assignee_remarks: task.remarks,
        upload_closing: '',
        remarks: '',
        parameter: task.parameter,
        end_goal: task.endGoal
      };

      const response = await fetch(`${API_BASE_URL}/hod/assign/create`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task assigned successfully:', result);
        alert('Task assigned successfully');
        setError(''); // Clear any errors
        // Optionally refresh tasks or show success message
      } else {
        const errorData = await response.json();
        setError(`Failed to assign task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error while assigning task: ${err.message}`);
    }
    closeAssignPopup();
  };

  const addTask = async (task) => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!profile?.user_id) {
        setError("User profile not found");
        return;
      }

      let apiData;
      let endpoint = task.itemType === 'meeting' ? 'meetings' : 'tasks';

      if (task.itemType === 'meeting') {
        // Map meeting fields to backend format
        apiData = {
          user_id: profile.user_id,
          meeting_name: task.name,
          date: task.date,
          dept: task.dept,
          co_person: task.co_person,
          time: task.time_in_mins,
          prop_slot: task.prop_slot,
          status: task.status || 'Scheduled',
          notes: task.notes
        };
      } else {
        // Map task fields to backend format - Include description
        console.log('Task object received:', task); // Debug log
        console.log('Description from task:', task.description); // Debug log

        apiData = {
          user_id: profile.user_id,
          date: task.dueDate,
          timeline: task.timeline,
          task_name: task.name,
          time: task.time,
          task_type: task.type || 'work',
          status: task.status || 'pending',
          file_link: task.attachments,
          description: task.description || '', // Add description field
          remarks: task.remarks
        };

        console.log('API data being sent:', apiData); // Debug log
      }

      console.log('Creating task/meeting with data:', apiData);

      const response = await fetch(`${API_BASE_URL}/${endpoint}/create`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task/meeting created successfully:', result);

        // Add or update the task in local state immediately for instant UI update
        const newTask = {
          ...result.task || result.meeting,
          itemType: task.itemType
        };

        setTasks(prevTasks => {
          const existingIndex = prevTasks.findIndex(t =>
            (t.task_id && newTask.task_id && t.task_id === newTask.task_id) ||
            (t.meeting_id && newTask.meeting_id && t.meeting_id === newTask.meeting_id)
          );
          if (existingIndex !== -1) {
            // Replace existing
            const updatedTasks = [...prevTasks];
            updatedTasks[existingIndex] = newTask;
            return updatedTasks;
          } else {
            // Add new
            return [...prevTasks, newTask];
          }
        });

        if (task.itemType === 'task') setFilter('task');
        else if (task.itemType === 'meeting') setFilter('meeting');
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        setError(`Failed to create ${task.itemType}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError(`Network error while creating ${task.itemType}: ${err.message}`);
    }
  };

  const editTask = (task) => {
    setEditingTask(task);
    if (task.category === 'assigned') {
      setIsAssignPopupOpen(true);
    } else {
      setIsPopupOpen(true);
    }
    // Don't force page change - let the current page stay as is
    // setCurrentPage('tasks');
  };

  // Helper function to get the correct ID for API calls
  const getTaskIdForAPI = (task) => {
    // For tasks, prefer task_id, for meetings prefer meeting_id
    if (task.itemType === 'meeting') {
      return task.meeting_id || task._id;
    }
    // For tasks, prefer task_id over _id for consistency
    return task.task_id || task._id;
  };

  const updateTask = async (updatedTask) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = updatedTask.itemType === 'meeting' ? 'meetings' : (updatedTask.category === 'assigned' ? 'hod/tasks/assigned' : 'hod/tasks');

      // Get the correct ID for the API call
      const taskIdForAPI = getTaskIdForAPI(updatedTask);

      if (!taskIdForAPI) {
        setError(`Cannot update ${updatedTask.itemType}: No valid ID found`);
        return;
      }

      let apiData;
      if (updatedTask.itemType === 'meeting') {
        // Map meeting fields to backend format for update
        apiData = {
          meeting_name: updatedTask.meeting_name || updatedTask.name,
          date: updatedTask.date,
          dept: updatedTask.dept || updatedTask.department,
          co_person: updatedTask.co_person || updatedTask.participants,
          time: updatedTask.time,
          prop_slot: updatedTask.prop_slot || updatedTask.timeSlot,
          status: updatedTask.status,
          notes: updatedTask.notes || updatedTask.agenda
        };
      } else if (updatedTask.category === 'assigned') {
        // Map assigned task fields to backend format for update
        apiData = {
          date: updatedTask.date,
          timeline: updatedTask.timeline,
          task_name: updatedTask.task_name,
          parameter: updatedTask.parameter,
          end_goal: updatedTask.end_goal,
          assignee_remarks: updatedTask.assignee_remarks,
          status: updatedTask.status,
          upload_closing: updatedTask.upload_closing,
          remarks: updatedTask.remarks
        };
      } else {
        // Map self task fields to backend format for update
        apiData = {
          user_id: userProfile.user_id,
          date: updatedTask.date || updatedTask.dueDate,
          timeline: updatedTask.timeline,
          task_name: updatedTask.task_name,
          time: updatedTask.time_in_mins,
          task_type: updatedTask.task_type,
          status: updatedTask.status,
          file_link: updatedTask.file_link,
          remarks: updatedTask.remarks
        };
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${taskIdForAPI}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      if (response.ok) {
        const result = await response.json();

        // Update the local tasks state immediately for instant UI update
        const updatedTaskData = result.task || result.meeting || updatedTask;

        setTasks(prevTasks => {
          return prevTasks.map(task => {
            // More robust task matching logic
            const isMatch =
              (task._id && updatedTask._id && task._id === updatedTask._id) ||
              (task.task_id && updatedTask.task_id && task.task_id === updatedTask.task_id) ||
              (task.meeting_id && updatedTask.meeting_id && task.meeting_id === updatedTask.meeting_id) ||
              // Fallback matching for different ID field names
              (task._id && updatedTaskData._id && task._id === updatedTaskData._id) ||
              (task.task_id && updatedTaskData.task_id && task.task_id === updatedTaskData.task_id) ||
              (task.meeting_id && updatedTaskData.meeting_id && task.meeting_id === updatedTaskData.meeting_id);

            if (isMatch) {
              return {
                ...task,
                ...updatedTask,
                ...updatedTaskData,
                updated_at: new Date()
              };
            }
            return task;
          });
        });

        setEditingTask(null);
        setIsPopupOpen(false); // Close popup after successful update
        setIsAssignPopupOpen(false); // Close assign popup after successful update
        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        setError(`Failed to update ${updatedTask.itemType}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error while updating ${updatedTask.itemType}: ${err.message}`);
    }
  };

  const deleteTask = async (taskToDelete) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = taskToDelete.itemType === 'meeting' ? 'meetings' : 'tasks';

      // Get the correct ID for the API call
      const taskIdForAPI = getTaskIdForAPI(taskToDelete);
      console.log('Deleting task/meeting with ID:', taskIdForAPI);

      const response = await fetch(`${API_BASE_URL}/${endpoint}/${taskIdForAPI}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task/meeting deleted successfully:', result);

        // Update the local tasks state immediately for instant UI update
        setTasks(prevTasks =>
          prevTasks.filter(task => {
            // Don't delete tasks that don't match - using robust matching logic
            const isMatch =
              (task._id && taskToDelete._id && task._id === taskToDelete._id) ||
              (task.task_id && taskToDelete.task_id && task.task_id === taskToDelete.task_id) ||
              (task.meeting_id && taskToDelete.meeting_id && task.meeting_id === taskToDelete.meeting_id);

            return !isMatch;
          })
        );

        setError(''); // Clear any previous errors
      } else {
        const errorData = await response.json();
        console.error('Delete API Error:', errorData);
        setError(`Failed to delete ${taskToDelete.itemType}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error during deletion:', err);
      setError(`Network error while deleting ${taskToDelete.itemType}: ${err.message}`);
    }
  };

  const onViewDetails = (task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const onViewHistory = (task) => {
    const taskId = getTaskIdForAPI(task);
    navigate(`/hod/tasks/${taskId}`, { state: { task } });
  };

  // Handle filter changes from toggle and sync with view
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);

    // Sync page with filter for consistent navigation
    if (newFilter === 'task' && currentPage === 'meetings') {
      navigate('/tasks');
    } else if (newFilter === 'meeting' && currentPage === 'tasks') {
      navigate('/meetings');
    }
  };

  // Handle page changes from sidebar and sync filter
  const handlePageChange = (pageId) => {
    navigate(`/hod/${pageId}`);

    // Sync filter with page for consistent behavior
    if (pageId === 'tasks') {
      setFilter('task');
    } else if (pageId === 'meetings') {
      setFilter('meeting');
    }
  };


  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    onLogout();
  };

  // Calculate filtered tasks and meetings based on dashboard filters
  const filteredTasks = dashboardTasks.filter(task => {

    // Task type filter - only apply if task has task_type field
    if (dashboardTaskTypeFilter && task.task_type && task.task_type !== dashboardTaskTypeFilter) return false;

    // Status filter - handle both frontend and backend status formats
    if (dashboardStatusFilter) {
      let taskStatus = task.status?.toLowerCase();
      let filterStatus = dashboardStatusFilter.toLowerCase();

      // Map frontend filter values to backend status values for comparison
      if (filterStatus === 'done') filterStatus = 'completed';
      else if (filterStatus === 'in progress') filterStatus = 'in-progress';
      else if (filterStatus === 'not started') filterStatus = 'pending';

      if (taskStatus !== filterStatus) return false;
    }

    // Category filter
    if (dashboardCategoryFilter && task.category !== dashboardCategoryFilter) return false;

    // Team member filter
    if (dashboardTeamMemberFilter) {
      if (dashboardTeamMemberFilter === 'all') {
        if (task.category !== 'assigned') return false;
      } else {
        // For specific user, show their self tasks and tasks assigned to them
        if (task.category === 'self' && task.user_id !== dashboardTeamMemberFilter) return false;
        if (task.category === 'assigned' && task.assigned_to !== dashboardTeamMemberFilter) return false;
      }
    } else {
      if (task.category !== 'self') return false;
    }

    return true;
  });

  const filteredMeetings = todayMeetings.filter(meeting => {
    // Status filter
    if (dashboardStatusFilter && meeting.status !== dashboardStatusFilter) return false;

    return true;
  });

  console.log('Filtered dashboard tasks:', filteredTasks.length, 'items for date filter:', dashboardDateFilter);

  // Calculate global stats from filtered dashboard tasks
  const totalTasks = dashboardTasks.length;
  const selfTasks = dashboardTasks.filter(t => t.category === 'self').length;
  const masterTasks = dashboardTasks.filter(t => t.category === 'assigned').length;
  const completed = dashboardTasks.filter(t => t.status === 'Done' || t.status === 'Completed').length;
  const inProgress = dashboardTasks.filter(t => t.status === 'In Progress' || t.status === 'Inprogress' || t.status === 'In-Progress').length;
  const notStarted = dashboardTasks.filter(t => t.status === 'Not Started' || t.status === 'Pending').length;
  const onHold = dashboardTasks.filter(t => t.status === 'On Hold').length;
  const cancelled = dashboardTasks.filter(t => t.status === 'Cancelled').length;

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  if (initialLoading) {
    return (
      <div>
        <Sidebar
          userRole={userProfile?.user_type || 'hod'}
        />
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <p>Loading tasks and meetings...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar
        userRole={userProfile.user_type}
      />
      <Header
        addTask={addTask}
        openPopup={openPopup}
        openAssignPopup={openAssignPopup}
        currentView={currentPage}
        onLogout={handleLogout}
        user={userProfile}
        isAddDisabled={isRemarksRequired}
      />

      {/* Error display - positioned to not affect layout */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '20px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #ffcdd2',
          zIndex: 1500,
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#c62828',
              float: 'right',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      <main style={{ backgroundColor: '#e0e0e0', overflow: 'visible' }}>
        {currentPage === 'tasks' ? (
          <div style={{ marginTop: '20px' }}>
            <TaskList
              tasks={tasks.filter(task => task.itemType === 'task').sort((a, b) => {
                // Sort by date descending (newest first) using string comparison
                const aDate = a.date || '';
                const bDate = b.date || '';
                const dateCompare = bDate.localeCompare(aDate);
                if (dateCompare !== 0) return dateCompare;
                // For same date, show current tasks before history tasks
                if (a.itemType !== b.itemType) {
                  if (a.itemType === 'task') return -1;
                  if (b.itemType === 'task') return 1;
                }
                return (a.task_type || '').localeCompare(b.task_type || '');
              })}
              onEdit={editTask}
              onViewDetails={onViewDetails}
              onDelete={deleteTask}
              onViewHistory={onViewHistory}
              filter='task'
              setFilter={handleFilterChange}
              dateFilter={taskDateFilter}
              setDateFilter={setTaskDateFilter}
              taskTypeFilter={taskTypeFilter}
              setTaskTypeFilter={setTaskTypeFilter}
              statusFilter={taskStatusFilter}
              setStatusFilter={setTaskStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={handleSetCategoryFilter}
              viewTypeFilter={taskViewTypeFilter}
              setViewTypeFilter={setTaskViewTypeFilter}
              teamMemberFilter={taskTeamMemberFilter}
              setTeamMemberFilter={setTaskTeamMemberFilter}
              teamMembers={teamMembers}
              dashboardViewType={dashboardViewType}
              userRole={userProfile.user_type}
              yesterdayDate={yesterdayDate}
              showFilterBar={true}
              showSNo={true}
            />
          </div>
        ) : currentPage === 'calendar' ? (
          <div style={{ padding: '0 50px' }}>
            <WeeklyTemplate
              tasks={weeklyTasks}
              loading={weeklyLoading}
              filter={filter}
              setFilter={setFilter}
              dateFilter={weeklyDateFilter}
              setDateFilter={setWeeklyDateFilter}
              taskTypeFilter={weeklyTaskTypeFilter}
              setTaskTypeFilter={setWeeklyTaskTypeFilter}
              statusFilter={weeklyStatusFilter}
              setStatusFilter={setWeeklyStatusFilter}
              categoryFilter={weeklyCategoryFilter}
              setCategoryFilter={setWeeklyCategoryFilter}
              viewTypeFilter={weeklyViewTypeFilter}
              setViewTypeFilter={setWeeklyViewTypeFilter}
              teamMemberFilter={weeklyTeamMemberFilter}
              setTeamMemberFilter={setWeeklyTeamMemberFilter}
              teamMembers={teamMembers}
              fetchWeeklyData={fetchWeeklyData}
            />
          </div>
        ) : currentPage === 'meetings' ? (
          <div>
            <TaskList
              tasks={tasks.filter(task => task.itemType === 'meeting')}
              onEdit={editTask}
              onViewDetails={onViewDetails}
              onDelete={deleteTask}
              filter={filter}
              setFilter={handleFilterChange}
              dateFilter={meetingDateFilter}
              setDateFilter={setMeetingDateFilter}
              taskTypeFilter={taskTypeFilter}
              setTaskTypeFilter={setTaskTypeFilter}
              statusFilter={meetingStatusFilter}
              setStatusFilter={setMeetingStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={handleSetCategoryFilter}
              viewTypeFilter={meetingViewTypeFilter}
              setViewTypeFilter={setMeetingViewTypeFilter}
              teamMemberFilter={meetingTeamMemberFilter}
              setTeamMemberFilter={setMeetingTeamMemberFilter}
              teamMembers={teamMembers}
              userRole={userProfile.user_type}
              yesterdayDate={yesterdayDate}
            />
          </div>
        ) : currentPage === 'rnr' ? (
          <div style={{ marginTop: '20px' }}>
            <HodRnR />
          </div>
        ) : currentPage === 'projection' ? (
          <div style={{ marginTop: '20px' }}>
            <HodProjection />
          </div>
        ) : (
           <div className="dashboard-container" style={{ overflow: 'visible' }}>
             {/* Dashboard Filter Panel */}
             <div className="professional-filter-bar" style={{ marginTop: '15px', marginBottom: '10px' }}>
               <div className="filter-controls">
                 {/* Date Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardDateFilter !== 'all' ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowDashboardDateDropdown(!showDashboardDateDropdown);
                       setShowDashboardTaskTypeDropdown(false);
                       setShowDashboardStatusDropdown(false);
                       setShowDashboardCategoryDropdown(false);
                       setShowDashboardTeamMemberDropdown(false);
                     }}
                   >
                     {dashboardDateFilter === 'all' ? 'Date' :
                      dashboardDateFilter === 'today' ? 'Today' :
                      dashboardDateFilter === 'yesterday' ? 'Yesterday' :
                      dashboardDateFilter === 'past_week' ? 'Past week' :
                      dashboardDateFilter === 'past_month' ? 'Past month' : 'Date'}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showDashboardDateDropdown && (
                     <div className="dropdown-menu">
                       <div className="dropdown-item" onClick={() => { setDashboardDateFilter('all'); setShowDashboardDateDropdown(false); }}>All</div>
                       <div className="dropdown-item" onClick={() => { setDashboardDateFilter('today'); setShowDashboardDateDropdown(false); }}>Today</div>
                       <div className="dropdown-item" onClick={() => { setDashboardDateFilter('yesterday'); setShowDashboardDateDropdown(false); }}>Yesterday</div>
                       <div className="dropdown-item" onClick={() => { setDashboardDateFilter('past_week'); setShowDashboardDateDropdown(false); }}>Past week</div>
                       <div className="dropdown-item" onClick={() => { setDashboardDateFilter('past_month'); setShowDashboardDateDropdown(false); }}>Past month</div>
                     </div>
                   )}
                 </div>

                 {/* Task Type Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardTaskTypeFilter ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowDashboardTaskTypeDropdown(!showDashboardTaskTypeDropdown);
                       setShowDashboardDateDropdown(false);
                       setShowDashboardStatusDropdown(false);
                       setShowDashboardCategoryDropdown(false);
                       setShowDashboardTeamMemberDropdown(false);
                     }}
                   >
                     {dashboardTaskTypeFilter || 'Task Type'}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showDashboardTaskTypeDropdown && (
                     <div className="dropdown-menu">
                       <div className="dropdown-item" onClick={() => { setDashboardTaskTypeFilter(''); setShowDashboardTaskTypeDropdown(false); }}>All</div>
                       <div className="dropdown-item" onClick={() => { setDashboardTaskTypeFilter('Fixed'); setShowDashboardTaskTypeDropdown(false); }}>Fixed</div>
                       <div className="dropdown-item" onClick={() => { setDashboardTaskTypeFilter('Variable'); setShowDashboardTaskTypeDropdown(false); }}>Variable</div>
                       <div className="dropdown-item" onClick={() => { setDashboardTaskTypeFilter('HOD Assigned'); setShowDashboardTaskTypeDropdown(false); }}>HOD Assigned</div>
                     </div>
                   )}
                 </div>

                 {/* Category Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardCategoryFilter ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowDashboardCategoryDropdown(!showDashboardCategoryDropdown);
                       setShowDashboardDateDropdown(false);
                       setShowDashboardTaskTypeDropdown(false);
                       setShowDashboardStatusDropdown(false);
                       setShowDashboardTeamMemberDropdown(false);
                     }}
                   >
                     {dashboardCategoryFilter === 'self' ? 'Self' :
                      dashboardCategoryFilter === 'assigned' ? 'Assigned' : 'Category'}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showDashboardCategoryDropdown && (
                     <div className="dropdown-menu">
                       <div className="dropdown-item" onClick={() => { setDashboardCategoryFilter(''); setShowDashboardCategoryDropdown(false); }}>All</div>
                       <div className="dropdown-item" onClick={() => { setDashboardCategoryFilter('self'); setShowDashboardCategoryDropdown(false); }}>Self</div>
                       <div className="dropdown-item" onClick={() => { setDashboardCategoryFilter('assigned'); setShowDashboardCategoryDropdown(false); }}>Assigned</div>
                     </div>
                   )}
                 </div>

                 {/* Status Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardStatusFilter ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowDashboardStatusDropdown(!showDashboardStatusDropdown);
                       setShowDashboardDateDropdown(false);
                       setShowDashboardTaskTypeDropdown(false);
                       setShowDashboardCategoryDropdown(false);
                       setShowDashboardTeamMemberDropdown(false);
                     }}
                   >
                     {dashboardStatusFilter || 'Status'}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showDashboardStatusDropdown && (
                     <div className="dropdown-menu">
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter(''); setShowDashboardStatusDropdown(false); }}>All</div>
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter('In Progress'); setShowDashboardStatusDropdown(false); }}>In Progress</div>
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter('Done'); setShowDashboardStatusDropdown(false); }}>Done</div>
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter('Not Started'); setShowDashboardStatusDropdown(false); }}>Not Started</div>
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter('Scheduled'); setShowDashboardStatusDropdown(false); }}>Scheduled</div>
                       <div className="dropdown-item" onClick={() => { setDashboardStatusFilter('Cancelled'); setShowDashboardStatusDropdown(false); }}>Cancelled</div>
                     </div>
                   )}
                 </div>

                 {/* Team Member Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardTeamMemberFilter ? 'active' : ''}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       setShowDashboardTeamMemberDropdown(!showDashboardTeamMemberDropdown);
                       setShowDashboardDateDropdown(false);
                       setShowDashboardTaskTypeDropdown(false);
                       setShowDashboardStatusDropdown(false);
                       setShowDashboardCategoryDropdown(false);
                     }}
                   >
                     {dashboardViewType === 'self' ? 'My Dashboard' :
                      dashboardTeamMemberFilter === 'all' ? 'All Team Members' :
                      dashboardTeamMemberFilter ? (teamMembers?.find(m => m.user_id === dashboardTeamMemberFilter)?.name || 'Team Member') : 'Team Member'}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showDashboardTeamMemberDropdown && (
                     <div className="dropdown-menu">
                       <div
                         className="dropdown-item"
                         onClick={() => { setDashboardViewType('self'); setDashboardTeamMemberFilter(''); setShowDashboardTeamMemberDropdown(false); }}
                       >
                         My Dashboard
                       </div>
                       <div
                         className="dropdown-item"
                         onClick={() => { setDashboardViewType('all'); setDashboardTeamMemberFilter('all'); setShowDashboardTeamMemberDropdown(false); }}
                       >
                         All Team Members
                       </div>
                       {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                         <div
                           key={member.user_id}
                           className="dropdown-item"
                           onClick={() => { setDashboardViewType('team'); setDashboardTeamMemberFilter(member.user_id); setShowDashboardTeamMemberDropdown(false); }}
                         >
                           {member.name}
                         </div>
                       )) : (
                         <div className="dropdown-item disabled">No team members available</div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Clear All Filters Button */}
                 {(dashboardDateFilter !== 'all' || dashboardTaskTypeFilter || dashboardStatusFilter || dashboardCategoryFilter || dashboardTeamMemberFilter) && (
                   <button
                     className="clear-all-filters-btn"
                     onClick={() => {
                       setDashboardDateFilter('all');
                       setDashboardTaskTypeFilter('');
                       setDashboardStatusFilter('');
                       setDashboardCategoryFilter('');
                       setDashboardTeamMemberFilter('');
                       setDashboardViewType('self');
                     }}
                     title="Clear all filters"
                   >
                     <FaTimes className="clear-all-icon" />
                     Clear All
                   </button>
                 )}
               </div>

              </div>
                {/* All Cards Container */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  padding: '20px',
                  marginTop: '10px',
                  marginBottom: '10px'
                }}>
                  {/* Stats Cards Container */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    flexWrap: 'wrap'
                  }}>
               {/* Total Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Total Tasks</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#3b82f6'
                 }}>{totalTasks}</div>
               </div>

               {/* Self Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Self Tasks</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#10b981'
                 }}>{selfTasks}</div>
               </div>

               {/* Master Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Master Tasks</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#f59e0b'
                 }}>{masterTasks}</div>
               </div>
             </div>

             {/* Status Wise Distribution Heading */}
             <h3 style={{
               fontSize: '15px',
               fontWeight: '600',
               color: '#374151',
               margin: '15px 0 10px 0',
               textAlign: 'left'
             }}>Status Wise Distribution</h3>

             {/* Status Cards Container */}
             <div style={{
               display: 'flex',
               gap: '10px',
               marginBottom: '10px',
               flexWrap: 'wrap'
             }}>
               {/* Done Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Done</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#22c55e'
                 }}>{completed}</div>
               </div>

               {/* In Progress Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>In Progress</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#3b82f6'
                 }}>{inProgress}</div>
               </div>

               {/* Not Started Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Not Started</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#f97316'
                 }}>{notStarted}</div>
               </div>

               {/* On Hold Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>On Hold</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#f59e0b'
                 }}>{onHold}</div>
               </div>

               {/* Cancelled Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '6px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '10px 5px',
                 flex: '1',
                 minWidth: '120px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 5px 0',
                   fontSize: '15px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Cancelled</h3>
                 <div style={{
                   fontSize: '15px',
                   fontWeight: 'bold',
                   color: '#ef4444'
                 }}>{cancelled}</div>
               </div>
             </div>

             {/* Team Wise Distribution Heading */}
             <h3 style={{
               fontSize: '15px',
               fontWeight: '600',
               color: '#374151',
               margin: '15px 0 10px 0',
               textAlign: 'left'
             }}>Team Wise Distribution</h3>

             {/* Team Member Cards Container */}
             <div style={{
               display: 'flex',
               gap: '10px',
               marginBottom: '10px',
               flexWrap: 'wrap'
             }}>
               {/* Calculate member counts from tasks filtered only by date */}
               {(() => {
                 const dateFilteredTasks = dashboardTasks;

                 const memberCounts = {};
                 dateFilteredTasks.forEach(task => {
                   let userId;
                   if (task.category === 'self') {
                     userId = task.user_id;
                   } else if (task.category === 'assigned') {
                     userId = task.assigned_to;
                   }
                   if (userId) {
                     memberCounts[userId] = (memberCounts[userId] || 0) + 1;
                   }
                 });

                 return (
                   <>
                     {/* HOD Card */}
                     <div style={{
                       background: 'white',
                       borderRadius: '6px',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                       padding: '10px 5px',
                       flex: '1',
                       minWidth: '120px',
                       textAlign: 'center'
                     }}>
                       <h3 style={{
                         margin: '0 0 5px 0',
                         fontSize: '15px',
                         fontWeight: '600',
                         color: '#374151'
                       }}>{userProfile?.name || 'HOD'}</h3>
                       <div style={{
                         fontSize: '15px',
                         fontWeight: 'bold',
                         color: '#8b5cf6'
                       }}>{memberCounts[userProfile?.user_id] || 0}</div>
                     </div>

                     {/* Team Member Cards */}
                     {[...teamMembers].sort((a, b) => a.name.localeCompare(b.name)).map(member => {
                       const memberTasks = memberCounts[member.user_id] || 0;
                       return (
                         <div key={member.user_id} style={{
                           background: 'white',
                           borderRadius: '6px',
                           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                           padding: '10px 5px',
                           flex: '1',
                           minWidth: '120px',
                           textAlign: 'center'
                         }}>
                           <h3 style={{
                             margin: '0 0 5px 0',
                             fontSize: '15px',
                             fontWeight: '600',
                             color: '#374151'
                           }}>{member.name}</h3>
                           <div style={{
                             fontSize: '15px',
                             fontWeight: 'bold',
                             color: '#8b5cf6'
                           }}>{memberTasks}</div>
                         </div>
                       );
                     })}
                   </>
                 );
               })()}
             </div>

             {/* Task Type Distribution Heading */}
             <h3 style={{
               fontSize: '15px',
               fontWeight: '600',
               color: '#374151',
               margin: '15px 0 10px 0',
               textAlign: 'left'
             }}>Task Type Distribution</h3>

             {/* Task Type Cards Container */}
             <div style={{
               display: 'flex',
               gap: '10px',
               marginBottom: '10px',
               flexWrap: 'wrap'
             }}>
               {/* Calculate task type counts from tasks filtered only by date */}
               {(() => {
                 const dateFilteredTasks = dashboardTasks;

                 return (
                   <>
                     {/* Fixed Card */}
                     <div style={{
                       background: 'white',
                       borderRadius: '6px',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                       padding: '10px 5px',
                       flex: '1',
                       minWidth: '120px',
                       textAlign: 'center'
                     }}>
                       <h3 style={{
                         margin: '0 0 5px 0',
                         fontSize: '15px',
                         fontWeight: '600',
                         color: '#374151'
                       }}>Fixed</h3>
                       <div style={{
                         fontSize: '15px',
                         fontWeight: 'bold',
                         color: '#059669'
                       }}>{dateFilteredTasks.filter(t => t.task_type === 'Fixed').length}</div>
                     </div>

                     {/* Variable Card */}
                     <div style={{
                       background: 'white',
                       borderRadius: '6px',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                       padding: '10px 5px',
                       flex: '1',
                       minWidth: '120px',
                       textAlign: 'center'
                     }}>
                       <h3 style={{
                         margin: '0 0 5px 0',
                         fontSize: '15px',
                         fontWeight: '600',
                         color: '#374151'
                       }}>Variable</h3>
                       <div style={{
                         fontSize: '15px',
                         fontWeight: 'bold',
                         color: '#dc2626'
                       }}>{dateFilteredTasks.filter(t => t.task_type === 'Variable').length}</div>
                     </div>

                     {/* HOD Assigned Card */}
                     <div style={{
                       background: 'white',
                       borderRadius: '6px',
                       boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                       padding: '10px 5px',
                       flex: '1',
                       minWidth: '120px',
                       textAlign: 'center'
                     }}>
                       <h3 style={{
                         margin: '0 0 5px 0',
                         fontSize: '15px',
                         fontWeight: '600',
                         color: '#374151'
                       }}>HOD Assigned</h3>
                       <div style={{
                         fontSize: '15px',
                         fontWeight: 'bold',
                         color: '#7c3aed'
                       }}>{dateFilteredTasks.filter(t => t.task_type === 'HOD Assigned').length}</div>
                     </div>
                   </>
                 );
               })()}
             </div>
           </div>

           {/* Tasks Table Section */}
           <div style={{
             background: 'white',
             borderRadius: '12px',
             boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
             width: '100%',
             overflow: 'hidden',
             marginTop: '10px',
             marginBottom: '10px'
           }}>
             {/* Tasks Table Header */}
             <div style={{
               background: '#5580ff',
               borderRadius: '12px 12px 0 0',
               padding: '12px 20px',
               margin: '0',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center'
             }}>
               <h3 style={{
                 margin: '0',
                 fontSize: '18px',
                 fontWeight: '600',
                 color: 'white'
               }}>
                 Tasks Table
               </h3>
               <span style={{
                 fontSize: '14px',
                 fontWeight: '500',
                 color: 'white',
                 opacity: '0.9'
               }}>
                 {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
               </span>
             </div>

             {/* Tasks Table */}
             <div style={{
               padding: '0',
               margin: '0'
             }}>
               <table style={{
                 width: '100%',
                 borderCollapse: 'collapse',
                 margin: '0',
                 overflow: 'visible'
               }}>
                 <thead>
                   <tr style={{
                     background: '#dbeafe',
                     borderBottom: '2px solid #e2e8f0'
                   }}>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '60px'
                     }}>Sno</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'left',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '30%'
                     }}>Task name</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '120px'
                     }}>Date</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '120px'
                     }}>Timeline</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '100px'
                     }}>Type</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '120px'
                     }}>Time</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       width: '100px'
                     }}>Status</th>
                     <th style={{
                       padding: '8px 12px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       width: '80px'
                     }}>Link</th>
                   </tr>
                 </thead>
                 <tbody>
                   {(() => {
                     const filteredTasks = dashboardTasks.filter(task => {

                       // Task type filter
                       if (dashboardTaskTypeFilter && task.task_type !== dashboardTaskTypeFilter) return false;

                       // Status filter
                       if (dashboardStatusFilter && task.status !== dashboardStatusFilter) return false;

                       // Category filter
                       if (dashboardCategoryFilter && task.category !== dashboardCategoryFilter) return false;

                       // Team member filter
                       if (dashboardViewType === 'all') {
                         // For 'all team members' view, show all tasks (both self and assigned)
                         // No additional filtering needed as backend already filtered
                       } else if (dashboardViewType === 'team') {
                         if (dashboardTeamMemberFilter) {
                           // For specific team member, show their self tasks and tasks assigned to them
                           if (task.category === 'self' && task.user_id !== dashboardTeamMemberFilter) return false;
                           if (task.category === 'assigned' && task.assigned_to !== dashboardTeamMemberFilter) return false;
                         }
                       } else {
                         // For 'self' view, show only self tasks
                         if (task.category !== 'self') return false;
                       }
                   
                   
                   
                       return true;
                     }).sort((a, b) => (a.task_type || '').localeCompare(b.task_type || ''));

                     if (filteredTasks.length === 0) {
                       return (
                         <tr>
                           <td colSpan="8" style={{
                             padding: '40px 16px',
                             textAlign: 'center',
                             color: '#6b7280'
                           }}>
                             No tasks available
                           </td>
                         </tr>
                       );
                     }

                     return filteredTasks.map((task, index) => (
                       <tr key={task.task_id || task._id || index} style={{
                         backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                         borderBottom: '1px solid #e2e8f0'
                       }}>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center',
                           fontWeight: '500'
                         }}>{index + 1}</td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           fontWeight: '500',
                           textAlign: 'left'
                         }}>{task.task_name}</td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center'
                         }}>{formatDate(task.date)}</td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center'
                         }}>{task.timeline ? formatDate(task.timeline) : 'N/A'}</td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center'
                         }}>{task.task_type}</td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center'
                         }}>{task.time} mins</td>
                         <td style={{
                           padding: '8px 12px',
                           textAlign: 'center'
                         }}>
                           <span style={{
                             padding: '4px 8px',
                             borderRadius: '4px',
                             fontSize: '12px',
                             fontWeight: '500',
                             backgroundColor: task.status === 'Done' ? '#dcfce7' :
                                            task.status === 'In Progress' ? '#dbeafe' : '#fef3c7',
                             color: task.status === 'Done' ? '#166534' :
                                   task.status === 'In Progress' ? '#1e40af' : '#92400e'
                           }}>
                             {task.status}
                           </span>
                         </td>
                         <td style={{
                           padding: '8px 12px',
                           color: '#374151',
                           textAlign: 'center',
                           position: 'relative'
                         }}>
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <FaExternalLinkAlt
                               style={{
                                 color: '#3b82f6',
                                 cursor: 'pointer',
                                 fontSize: '14px'
                               }}
                               onClick={() => onViewDetails(task)}
                               title="View details"
                             />
                             <FaEllipsisV
                               className="menu-icon"
                               style={{ cursor: 'pointer' }}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setMenuOpen(menuOpen === `task-${index}` ? null : `task-${index}`);
                               }}
                             />
                           </div>
                           {menuOpen === `task-${index}` && (
                             <div className="task-menu" style={{
                               position: 'absolute',
                               background: 'white',
                               border: '1px solid #e2e8f0',
                               borderRadius: '8px',
                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                               zIndex: 9999,
                               top: '-60px',
                               left: '-80px'
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

                                   // For HOD users, allow editing today's and previous working day's tasks
                                   if (userProfile?.user_type === 'hod' || userProfile?.user_type === 'HOD') {
                                     const lastWorkingDayStr = yesterdayDate ? new Date(yesterdayDate).toISOString().split('T')[0] : yesterdayStr;
                                     const isBeforeLastWorkingDay = taskDate && taskDate < lastWorkingDayStr;
                                     if (isBeforeLastWorkingDay) {
                                       alert(`HOD can only edit today's and previous working day tasks`);
                                       setMenuOpen(null);
                                       return;
                                     }
                                   } else {
                                     // For regular users, same restriction as before
                                     if (isBeforeYesterday) {
                                       alert(`You can't edit tasks from before yesterday`);
                                       setMenuOpen(null);
                                       return;
                                     }
                                   }
                                   editTask(task);
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
                       </tr>
                     ));
                   })()}
                 </tbody>
               </table>
             </div>
           </div>

           {/* Today's Meetings Section - Header and Table in Single Container */}
           <div style={{
             background: 'white',
             borderRadius: '12px',
             boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
             width: '100%',
             overflow: 'visible',
             marginTop: '30px',
             marginBottom: '20px'
           }}>
             {/* Today's Meetings Table Header */}
             <div style={{
               background: '#e27326',
               borderRadius: '12px 12px 0 0',
               padding: '12px 20px',
               margin: '0',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center'
             }}>
               <h3 style={{
                 margin: '0',
                 fontSize: '18px',
                 fontWeight: '600',
                 color: 'white'
               }}>
                 Meetings Table
               </h3>
               <span style={{
                 fontSize: '14px',
                 fontWeight: '500',
                 color: 'white',
                 opacity: '0.9'
               }}>
                 {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
               </span>
             </div>

             {/* Today's Meetings Table */}
             <div style={{
               padding: '0',
               margin: '0'
             }}>
             <table style={{
               width: '100%',
               borderCollapse: 'collapse',
               margin: '0',
               overflow: 'visible'
             }}>
               <thead>
                 <tr style={{
                   background: '#fed7aa',
                   borderBottom: '2px solid #e2e8f0'
                 }}>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '60px'
                   }}>S.No</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '30%'
                   }}>Meeting name</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '15%'
                   }}>Dept</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '15%'
                   }}>Co Person</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '15%'
                   }}>Time (in mins)</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '12%'
                   }}>Prop Slot</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     borderRight: '1px solid #e5e7eb',
                     width: '12%'
                   }}>Status</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     width: '15%'
                   }}>Notes</th>
                   <th style={{
                     padding: '8px 12px',
                     textAlign: 'center',
                     fontWeight: '600',
                     fontSize: '14px',
                     color: 'black',
                     width: '60px'
                   }}></th>
                 </tr>
               </thead>
               <tbody>
                 {filteredMeetings.length > 0 ? (
                   filteredMeetings.map((meeting, index) => (
                     <tr key={meeting.meeting_id || index} style={{
                       backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                       borderBottom: '1px solid #e2e8f0'
                     }}>
                       <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                       <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500' }}>{meeting.meeting_name || meeting.name}</td>
                       <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.dept || 'N/A'}</td>
                       <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.co_person || 'N/A'}</td>
                       <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.time || 'N/A'}</td>
                       <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.prop_slot || 'N/A'}</td>
                       <td style={{ padding: '8px 12px' }}>
                         <span style={{
                           padding: '4px 8px',
                           borderRadius: '4px',
                           fontSize: '12px',
                           fontWeight: '500',
                           backgroundColor: meeting.status === 'completed' ? '#dcfce7' :
                                          meeting.status === 'scheduled' ? '#dbeafe' : '#fef3c7',
                           color: meeting.status === 'completed' ? '#166534' :
                                 meeting.status === 'scheduled' ? '#1e40af' : '#92400e'
                         }}>
                           {meeting.status}
                         </span>
                       </td>
                       <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.notes || 'N/A'}</td>
                       <td style={{ padding: '6px 8px', textAlign: 'center', position: 'relative' }}>
                         <FaEllipsisV
                           className="menu-icon"
                           style={{ cursor: 'pointer' }}
                           onClick={(e) => {
                             e.stopPropagation();
                             setMenuOpen(menuOpen === `meeting-${index}` ? null : `meeting-${index}`);
                           }}
                         />
                         {menuOpen === `meeting-${index}` && (
                           <div className="task-menu" style={{
                             position: 'absolute',
                             background: 'white',
                             border: '1px solid #e2e8f0',
                             borderRadius: '8px',
                             boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                             zIndex: 9999,
                             top: '-60px',
                             left: '-80px'
                           }}>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const today = new Date().toISOString().split('T')[0];
                                 const yesterday = new Date();
                                 yesterday.setDate(yesterday.getDate() - 1);
                                 const yesterdayStr = yesterday.toISOString().split('T')[0];
                                 const meetingDate = meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : null;
                                 const isBeforeYesterday = meetingDate && meetingDate < yesterdayStr;

                                 // For HOD users, allow editing today's and previous working day's meetings
                                 if (userProfile?.user_type === 'hod' || userProfile?.user_type === 'HOD') {
                                   const lastWorkingDayStr = yesterdayDate ? new Date(yesterdayDate).toISOString().split('T')[0] : yesterdayStr;
                                   const isBeforeLastWorkingDay = meetingDate && meetingDate < lastWorkingDayStr;
                                   if (isBeforeLastWorkingDay) {
                                     alert(`HOD can only edit today's and previous working day meetings`);
                                     setMenuOpen(null);
                                     return;
                                   }
                                 } else {
                                   // For regular users, same restriction as before
                                   const isPastDate = meetingDate !== today;
                                   if (isPastDate) {
                                     alert(`You can't edit past meetings`);
                                     setMenuOpen(null);
                                     return;
                                   }
                                 }
                                 editTask(meeting);
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
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="9" style={{
                       padding: '40px 16px',
                       textAlign: 'center',
                       color: '#6b7280'
                     }}>
                       No meetings scheduled for today
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
             </div>
           </div>

          </div>
        )}
      </main>

      {/* Modals positioned outside main content to prevent layout shifts */}
      <TaskPopup
        open={isPopupOpen}
        onClose={closePopup}
        addTask={addTask}
        editingTask={editingTask}
        updateTask={updateTask}
        mode="create"
        isRestrictedEdit={editingTask?.itemType === 'task'}
      />
      <TaskPopup
        open={isAssignPopupOpen}
        onClose={closeAssignPopup}
        addTask={assignTask}
        editingTask={editingTask}
        updateTask={updateTask}
        mode="assign"
        teamMembers={teamMembers}
      />
      <ProfilePanel
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
      />
      {isDetailsOpen && <TaskDetails task={selectedTask} onClose={() => setIsDetailsOpen(false)} />}
    </div>
  );
};

export default HodHome;