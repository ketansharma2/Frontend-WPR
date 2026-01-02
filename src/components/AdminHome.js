import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import AdminUsers from "./AdminUsers";
import AdminRnR from "./AdminRnR";
import Header from "./Header";
import Sidebar from "./Sidebar";
import TaskList from './TaskList';
import WeeklyTemplate from './WeeklyTemplate';
import IndividualAnalytics from './IndividualAnalytics';
import TaskPopup from './TaskPopup';
import TaskDetails from './TaskDetails';
import ProfilePanel from './ProfilePanel';
import TaskStatsPanel from './TaskStatsPanel';
import DateToggleSwitch from './DateToggleSwitch';
import { FaChevronDown } from 'react-icons/fa';
import { api } from '../config/api';
import DeptTaskDistributionBar from './DeptTaskDistributionBar';
import DeptBreakdownChart from './DeptAnalytics/DeptBreakdownChart';
import MemberBreakdownChart from './DeptAnalytics/MemberBreakdownChart';
import DeptStatusChart from './DeptAnalytics/DeptStatusChart';
import SelfVsAssignedPieChart from './DeptAnalytics/SelfVsAssignedPieChart';
import "./AdminHome.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Error Boundary Component
class AdminUsersErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AdminUsers component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          margin: '20px'
        }}>
          <h3>Error Loading User Management</h3>
          <p>There was an error loading the user management page.</p>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminHome = ({ onLogout }) => {
   // Helper function for SVG donut chart calculations
   const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
     const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
     return {
       x: centerX + (radius * Math.cos(angleInRadians)),
       y: centerY + (radius * Math.sin(angleInRadians))
     };
   };

   // Default dates for dept analytics
   const today = new Date();
   // Calculate Monday of current week
   const mondayOfWeek = new Date(today);
   const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
   const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, subtract 6 days; otherwise subtract (day-1)
   mondayOfWeek.setDate(today.getDate() - daysToSubtract);

   // Calculate Saturday of current week
   const saturdayOfWeek = new Date(today);
   const daysToAdd = 6 - dayOfWeek; // Saturday is day 6, so add (6 - currentDay) days
   saturdayOfWeek.setDate(today.getDate() + daysToAdd);
   const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
   const [weeklyViewTypeFilter, setWeeklyViewTypeFilter] = useState('all');
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
   // Dept Analytics filters
   const [deptAnalyticsData, setDeptAnalyticsData] = useState({});
   const [deptAnalyticsFromDate, setDeptAnalyticsFromDate] = useState(formatDate(mondayOfWeek));
   const [deptAnalyticsToDate, setDeptAnalyticsToDate] = useState(formatDate(saturdayOfWeek));
   const [deptAnalyticsDeptFilter, setDeptAnalyticsDeptFilter] = useState('all');
   const [showDeptAnalyticsDeptDropdown, setShowDeptAnalyticsDeptDropdown] = useState(false);
   const [availableDepartments, setAvailableDepartments] = useState([]);

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
    // fetchAdminData('self', '', 'self', '', 'all', true);
    fetchTeamMembers(); // Fetch team members on mount
    fetchAvailableDepartments(); // Fetch available departments on mount
  }, []);

  // Refetch tasks when category filter changes
  useEffect(() => {
    if (userProfile && (taskTeamMemberFilter || meetingTeamMemberFilter)) {
      const cat = categoryFilter === '' ? 'all' : categoryFilter;
      fetchAdminData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, cat, false);
    }
  }, [categoryFilter, userProfile]);

  // Refetch data when any filter changes
  useLayoutEffect(() => {
    if (userProfile) {
      setLoading(false); // Ensure loading is false for filter changes
      setTasks([]); // Clear current tasks to prevent showing old data
      // Fetch data for any team member selection (including 'all')
      if (taskTeamMemberFilter || meetingTeamMemberFilter) {
        fetchAdminData(taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, 'all', false);
      }
      if (taskViewTypeFilter === 'team' || meetingViewTypeFilter === 'team') {
        fetchTeamMembers();
      }
    }
  }, [taskViewTypeFilter, taskTeamMemberFilter, meetingViewTypeFilter, meetingTeamMemberFilter, userProfile]);

  // Fetch data when user profile or dashboard view changes
  // useEffect(() => {
  //   if (userProfile?.user_id) {
  //     if (selectedDate === 'yesterday') {
  //       // Fetch yesterday data when in yesterday mode
  //       fetchLastWorkingDayData();
  //     } else {
  //       // Fetch today's data when in today mode
  //       fetchMonthlyStats();
  //     }
  //   }
  // }, [userProfile, dashboardViewType, dashboardTeamMember, selectedDate]);

  // Fetch Admin data from backend
  const fetchAdminData = async (taskViewType, taskTeamMember, meetingViewType, meetingTeamMember, category = 'all', showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));

      if (!token || !profile) {
        setError("Authentication required");
        return;
      }

      // Fetch tasks with Admin-specific filter
      let targetUserId = taskTeamMember || 'all'; // Default to 'all' if no specific member selected

      let tasksResponse = null;
      tasksResponse = await fetch(`${API_BASE_URL}/admin/tasks/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date_filter: taskDateFilter || 'all',
          task_type: taskTypeFilter || 'all',
          status: taskStatusFilter || 'all',
          category: category,
          target_user_id: targetUserId,
          custom_date: null
        })
      });

      // Fetch meetings with Admin-specific filter
      let targetUserIdMeetings = meetingTeamMember || 'all'; // Default to 'all' if no specific member selected

      let meetingsResponse = null;
      meetingsResponse = await fetch(`${API_BASE_URL}/admin/meetings/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          target_user_id: targetUserIdMeetings,
          date_filter: meetingDateFilter || 'all',
          status: meetingStatusFilter || 'all',
          custom_date: null
        })
      });

      let allTasks = [];

      // Handle tasks response
      if (tasksResponse && tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        console.log('Tasks data:', tasksData);

        // Combine tasks from both tables
        allTasks = [
          ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self', owner_name: task.users?.name || 'Unknown' })),
          ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned', assigned_by_user: task.users }))
        ];
      }

      // Handle meetings response
      if (meetingsResponse && meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json();
        console.log('Meetings data:', meetingsData);

        allTasks = [
          ...allTasks,
          ...(meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting', owner_name: meeting.owner_name || 'Unknown' }))
        ];
      }

      console.log('Combined tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));

      setTasks(allTasks);
      setPendingTasks(allTasks.filter(t => t.category === 'assigned' && t.status !== 'Not Started' && t.status !== 'In Progress'));

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
      const data = await api.getAssignMembers();
      setTeamMembers(data.members || []);
    } catch (err) {
      console.error("Error fetching team members:", err);
    }
  };
  
  // Fetch available departments
  const fetchAvailableDepartments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/dept-analytics/departments`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableDepartments(data.departments || []);
      } else {
        console.error('Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch department analytics data
  const fetchDeptAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/admin/dept-analytics/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dept: deptAnalyticsDeptFilter,
          date_from: deptAnalyticsFromDate,
          date_to: deptAnalyticsToDate
        })
      });
      if (response.ok) {
        const data = await response.json();
        setDeptAnalyticsData(data); // Store the full response including status counts
      } else {
        console.error('Failed to fetch dept analytics');
      }
    } catch (error) {
      console.error('Error fetching dept analytics:', error);
    }
  };

  // Fetch dept analytics when filters change
  useEffect(() => {
    if (userProfile && (currentPage === 'dept-analytics' || currentPage === 'dashboard')) {
      fetchDeptAnalytics();
    }
  }, [deptAnalyticsDeptFilter, deptAnalyticsFromDate, deptAnalyticsToDate, userProfile, currentPage]);

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

      const response = await fetch(`${API_BASE_URL}/admin/weekly/filter`, {
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
        setWeeklyTasks([...(data.self_tasks || []), ...(data.master_tasks || [])]);
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
  // const fetchMonthlyStats = async () => {
  //   try {
  //     setStatsLoading(true);
  //     setStatsError('');

  //     const profile = JSON.parse(localStorage.getItem("profile"));
  //     if (!profile?.user_id) {
  //       setStatsError("User profile not found");
  //       return;
  //     }

  //     // Determine target user based on dashboard view
  //     const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
  //       ? dashboardTeamMember
  //       : profile.user_id;

  //     const dashboardData = await api.getAdminDashboardData(userProfile.user_id, dashboardViewType, dashboardTeamMember);
  //     setMonthlyStats(dashboardData.monthly_stats);
  //     setTodayTasks(dashboardData.today.tasks);
  //     setTodayMeetings(dashboardData.today.meetings);
  //     return; // Skip the rest since we got all data in one call

  //   } catch (err) {
  //     console.error("Error fetching monthly stats:", err);
  //     setStatsError("Failed to load monthly statistics");
  //   } finally {
  //     setStatsLoading(false);
  //   }
  // };

  // Fetch last working day's tasks and meetings
  // const fetchLastWorkingDayData = async () => {
  //   try {
  //     const profile = JSON.parse(localStorage.getItem("profile"));
  //     if (!profile?.user_id) return;

  //     // Determine target user based on dashboard view
  //     const targetUserId = dashboardViewType === 'team' && dashboardTeamMember
  //       ? dashboardTeamMember
  //       : profile.user_id;

  //     const workingDayData = await api.getAdminYesterdayData(userProfile.user_id, dashboardViewType, dashboardTeamMember);

  //     if (workingDayData.found) {
  //       setYesterdayTasks(workingDayData.tasks || []);
  //       setYesterdayMeetings(workingDayData.meetings || []);
  //       setYesterdayDate(workingDayData.date);

  //       console.log(`Found last working day: ${workingDayData.date} (${workingDayData.days_back} days back)`);
  //       console.log(`Tasks: ${(workingDayData.tasks || []).length}, Meetings: ${(workingDayData.meetings || []).length}`);
  //     } else {
  //       // No working days found, show empty state
  //       setYesterdayTasks([]);
  //       setYesterdayMeetings([]);
  //       setYesterdayDate(null);
  //       console.log("No working days found in last 30 days");
  //     }
  //   } catch (err) {
  //     console.error("Error fetching last working day data:", err);
  //     setYesterdayTasks([]);
  //     setYesterdayMeetings([]);
  //     setYesterdayDate(null);
  //   }
  // };

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

      const response = await fetch(`${API_BASE_URL}/admin/assign/create`, {
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
        closeAssignPopup();
      } else {
        const errorData = await response.json();
        setError(`Failed to assign task: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error while assigning task: ${err.message}`);
    }
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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
      default:
        return (
          <div style={{
            backgroundColor: '#e0e0e0',
            minHeight: '100vh'
          }}>
            <div className="professional-filter-bar">
              <div className="filter-controls" style={{ gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '280px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#495057', whiteSpace: 'nowrap' }}>Date Range:</span>
                  <input
                    type="date"
                    value={deptAnalyticsFromDate}
                    onChange={(e) => setDeptAnalyticsFromDate(e.target.value)}
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
                    value={deptAnalyticsToDate}
                    onChange={(e) => setDeptAnalyticsToDate(e.target.value)}
                    style={{
                      padding: '4px 6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '11px',
                      width: '100px'
                    }}
                  />
                  {(deptAnalyticsFromDate || deptAnalyticsToDate) && (
                    <button
                      onClick={() => {
                        setDeptAnalyticsFromDate('');
                        setDeptAnalyticsToDate('');
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
                    className={`filter-btn ${deptAnalyticsDeptFilter !== 'all' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeptAnalyticsDeptDropdown(!showDeptAnalyticsDeptDropdown);
                    }}
                  >
                    Department: {deptAnalyticsDeptFilter === 'all' ? 'All' : deptAnalyticsDeptFilter}
                    <FaChevronDown className="dropdown-arrow" />
                  </button>
                  {showDeptAnalyticsDeptDropdown && (
                    <div className="dropdown-menu">
                      <div className="dropdown-item" onClick={() => { setDeptAnalyticsDeptFilter('all'); setShowDeptAnalyticsDeptDropdown(false); }}>All</div>
                      {availableDepartments.map(dept => (
                        <div
                          key={dept}
                          className="dropdown-item"
                          onClick={() => { setDeptAnalyticsDeptFilter(dept); setShowDeptAnalyticsDeptDropdown(false); }}
                        >
                          {dept}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Display */}
            <div style={{ padding: '20px 50px' }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '20px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {/* Main Distribution Chart */}
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  flex: '1',
                  minWidth: '300px'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>
                    {deptAnalyticsDeptFilter === 'all' ? 'Department Task Distribution' : `Task Distribution - ${deptAnalyticsDeptFilter}`}
                  </h4>
                  {deptAnalyticsDeptFilter === 'all' ? (
                    <DeptBreakdownChart data={deptAnalyticsData.dept_breakdown || {}} />
                  ) : (
                    <MemberBreakdownChart data={deptAnalyticsData.member_breakdown || {}} />
                  )}
                </div>

                {/* Status Distribution Chart */}
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  flex: '1',
                  minWidth: '300px'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>
                    Task Status Distribution - {deptAnalyticsDeptFilter === 'all' ? 'All Departments' : deptAnalyticsDeptFilter}
                  </h4>
                  <DeptStatusChart key={deptAnalyticsDeptFilter} data={deptAnalyticsData} />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '20px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {/* Self vs Assigned Tasks Chart */}
                <div style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  flex: '1',
                  minWidth: '300px'
                }}>
                  <h4 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>
                    Self vs Assigned Tasks - {deptAnalyticsDeptFilter === 'all' ? 'All Departments' : deptAnalyticsDeptFilter}
                  </h4>
                  {console.log('Rendering SelfVsAssignedPieChart with data:', { self: deptAnalyticsData.self_tasks || 0, assigned: deptAnalyticsData.assigned_tasks || 0 })}
                  <SelfVsAssignedPieChart data={{ self: deptAnalyticsData.self_tasks || 0, assigned: deptAnalyticsData.assigned_tasks || 0 }} />
                </div>
              </div>
            </div>
          </div>
        );
      case "tasks":
        return (
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
              showMyTasksOption={false}
              isAdminView={true}
              userRole={userProfile?.user_type}
            />
          </div>
        );
      case "meetings":
        return (
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
            isAdminView={true}
            showMyTasksOption={false}
            userRole={userProfile?.user_type}
          />
        );
      case "calendar":
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
              isAdminView={true}
            />
          </div>
        );
      case "users":
        return (
          <AdminUsersErrorBoundary>
            <AdminUsers />
          </AdminUsersErrorBoundary>
        );
      case "individual-analytics":
        return <IndividualAnalytics />;
      case "rnr":
        return <AdminRnR />;
    }
  };

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
        userRole={userProfile?.user_type || 'admin'}
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

      <main style={(currentPage === 'dept-analytics' || currentPage === 'dashboard') ? { backgroundColor: '#e0e0e0', padding: '20px 50px 50px 50px' } : { backgroundColor: '#e0e0e0' }}>
        {renderPage()}
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
}

export default AdminHome;