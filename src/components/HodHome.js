import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskList from './TaskList';
import WeeklyTemplate from './WeeklyTemplate';
import TaskPopup from './TaskPopup';
import TaskDetails from './TaskDetails';
import ProfilePanel from './ProfilePanel';
import TaskStatsPanel from './TaskStatsPanel';
import DateToggleSwitch from './DateToggleSwitch';
import { FaChevronDown } from 'react-icons/fa';
import { api } from '../config/api';
import './Home.css';
import './TaskList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const HodHome = ({ onLogout }) => {
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
  const [tasks, setTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [todayDataLoading, setTodayDataLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('today'); // 'today' or 'yesterday'
  const [yesterdayDate, setYesterdayDate] = useState(null); // Actual date found for yesterday
  const [yesterdayTasks, setYesterdayTasks] = useState([]);
  const [yesterdayMeetings, setYesterdayMeetings] = useState([]);
  const [dashboardViewType, setDashboardViewType] = useState('self'); // 'self' or 'team' for dashboard
  const [dashboardTeamMember, setDashboardTeamMember] = useState(''); // selected team member for dashboard
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);

  // Helper function for SVG donut chart calculations
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

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
    fetchHodData('self', '', 'self', '', 'all', true);
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
    if (userProfile) {
      setLoading(false); // Ensure loading is false for filter changes
      setTasks([]); // Clear current tasks to prevent showing old data
      // Only fetch meetings if team view has a selected member
      if (!(meetingViewTypeFilter === 'team' && !meetingTeamMemberFilter)) {
        fetchHodData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, 'all', false);
      }
      if (taskViewTypeFilter === 'team' || meetingViewTypeFilter === 'team' || taskViewTypeFilter === 'all' || meetingViewTypeFilter === 'all') {
        fetchTeamMembers();
      }
    }
  }, [taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, userProfile]);

  // Fetch data when user profile or dashboard view changes
  useEffect(() => {
    if (userProfile?.user_id) {
      if (selectedDate === 'yesterday') {
        // Fetch yesterday data when in yesterday mode
        fetchLastWorkingDayData();
      } else {
        // Fetch today's data when in today mode
        fetchMonthlyStats();
      }
    }
  }, [userProfile, dashboardViewType, dashboardTeamMember, selectedDate]);


  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu') && !event.target.closest('.filter-btn')) {
        setShowTeamMemberDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Sync filter with current page on page changes
  useEffect(() => {
    if (currentPage === 'tasks' && filter !== 'task') {
      setFilter('task');
    } else if (currentPage === 'meetings' && filter !== 'meeting') {
      setFilter('meeting');
    }
  }, [currentPage, filter]);


  // Fetch HOD data from backend
  const fetchHodData = async (taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, category = 'all', showLoading = true) => {
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
          date_filter: 'all',
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
          allTasks = [
            ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users })),
            ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self', owner_name: task.users?.name || 'Unknown' })),
            ...(meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting', owner_name: meeting.owner_name || 'Unknown' }))
          ];
        } else {
          // If tasks failed, still show meetings
          console.warn('Tasks API failed, showing only meetings');
          allTasks = (meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting' }));
        }

        console.log('Combined tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));

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

  // Fetch monthly task statistics
  const fetchMonthlyStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError('');

      const profile = JSON.parse(localStorage.getItem("profile"));
      if (!profile?.user_id) {
        setStatsError("User profile not found");
        return;
      }

      // Determine target user based on dashboard view
      const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
        ? dashboardTeamMember
        : profile.user_id;

      const dashboardData = await api.getHodDashboardData(userProfile.user_id, dashboardViewType, dashboardTeamMember);
      setMonthlyStats(dashboardData.monthly_stats);
      setTodayTasks(dashboardData.today.tasks);
      setTodayMeetings(dashboardData.today.meetings);
      return; // Skip the rest since we got all data in one call

    } catch (err) {
      console.error("Error fetching monthly stats:", err);
      setStatsError("Failed to load monthly statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch today's tasks
  const fetchTodayTasks = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem("profile"));
      if (!profile?.user_id) return;

      // Determine target user based on dashboard view
      const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
        ? dashboardTeamMember
        : profile.user_id;

      const tasksData = await api.getTodayTasks(targetUserId);
      setTodayTasks(tasksData.tasks || []);
    } catch (err) {
      console.error("Error fetching today's tasks:", err);
      setTodayTasks([]);
    }
  };

  // Fetch today's meetings
  const fetchTodayMeetings = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem("profile"));
      if (!profile?.user_id) return;

      // Determine target user based on dashboard view
      const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
        ? dashboardTeamMember
        : profile.user_id;

      const meetingsData = await api.getTodayMeetings(targetUserId);
      setTodayMeetings(meetingsData.meetings || []);
    } catch (err) {
      console.error("Error fetching today's meetings:", err);
      setTodayMeetings([]);
    }
  };

  // Fetch last working day's tasks and meetings
  const fetchLastWorkingDayData = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem("profile"));
      if (!profile?.user_id) return;

      // Determine target user based on dashboard view
      const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
        ? dashboardTeamMember
        : profile.user_id;

      const workingDayData = await api.getHodYesterdayData(userProfile.user_id, dashboardViewType, dashboardTeamMember);

      if (workingDayData.found) {
        setYesterdayTasks(workingDayData.tasks || []);
        setYesterdayMeetings(workingDayData.meetings || []);
        setYesterdayDate(workingDayData.date);

        console.log(`Found last working day: ${workingDayData.date} (${workingDayData.days_back} days back)`);
        console.log(`Tasks: ${(workingDayData.tasks || []).length}, Meetings: ${(workingDayData.meetings || []).length}`);
      } else {
        // No working days found, show empty state
        setYesterdayTasks([]);
        setYesterdayMeetings([]);
        setYesterdayDate(null);
        console.log("No working days found in last 30 days");
      }
    } catch (err) {
      console.error("Error fetching last working day data:", err);
      setYesterdayTasks([]);
      setYesterdayMeetings([]);
      setYesterdayDate(null);
    }
  };

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
          description: task.description || '' // Add description field
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

        // Add the new task to local state immediately for instant UI update
        const newTask = {
          ...result.task || result.meeting,
          itemType: task.itemType
        };

        setTasks(prevTasks => [...prevTasks, newTask]);

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
          file_link: updatedTask.file_link || updatedTask.attachments
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
  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);

    // Sync filter with page for consistent behavior
    if (pageId === 'tasks') {
      setFilter('task');
    } else if (pageId === 'meetings') {
      setFilter('meeting');
    }
  };

  const handleDateToggle = async (newDate) => {
    setSelectedDate(newDate);

    // Data fetching is now handled by the useEffect based on selectedDate
    console.log('Date toggled to:', newDate);
  };

  // Dynamic colors based on selected date
  const getHeaderColors = () => {
    if (selectedDate === 'yesterday') {
      return {
        planningHeader: '#2986cc',    // Yesterday's Task Header
        planningSubheader: '#9fc5e8', // Yesterday's Task Subheader
        meetingsHeader: '#e06666',    // Yesterday's Meetings Header
        meetingsSubheader: '#f4cccc'  // Yesterday's Meetings Subheader
      };
    } else {
      return {
        planningHeader: '#166534',    // Today's Task Header
        planningSubheader: '#9dcfb0', // Today's Task Subheader
        meetingsHeader: '#e27326',    // Today's Meetings Header
        meetingsSubheader: '#fed7aa'  // Today's Meetings Subheader
      };
    }
  };

  const colors = getHeaderColors();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    onLogout();
  };

  if (initialLoading) {
    return (
      <div>
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
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
        currentPage={currentPage}
        onPageChange={handlePageChange}
        userRole={userProfile.user_type}
      />
      <Header
        addTask={addTask}
        openPopup={openPopup}
        openAssignPopup={openAssignPopup}
        currentView={currentPage}
        onLogout={handleLogout}
        user={userProfile}
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

      <main style={{ backgroundColor: '#e0e0e0' }}>
        {currentPage === 'tasks' ? (
          <div style={{ marginTop: '20px' }}>
            <TaskList
              tasks={tasks.filter(task => task.itemType === 'task')}
              onEdit={editTask}
              onViewDetails={onViewDetails}
              onDelete={deleteTask}
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
              setCategoryFilter={setCategoryFilter}
              viewTypeFilter={meetingViewTypeFilter}
              setViewTypeFilter={setMeetingViewTypeFilter}
              teamMemberFilter={meetingTeamMemberFilter}
              setTeamMemberFilter={setMeetingTeamMemberFilter}
              teamMembers={teamMembers}
              userRole={userProfile.user_type}
            />
          </div>
        ) : (
           <div className="dashboard-container">
             {/* Monthly Task Statistics Panel */}
             <div style={{ marginTop: '15px' }}>
               <TaskStatsPanel
                 stats={monthlyStats}
                 loading={statsLoading}
                 error={statsError}
               />
             </div>

             {/* Dashboard Filters - Same design as TaskList */}
             <div className="professional-filter-bar" style={{ marginTop: '15px', marginBottom: '10px' }}>
               <div className="filter-controls" style={{ justifyContent: 'flex-end', width: '100%', gap: '15px' }}>
                 {/* Team Member Filter */}
                 <div className="filter-dropdown">
                   <button
                     className={`filter-btn ${dashboardViewType === 'team' ? 'active' : ''}`}
                     onClick={() => setShowTeamMemberDropdown(!showTeamMemberDropdown)}
                   >
                     {dashboardViewType === 'self' ? 'My Dashboard' : dashboardViewType === 'all' ? 'All Team Members' : (teamMembers.find(m => m.user_id === dashboardTeamMember)?.name || 'Team Member')}
                     <FaChevronDown className="dropdown-arrow" />
                   </button>
                   {showTeamMemberDropdown && (
                     <div className="dropdown-menu">
                       <div
                         className="dropdown-item"
                         onClick={() => {
                           setDashboardViewType('self');
                           setDashboardTeamMember('');
                           setShowTeamMemberDropdown(false);
                         }}
                         style={{
                           fontWeight: dashboardViewType === 'self' ? '600' : '400',
                           backgroundColor: dashboardViewType === 'self' ? '#f3f4f6' : 'white'
                         }}
                       >
                         My Dashboard
                       </div>
                       <div
                         className="dropdown-item"
                         onClick={() => {
                           setDashboardViewType('all');
                           setDashboardTeamMember('all');
                           setShowTeamMemberDropdown(false);
                         }}
                         style={{
                           fontWeight: dashboardViewType === 'all' ? '600' : '400',
                           backgroundColor: dashboardViewType === 'all' ? '#f3f4f6' : 'white'
                         }}
                       >
                         All Team Members
                       </div>
                       {teamMembers && teamMembers.length > 0 ? teamMembers.map(member => (
                         <div
                           key={member.user_id}
                           className="dropdown-item"
                           onClick={() => {
                             setDashboardViewType('team');
                             setDashboardTeamMember(member.user_id);
                             setShowTeamMemberDropdown(false);
                           }}
                           style={{
                             fontWeight: dashboardTeamMember === member.user_id ? '600' : '400',
                             backgroundColor: dashboardTeamMember === member.user_id ? '#f3f4f6' : 'white'
                           }}
                         >
                           {member.name}
                         </div>
                       )) : (
                         <div className="dropdown-item disabled">
                           No team members available
                         </div>
                       )}
                     </div>
                   )}
                 </div>

                 {/* Date Filter Toggle */}
                 <DateToggleSwitch
                   onToggle={handleDateToggle}
                   active={selectedDate === 'today' ? 'Today' : 'Yesterday'}
                 />
               </div>
             </div>

             {/* Today's Planning Section - Header and Table in Single Container */}
             <div style={{
               background: 'white',
               borderRadius: '12px',
               boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
               width: '100%',
               overflow: 'hidden',
               marginBottom: '30px'
             }}>
               {/* Today's Planning Table Header */}
               <div style={{
                 background: colors.planningHeader,
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
                   {selectedDate === 'yesterday'
                     ? (yesterdayDate ? `Last Working Day Tasks` : "Yesterday's Tasks")
                     : "Today's Planning"
                   }
                 </h3>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <span style={{
                     fontSize: '14px',
                     fontWeight: '500',
                     color: 'white',
                     opacity: '0.9'
                   }}>
                     {(() => {
                       if (selectedDate === 'yesterday' && yesterdayDate) {
                         // Show the actual working day found
                         const date = new Date(yesterdayDate);
                         const day = date.getDate();
                         const month = date.toLocaleDateString('en-US', { month: 'short' });
                         const year = date.getFullYear();
                         return `${day} ${month} ${year}`;
                       } else {
                         // Show calendar yesterday or today
                         const date = selectedDate === 'yesterday'
                           ? new Date(Date.now() - 24 * 60 * 60 * 1000)
                           : new Date();
                         const day = date.getDate();
                         const month = date.toLocaleDateString('en-US', { month: 'short' });
                         const year = date.getFullYear();
                         return `${day} ${month} ${year}`;
                       }
                     })()}
                   </span>
                   {/* View All button for tasks */}
                   {(selectedDate === 'yesterday' ? yesterdayTasks : todayTasks).length > 10 && (
                     <button
                       onClick={() => setShowAllTasks(!showAllTasks)}
                       style={{
                         background: 'rgba(255, 255, 255, 0.2)',
                         border: '1px solid rgba(255, 255, 255, 0.3)',
                         color: 'white',
                         padding: '6px 12px',
                         borderRadius: '6px',
                         fontSize: '12px',
                         fontWeight: '500',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                     >
                       {showAllTasks ? 'Show Less' : `View All (${(selectedDate === 'yesterday' ? yesterdayTasks : todayTasks).length})`}
                     </button>
                   )}
                 </div>
               </div>

               {/* Today's Planning Table */}
               <div style={{
                 padding: '0',
                 margin: '0'
               }}>
               <table style={{
                 width: '100%',
                 borderCollapse: 'collapse',
                 margin: '0'
               }}>
                 <thead>
                   <tr style={{
                     background: colors.planningSubheader,
                     borderBottom: '2px solid #e2e8f0'
                   }}>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '50px',
                       width: 'auto'
                     }}>S.No</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '120px',
                       width: 'auto'
                     }}>Task Name</th>
                     {dashboardViewType !== 'self' && (
                       <th style={{
                         padding: '6px 8px',
                         textAlign: 'center',
                         fontWeight: '600',
                         fontSize: '14px',
                         color: 'black',
                         borderRight: '1px solid #e5e7eb',
                         minWidth: '80px',
                         width: 'auto'
                       }}>Owner</th>
                     )}
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '80px',
                       width: 'auto'
                     }}>Deadline</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '80px',
                       width: 'auto'
                     }}>Task Type</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '70px',
                       width: 'auto'
                     }}>Status</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '100px',
                       width: 'auto'
                     }}>Time (in mins)</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       minWidth: '60px',
                       width: 'auto'
                     }}>Link</th>
                   </tr>
                 </thead>
                 <tbody>
                   {(selectedDate === 'yesterday' ? yesterdayTasks : todayTasks).length > 0 ? (
                     (selectedDate === 'yesterday' ? yesterdayTasks : todayTasks)
                       .slice(0, showAllTasks ? undefined : 10)
                       .map((task, index) => (
                       <tr key={task.task_id || index} style={{
                         backgroundColor: 'white',
                         borderBottom: '1px solid #e2e8f0'
                       }}>
                         <td style={{ padding: '6px 8px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                         <td style={{ padding: '6px 8px', color: '#374151', fontWeight: '500' }}>{task.task_name || task.name}</td>
                         {dashboardViewType !== 'self' && (
                           <td style={{ padding: '6px 8px', color: '#374151', fontWeight: '500' }}>{task.owner_name || 'N/A'}</td>
                         )}
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{task.timeline || 'N/A'}</td>
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{task.task_type || 'work'}</td>
                         <td style={{ padding: '8px 12px' }}>
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
                         <td style={{ padding: '8px 12px', color: '#374151' }}>
                           {task.time_in_mins || task.time || 'N/A'}
                         </td>
                         <td style={{ padding: '8px 12px', color: '#374151' }}>
                           {task.file_link ? (
                             <a href={task.file_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                               Link
                             </a>
                           ) : 'N/A'}
                         </td>
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={dashboardViewType === 'self' ? 8 : 9} style={{
                         padding: '40px 16px',
                         textAlign: 'center',
                         color: '#6b7280'
                       }}>
                         {selectedDate === 'yesterday'
                           ? (yesterdayDate
                               ? `No tasks found for ${yesterdayDate}`
                               : "No working days found in the last 30 days")
                           : "No tasks scheduled for today"
                         }
                       </td>
                     </tr>
                   )}
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
               overflow: 'hidden',
               marginBottom: '20px'
             }}>
               {/* Today's Meetings Table Header */}
               <div style={{
                 background: colors.meetingsHeader,
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
                   {selectedDate === 'yesterday'
                     ? (yesterdayDate ? `Last Working Day Meetings` : "Yesterday's Meetings")
                     : "Today's Meetings"
                   }
                 </h3>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <span style={{
                     fontSize: '14px',
                     fontWeight: '500',
                     color: 'white',
                     opacity: '0.9'
                   }}>
                     {(() => {
                       if (selectedDate === 'yesterday' && yesterdayDate) {
                         // Show the actual working day found
                         const date = new Date(yesterdayDate);
                         const day = date.getDate();
                         const month = date.toLocaleDateString('en-US', { month: 'short' });
                         const year = date.getFullYear();
                         return `${day} ${month} ${year}`;
                       } else {
                         // Show calendar yesterday or today
                         const date = selectedDate === 'yesterday'
                           ? new Date(Date.now() - 24 * 60 * 60 * 1000)
                           : new Date();
                         const day = date.getDate();
                         const month = date.toLocaleDateString('en-US', { month: 'short' });
                         const year = date.getFullYear();
                         return `${day} ${month} ${year}`;
                       }
                     })()}
                   </span>
                   {/* View All button for meetings */}
                   {(selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings).length > 10 && (
                     <button
                       onClick={() => setShowAllMeetings(!showAllMeetings)}
                       style={{
                         background: 'rgba(255, 255, 255, 0.2)',
                         border: '1px solid rgba(255, 255, 255, 0.3)',
                         color: 'white',
                         padding: '6px 12px',
                         borderRadius: '6px',
                         fontSize: '12px',
                         fontWeight: '500',
                         cursor: 'pointer',
                         transition: 'all 0.2s ease'
                       }}
                       onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                       onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                     >
                       {showAllMeetings ? 'Show Less' : `View All (${(selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings).length})`}
                     </button>
                   )}
                 </div>
               </div>

               {/* Today's Meetings Table */}
               <div style={{
                 padding: '0',
                 margin: '0'
               }}>
               <table style={{
                 width: '100%',
                 borderCollapse: 'collapse',
                 margin: '0'
               }}>
                 <thead>
                   <tr style={{
                     background: colors.meetingsSubheader,
                     borderBottom: '2px solid #e2e8f0'
                   }}>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '50px',
                       width: 'auto'
                     }}>S.No</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '120px',
                       width: 'auto'
                     }}>Meeting name</th>
                     {dashboardViewType !== 'self' && (
                       <th style={{
                         padding: '6px 8px',
                         textAlign: 'center',
                         fontWeight: '600',
                         fontSize: '14px',
                         color: 'black',
                         borderRight: '1px solid #e5e7eb',
                         minWidth: '80px',
                         width: 'auto'
                       }}>Owner</th>
                     )}
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '60px',
                       width: 'auto'
                     }}>Dept</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '80px',
                       width: 'auto'
                     }}>Co Person</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '100px',
                       width: 'auto'
                     }}>Time (in mins)</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '80px',
                       width: 'auto'
                     }}>Prop Slot</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       borderRight: '1px solid #e5e7eb',
                       minWidth: '70px',
                       width: 'auto'
                     }}>Status</th>
                     <th style={{
                       padding: '6px 8px',
                       textAlign: 'center',
                       fontWeight: '600',
                       fontSize: '14px',
                       color: 'black',
                       minWidth: '100px',
                       width: 'auto'
                     }}>Notes</th>
                   </tr>
                 </thead>
                 <tbody>
                   {(selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings).length > 0 ? (
                     (selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings)
                       .slice(0, showAllMeetings ? undefined : 10)
                       .map((meeting, index) => (
                       <tr key={meeting.meeting_id || index} style={{
                         backgroundColor: 'white',
                         borderBottom: '1px solid #e2e8f0'
                       }}>
                         <td style={{ padding: '6px 8px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                         <td style={{ padding: '6px 8px', color: '#374151', fontWeight: '500' }}>{meeting.meeting_name || meeting.name}</td>
                         {dashboardViewType !== 'self' && (
                           <td style={{ padding: '6px 8px', color: '#374151' }}>{meeting.owner_name || 'N/A'}</td>
                         )}
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{meeting.dept || 'N/A'}</td>
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{meeting.co_person || 'N/A'}</td>
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{meeting.time || 'N/A'}</td>
                         <td style={{ padding: '6px 8px', color: '#374151' }}>{meeting.prop_slot || 'N/A'}</td>
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
                       </tr>
                     ))
                   ) : (
                     <tr>
                       <td colSpan={dashboardViewType === 'self' ? 7 : 8} style={{
                         padding: '40px 16px',
                         textAlign: 'center',
                         color: '#6b7280'
                       }}>
                         {selectedDate === 'yesterday'
                           ? (yesterdayDate
                               ? `No meetings found for ${yesterdayDate}`
                               : "No working days found in the last 30 days")
                           : "No meetings scheduled for today"
                         }
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
               </div>
             </div>

            {/* Professional Dashboard Layout - COMMENTED OUT */}
            {/*
            <div className="professional-dashboard">

              Top Stats Row
              <div className="stats-row">
                <div className="stat-card-compact" onClick={() => handlePageChange('tasks')}>
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <div className="stat-number">{tasks.filter(t => t.itemType === 'task').length}</div>
                    <div className="stat-label">Total Tasks</div>
                    <div className="stat-sublabel">{tasks.filter(t => t.itemType === 'task' && t.status === 'pending').length} pending</div>
                  </div>
                </div>
                <div className="stat-card-compact" onClick={() => handlePageChange('meetings')}>
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-number">{tasks.filter(t => t.itemType === 'meeting').length}</div>
                    <div className="stat-label">Meetings</div>
                    <div className="stat-sublabel">{tasks.filter(t => t.itemType === 'meeting' && t.status === 'scheduled').length} scheduled</div>
                  </div>
                </div>
                <div className="stat-card-compact" onClick={() => handlePageChange('tasks')}>
                  <div className="stat-icon">🚀</div>
                  <div className="stat-content">
                    <div className="stat-number">{tasks.filter(t => t.status === 'in-progress').length}</div>
                    <div className="stat-label">In Progress</div>
                    <div className="stat-sublabel">{Math.round((tasks.filter(t => t.status === 'in-progress').length / Math.max(tasks.filter(t => t.itemType === 'task').length, 1)) * 100)}% of tasks</div>
                  </div>
                </div>
                <div className="stat-card-compact" onClick={() => handlePageChange('tasks')}>
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-number">{tasks.filter(t => t.status === 'completed').length}</div>
                    <div className="stat-label">Completed</div>
                    <div className="stat-sublabel">{Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.filter(t => t.itemType === 'task').length, 1)) * 100)}% completion</div>
                  </div>
                </div>
              </div>

              Main Content Row
              <div className="main-content-row-compact">

                Left Panel - Simple Visible Donut Chart
                <div className="chart-panel-compact">
                  <h3 className="section-title-compact">Task Distribution</h3>
                  <div className="simple-donut-container">
                    {(() => {
                      const taskItems = tasks.filter(t => t.itemType === 'task');
                      const totalTasks = taskItems.length;
                      const completed = taskItems.filter(t => t.status === 'completed').length;
                      const pending = taskItems.filter(t => t.status === 'pending').length;
                      const inProgress = taskItems.filter(t => t.status === 'in-progress').length;

                      console.log('Chart Data:', { totalTasks, completed, pending, inProgress });

                      if (totalTasks === 0) {
                        return (
                          <div className="no-data-chart">
                            <div className="no-data-icon">📊</div>
                            <p className="no-data-text">No tasks available</p>
                            <button className="create-first-btn-compact" onClick={openPopup}>
                              Create Task
                            </button>
                          </div>
                        );
                      }

                      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

                      return (
                        <div className="simple-donut-wrapper">
                          Main Stats
                          <div className="main-stats">
                            <div className="main-stat-item">
                              <span className="main-stat-number">{totalTasks}</span>
                              <span className="main-stat-label">Total Tasks</span>
                            </div>
                            <div className="main-stat-item">
                              <span className="main-stat-number completion">{completionRate}%</span>
                              <span className="main-stat-label">Complete</span>
                            </div>
                          </div>

                          Simple Donut Chart with Bright Colored Segments
                          <div className="simple-donut-chart">
                            <div className="donut-container">
                              Bright colored segments
                              <div className="donut-segments">
                                Completed segment
                                {completed > 0 && (
                                  <div
                                    className="donut-segment completed"
                                    style={{
                                      backgroundColor: '#22c55e',
                                      transform: `rotate(0deg)`,
                                      width: `${(completed / totalTasks) * 100}%`
                                    }}
                                  ></div>
                                )}

                                In Progress segment
                                {inProgress > 0 && (
                                  <div
                                    className="donut-segment in-progress"
                                    style={{
                                      backgroundColor: '#3b82f6',
                                      transform: `rotate(${completed * 360 / totalTasks}deg)`,
                                      width: `${(inProgress / totalTasks) * 100}%`
                                    }}
                                  ></div>
                                )}

                                Pending segment
                                {pending > 0 && (
                                  <div
                                    className="donut-segment pending"
                                    style={{
                                      backgroundColor: '#f97316',
                                      transform: `rotate(${(completed + inProgress) * 360 / totalTasks}deg)`,
                                      width: `${(pending / totalTasks) * 100}%`
                                    }}
                                  ></div>
                                )}
                              </div>

                              Center circle
                              <div className="donut-center-bright">
                                <div className="donut-center-number">{totalTasks}</div>
                                <div className="donut-center-label">Tasks</div>
                              </div>
                            </div>

                            Simple color indicators below
                            <div className="color-indicators">
                              <div className="color-item">
                                <div className="color-box completed-color"></div>
                                <span>Completed ({completed})</span>
                              </div>
                              <div className="color-item">
                                <div className="color-box inprogress-color"></div>
                                <span>In Progress ({inProgress})</span>
                              </div>
                              <div className="color-item">
                                <div className="color-box pending-color"></div>
                                <span>Pending ({pending})</span>
                              </div>
                            </div>
                          </div>

                          Legend
                          <div className="simple-legend">
                            <div className="legend-row">
                              <div className="legend-item">
                                <div className="legend-dot" style={{backgroundColor: '#10b981'}}></div>
                                <span className="legend-text">Completed ({completed})</span>
                              </div>
                              <div className="legend-item">
                                <div className="legend-dot" style={{backgroundColor: '#3b82f6'}}></div>
                                <span className="legend-text">In Progress ({inProgress})</span>
                              </div>
                            </div>
                            <div className="legend-row">
                              <div className="legend-item">
                                <div className="legend-dot" style={{backgroundColor: '#f59e0b'}}></div>
                                <span className="legend-text">Pending ({pending})</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                Right Panel - Compact Actions and Recent Activity
                <div className="activity-panel-compact">

                  Quick Actions
                  <div className="actions-section-compact">
                    <h3 className="section-title-compact">Quick Actions</h3>
                    <div className="action-buttons-grid-compact">
                      <button className="action-btn-compact primary" onClick={openPopup}>
                        ➕ New Task
                      </button>
                      <button className="action-btn-compact" onClick={() => handlePageChange('tasks')}>
                        📋 Tasks
                      </button>
                      <button className="action-btn-compact" onClick={() => handlePageChange('meetings')}>
                        📅 Meetings
                      </button>
                      <button className="action-btn-compact" onClick={() => handlePageChange('calendar')}>
                        📊 Report
                      </button>
                    </div>
                  </div>

                  Recent Items - More Compact with 4 items
                  <div className="activity-section-compact">
                    <h3 className="section-title-compact">Recent Items</h3>
                    <div className="activity-list-super-compact">
                      {tasks.slice(0, 4).map((task, index) => (
                        <div key={index} className="activity-item-super-compact">
                          <div className={`activity-icon-super-compact ${task.itemType === 'meeting' ? 'meeting' : 'task'}`}>
                            {task.itemType === 'meeting' ? '📅' : '📋'}
                          </div>
                          <div className="activity-content-super-compact">
                            <div className="activity-title-super-compact">
                              {task.task_name || task.meeting_name || task.name}
                            </div>
                            <div className="activity-meta-super-compact">
                              {task.itemType === 'meeting' ? 'Meeting' : 'Task'} • {task.status}
                            </div>
                          </div>
                          <span className={`status-indicator-super-compact ${task.status}`}></span>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="no-activity-super-compact">
                          <p>No items yet. Create your first task.</p>
                          <button className="create-first-btn-super-compact" onClick={openPopup}>
                            Create Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            */}

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
      />
      <TaskPopup
        open={isAssignPopupOpen}
        onClose={closeAssignPopup}
        addTask={assignTask}
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