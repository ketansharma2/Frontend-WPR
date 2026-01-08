import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskList from './TaskList';
import WeeklyTemplate from './WeeklyTemplate';
import TaskPopup from './TaskPopup';
import TaskDetails from './TaskDetails';
import ProfilePanel from './ProfilePanel';
import TaskHistoryPopup from './TaskHistoryPopup';
import RnR from './RnR';
import { FaChevronDown, FaTimes, FaExternalLinkAlt, FaEllipsisV } from 'react-icons/fa';
import { api } from '../config/api';
import DeptStatusChart from './DeptAnalytics/DeptStatusChart';
import MemberBreakdownChart from './DeptAnalytics/MemberBreakdownChart';
import SelfVsAssignedPieChart from './DeptAnalytics/SelfVsAssignedPieChart';
import './Home.css';
import './TaskList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const SubAdminHome = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
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
  const [categoryFilter, setCategoryFilter] = useState('');
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
  const [dashboardTeamMemberFilter, setDashboardTeamMemberFilter] = useState('self');
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

  // Default dates for analytics
  const today = new Date();
  // Calculate Monday of current week
  const mondayOfWeek = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, subtract 6 days; otherwise subtract (day-1)
  mondayOfWeek.setDate(today.getDate() - daysToSubtract);
  // Calculate Saturday of current week
  const saturdayOfWeek = new Date(today);
  const daysToAdd = 6 - dayOfWeek; // Saturday is day 6, so add (6 - currentDay) days
  saturdayOfWeek.setDate(today.getDate() + daysToAdd);
  const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Helper function to get display text for team member filter
  const getTeamMemberDisplayText = (value) => {
    if (!value || value === 'self') return 'My Dashboard';
    if (value === 'all') return 'All Team Members';
    const member = teamMembers?.find(m => m.user_id === value);
    return member ? member.name : 'Team Member';
  };

  const [analyticsData, setAnalyticsData] = useState({});
  const [analyticsFromDate, setAnalyticsFromDate] = useState(formatDate(mondayOfWeek));
  const [analyticsToDate, setAnalyticsToDate] = useState(formatDate(saturdayOfWeek));

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  // Fetch SubAdmin data from backend
  async function fetchSubAdminData(taskViewType = 'self', taskTeamMember = '', meetingViewType = 'self', meetingTeamMember = '', category = 'all', dateFilter = 'all', showLoading = true) {

    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      // For SubAdmin: default shows self tasks, 'all' shows master tasks assigned by SubAdmin
      let viewTasksOf = 'self'; // Default to self tasks
      let targetUserId = null;
      let endpoint = '/tasks/filter';

      if (taskViewType === 'team') {
        endpoint = '/sub-admin/tasks/filter';
        if (taskTeamMember === 'all') {
          viewTasksOf = 'team';
          targetUserId = 'all'; // Show all master tasks assigned by SubAdmin
        } else if (taskTeamMember) {
          viewTasksOf = 'team';
          targetUserId = taskTeamMember; // Show master tasks assigned to specific user
        }
      } else if (taskViewType === 'all') {
        // When 'all' is selected, show all assigned tasks
        endpoint = '/sub-admin/tasks/filter';
        viewTasksOf = 'team';
        targetUserId = 'all';
      }

      const tasksResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          view_tasks_of: viewTasksOf,
          target_user_id: targetUserId,
          date_filter: 'all',
          task_type: 'all',
          status: 'all',
          category
        })
      });

      // Fetch meetings with SubAdmin-specific filter
      let viewType = meetingViewType;
      let targetUserIdMeetings = meetingViewType === 'team' && meetingTeamMember && meetingTeamMember !== 'all' ? meetingTeamMember : null;
      if (meetingTeamMember === 'all') {
        viewType = 'all';
        targetUserIdMeetings = null;
      }

      const meetingsResponse = await fetch(`${API_BASE_URL}/sub-admin/meetings/filter`, {
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
          allTasks = [
            ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users })),
            ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self', owner_name: task.users?.name || 'Unknown' })),
            ...(meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting', owner_name: meeting.users?.name || meeting.owner_name || 'Unknown' }))
          ];
        } else {
          // If tasks failed, still show meetings
          console.warn('Tasks API failed, showing only meetings');
          allTasks = (meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting', owner_name: meeting.users?.name || meeting.owner_name || 'Unknown' }));
        }

        console.log('Combined tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));

        // For SubAdmin, backend already filters based on viewType, so use all returned tasks
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

      // Fetch tasks with SubAdmin-specific filter
      let viewTasksOf = taskViewType;
      let targetUserId = taskViewType === 'team' && taskTeamMember && taskTeamMember !== 'all' ? taskTeamMember : null;
      if (taskTeamMember === 'all') {
        viewTasksOf = 'all';
        targetUserId = null;
      }

      const tasksResponse = await fetch(`${API_BASE_URL}/sub-admin/tasks/filter`, {
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

        // Combine tasks and meetings into a single array - master_tasks first, then self_tasks
        const allTasks = [
          ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users })),
          ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self', owner_name: task.users?.name || 'Unknown' }))
        ];

        console.log('Combined dashboard tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));

        // For SubAdmin, backend already filters based on viewType, so use all returned tasks
        const filteredTasks = allTasks;

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

      const response = await fetch(`${API_BASE_URL}/sub-admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        // Add "All Team Members" option at the top
        const allTeamMembersOption = { user_id: 'all', name: 'All Team Members' };
        setTeamMembers([allTeamMembersOption, ...users]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch team members:', response.status, response.statusText, errorData);
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };

  // Fetch SubAdmin dashboard data
  const fetchSubAdminDashboardData = async (viewType = 'self', targetUserId = null) => {
    try {
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/data`, {
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
        console.log('SubAdmin dashboard data loaded:', data);
      } else {
        console.error('Failed to fetch SubAdmin dashboard data');
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching SubAdmin dashboard data:", err);
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

      const response = await fetch(`${API_BASE_URL}/fixed-tasks/auto-populate`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('SubAdmin Auto-populate result:', result);
        if (result.populated_tasks?.length > 0) {
          alert(`✅ Success: ${result.populated_tasks.length} fixed tasks populated for team members today!`);
        }
        // Refresh dashboard data
        fetchSubAdminDashboardData();
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

      // For SubAdmin, we need to check remarks for all team members
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

      const response = await fetch(`${API_BASE_URL}/sub-admin/weekly/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...filters
        })
      });

      if (response.ok) {
        const data = await response.json();
        const tasks = [
          ...(data.self_tasks || []).map(task => ({ ...task, source: 'self' })),
          ...(data.master_tasks || []).map(task => ({ ...task, source: 'assigned' }))
        ];
        setWeeklyTasks(tasks);
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
    fetchSubAdminData('self', '', 'self', '', 'all', 'all', true);
    fetchSubAdminDashboardData('self'); // Fetch dashboard data on mount
    fetchTeamMembers(); // Fetch team members on mount
  }, []);

  // Refetch tasks when category filter changes
  useEffect(() => {
    if (userProfile) {
      const cat = categoryFilter === '' ? 'all' : categoryFilter;
      fetchSubAdminData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, cat, 'all', false);
    }
  }, [categoryFilter, userProfile]);

  // Refetch data when any filter changes
  useLayoutEffect(() => {
    if (userProfile && (currentPage === 'tasks' || currentPage === 'meetings')) {
      setLoading(false); // Ensure loading is false for filter changes
      setTasks([]); // Clear current tasks to prevent showing old data
      // Only fetch meetings if team view has a selected member
      if (!(meetingViewTypeFilter === 'team' && !meetingTeamMemberFilter)) {
        fetchSubAdminData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, 'all', 'all', false);
      }
      if (taskViewTypeFilter === 'team' || meetingViewTypeFilter === 'team' || taskViewTypeFilter === 'all' || meetingViewTypeFilter === 'all') {
        fetchTeamMembers();
      }
    }
  }, [taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, userProfile, currentPage]);

  // Refetch dashboard data when dashboard team member filter changes
  useEffect(() => {
    if (userProfile) {
      if (dashboardTeamMemberFilter === 'self') {
        fetchSubAdminDashboardData('self', null);
      } else if (dashboardTeamMemberFilter === 'all') {
        fetchSubAdminDashboardData('all', null);
      } else {
        fetchSubAdminDashboardData('team', dashboardTeamMemberFilter);
      }
    }
  }, [dashboardTeamMemberFilter, userProfile]);

  // Refetch dashboard data when date filter changes
  useEffect(() => {
    if (userProfile) {
      const viewType = dashboardViewType;
      const targetUserId = dashboardViewType === 'team' ? dashboardTeamMemberFilter : null;
      fetchSubAdminDashboardData(viewType, targetUserId);
    }
  }, [dashboardDateFilter, userProfile]);

  // Refetch tasks and meetings data when dashboard view type or team member changes
  useEffect(() => {
    if (userProfile) {
      const taskViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
      const taskTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
      const meetingViewType = dashboardViewType === 'all' ? 'all' : dashboardViewType;
      const meetingTeamMember = dashboardViewType === 'team' ? dashboardTeamMemberFilter : (dashboardViewType === 'all' ? 'all' : '');
      fetchSubAdminData(taskTeamMember, meetingTeamMember, 'all', false);
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
         fetchDashboardTasks(taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, 'all', 'all', false);
       }
     }, [dashboardViewType, dashboardTeamMemberFilter, userProfile]);

    // Check remarks requirement when dashboard loads
    useEffect(() => {
      if (userProfile?.user_id && currentPage === 'dashboard' && isRemarksRequired === null) {
        fetchLastWorkingDayData();
      }
    }, [userProfile, currentPage, isRemarksRequired]);

    // Auto-populate fixed tasks when dashboard loads and remarks are checked
    useEffect(() => {
      if (userProfile?.user_id && currentPage === 'dashboard' && !hasAutoPopulated && isRemarksRequired === false) {
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

        const response = await fetch(`${API_BASE_URL}/assign/create`, {
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
      setIsPopupOpen(true);
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
        const endpoint = updatedTask.itemType === 'meeting' ? 'meetings' : 'tasks';

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
        } else {
          // Map task fields to backend format for update - Include description
          apiData = {
            user_id: userProfile.user_id,
            date: updatedTask.date || updatedTask.dueDate,
            timeline: updatedTask.timeline,
            task_name: updatedTask.task_name || updatedTask.name,
            time: updatedTask.time_in_mins || updatedTask.time,
            task_type: updatedTask.task_type || updatedTask.type,
            status: updatedTask.status,
            file_link: updatedTask.file_link || updatedTask.attachments,
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
      setSelectedTaskId(taskId);
      setIsHistoryOpen(true);
    };

    const closeHistoryPopup = () => {
      setIsHistoryOpen(false);
      setSelectedTaskId(null);
    };

    // Handle filter changes from toggle and sync with view
    const handleFilterChange = (newFilter) => {
      setFilter(newFilter);

      // Sync page with filter for consistent navigation
      if (newFilter === 'task' && currentPage === 'meetings') {
        setCurrentPage('tasks');
      } else if (newFilter === 'meeting' && currentPage === 'tasks') {
        setCurrentPage('meetings');
      }
    };

    // Handle page changes from sidebar and sync filter
    const handlePageChangeFromSidebar = (pageId) => {
      setCurrentPage(pageId);

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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div style={{ backgroundColor: '#e0e0e0', minHeight: '100vh', padding: '0 50px' }}>
            <div className="professional-filter-bar">
              <div className="filter-controls" style={{ gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', whiteSpace: 'nowrap' }}>Date Range:</span>
                  <input
                    type="date"
                    value={analyticsFromDate}
                    onChange={(e) => setAnalyticsFromDate(e.target.value)}
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
                    value={analyticsToDate}
                    onChange={(e) => setAnalyticsToDate(e.target.value)}
                    style={{
                      padding: '4px 6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '11px',
                      width: '100px'
                    }}
                  />
                  {(analyticsFromDate || analyticsToDate) && (
                    <button
                      onClick={() => {
                        setAnalyticsFromDate('');
                        setAnalyticsToDate('');
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
                    {getTeamMemberDisplayText(dashboardTeamMemberFilter)}
                    <FaChevronDown className="dropdown-arrow" />
                  </button>
                  {showDashboardTeamMemberDropdown && (
                    <div className="dropdown-menu">
                      <div
                        className="dropdown-item"
                        onClick={() => {
                          setDashboardTeamMemberFilter('self');
                          setShowDashboardTeamMemberDropdown(false);
                        }}
                      >
                        My Dashboard
                      </div>
                      {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                        <div
                          key={member.user_id}
                          className="dropdown-item"
                          onClick={() => {
                            setDashboardTeamMemberFilter(member.user_id);
                            setShowDashboardTeamMemberDropdown(false);
                          }}
                        >
                          {member.name}
                        </div>
                      )) : (
                        <div className="dropdown-item disabled">No team members available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-stats">
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 10px 0' }}>Total Tasks</h3>
                <p style={{ fontSize: '15px', margin: '0' }}>{(analyticsData.self_tasks || 0) + (analyticsData.assigned_tasks || 0)}</p>
              </div>
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 10px 0' }}>Self Tasks</h3>
                <p style={{ fontSize: '15px', margin: '0' }}>{analyticsData.self_tasks || 0}</p>
              </div>
              <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                <h3 style={{ fontSize: '15px', margin: '0 0 10px 0' }}>Assigned Tasks</h3>
                <p style={{ fontSize: '15px', margin: '0' }}>{analyticsData.assigned_tasks || 0}</p>
              </div>
            </div>

            {/* User and Status Cards */}
            <div style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Member Wise Cards */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '600px', flex: '1' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333', textAlign: 'center' }}>Member wise distribution</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px', listStyle: 'none', padding: '0', justifyContent: 'center' }}>
                    {teamMembers.filter(member => member.user_id !== 'all').map((member) => (
                      <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', whiteSpace: 'nowrap', color: '#333' }}>
                        <span style={{ color: '#666', marginRight: '12px', fontSize: '1rem' }}>•</span>
                        {member.name} <span style={{ marginLeft: '8px', color: '#666' }}>{analyticsData.member_breakdown?.[member.name] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right side: Status and Task Type */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Status Wise Distribution Card */}
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: '1', minWidth: '300px' }}>
                    <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Status wise distribution</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Done</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.done || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>In Progress</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.in_progress || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Not Started</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.not_started || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Cancelled</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.cancelled || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>On Hold</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.on_hold || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Task Type Distribution Card */}
                  <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', flex: '1', minWidth: '300px' }}>
                    <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Task type distribution</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Fixed</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.fixed || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Variable</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.variable || 0}</div>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>HOD Assigned</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{analyticsData.hod_assigned || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      case 'tasks':
        return (
          <div style={{ marginTop: '20px' }}>
            <TaskList
              tasks={tasks.filter(task => task.itemType === 'task')}
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
              setCategoryFilter={setCategoryFilter}
              viewTypeFilter={taskViewTypeFilter}
              setViewTypeFilter={setTaskViewTypeFilter}
              teamMemberFilter={taskTeamMemberFilter}
              setTeamMemberFilter={setTaskTeamMemberFilter}
              teamMembers={teamMembers}
              dashboardViewType={dashboardViewType}
              userRole={userProfile.user_type}
              showFilterBar={true}
            />
          </div>
        );
      case 'meetings':
        return (
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
              setCategoryFilter={setCategoryFilter}
              viewTypeFilter={meetingViewTypeFilter}
              setViewTypeFilter={setMeetingViewTypeFilter}
              teamMemberFilter={meetingTeamMemberFilter}
              setTeamMemberFilter={setMeetingTeamMemberFilter}
              teamMembers={teamMembers}
              userRole={userProfile.user_type}
            />
          </div>
        );
      case 'calendar':
        return (
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
        );
      case 'rnr':
        return (
          <div style={{ marginTop: '20px' }}>
            <RnR />
          </div>
        );
      default:
        return (
          <div style={{ backgroundColor: '#e0e0e0', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Page Not Found</h2>
              <p style={{ margin: '0', color: '#666' }}>This page is not available.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="home-container">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChangeFromSidebar}
          userRole="Sub Admin"
        />
        <Header
          addTask={() => {}}
          openPopup={openPopup}
          openAssignPopup={openAssignPopup}
          currentView={currentPage}
          onLogout={onLogout}
          user={{ user_type: "Sub Admin" }}
        />

        <main>
          {renderPage()}
        </main>

        <ProfilePanel
          open={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
        />
        {isDetailsOpen && <TaskDetails task={selectedTask} onClose={() => setIsDetailsOpen(false)} />}
        {isHistoryOpen && (
          <TaskHistoryPopup
            open={isHistoryOpen}
            onClose={closeHistoryPopup}
            taskId={selectedTaskId}
          />
        )}
      </div>

      {/* Modals positioned at root level to prevent clipping */}
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
        mode="assign"
        teamMembers={teamMembers}
      />
    </>
  );
};

export default SubAdminHome;