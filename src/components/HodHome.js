  import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
  import Sidebar from './Sidebar';
  import Header from './Header';
  import TaskList from './TaskList';
  import WeeklyTemplate from './WeeklyTemplate';
  import TaskPopup from './TaskPopup';
  import TaskDetails from './TaskDetails';
  import ProfilePanel from './ProfilePanel';
  import RnR from './RnR';
  import { FaChevronDown, FaTimes } from 'react-icons/fa';
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
  const [todayTasks, setTodayTasks] = useState([]);
  const [todayMeetings, setTodayMeetings] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [dashboardViewType, setDashboardViewType] = useState('self'); // 'self' or 'team' for dashboard
  const [dashboardDateFilter, setDashboardDateFilter] = useState('all');
  const [dashboardTaskTypeFilter, setDashboardTaskTypeFilter] = useState('');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('');
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState('');
  const [dashboardTeamMemberFilter, setDashboardTeamMemberFilter] = useState('');
  const [showDashboardDateDropdown, setShowDashboardDateDropdown] = useState(false);
  const [showDashboardTaskTypeDropdown, setShowDashboardTaskTypeDropdown] = useState(false);
  const [showDashboardStatusDropdown, setShowDashboardStatusDropdown] = useState(false);
  const [showDashboardCategoryDropdown, setShowDashboardCategoryDropdown] = useState(false);
  const [showDashboardTeamMemberDropdown, setShowDashboardTeamMemberDropdown] = useState(false);


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
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


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
          target_user_id: targetUserId
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
        ) : currentPage === 'rnr' ? (
          <div style={{ marginTop: '20px' }}>
            <RnR />
          </div>
        ) : (
           <div className="dashboard-container">
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
                     {dashboardTeamMemberFilter === 'all' ? 'All Team Members' :
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

             {/* Stats Cards Container */}
             <div style={{
               display: 'flex',
               gap: '20px',
               marginTop: '20px',
               marginBottom: '20px',
               flexWrap: 'wrap'
             }}>
               {/* Total Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '250px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Total Tasks</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#3b82f6'
                 }}>{monthlyStats?.total_tasks || 0}</div>
               </div>

               {/* Self Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '250px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Self Tasks</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#10b981'
                 }}>{monthlyStats?.self_tasks || 0}</div>
               </div>

               {/* Master Tasks Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '250px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Master Tasks</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#f59e0b'
                 }}>{tasks.filter(t => t.category === 'assigned').length}</div>
               </div>
             </div>

             {/* Status Cards Container */}
             <div style={{
               display: 'flex',
               gap: '20px',
               marginBottom: '20px',
               flexWrap: 'wrap'
             }}>
               {/* Done Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Done</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#22c55e'
                 }}>{monthlyStats?.completed || 0}</div>
               </div>

               {/* In Progress Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>In Progress</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#3b82f6'
                 }}>{monthlyStats?.in_progress || 0}</div>
               </div>

               {/* Not Started Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Not Started</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#f97316'
                 }}>{monthlyStats?.not_started || 0}</div>
               </div>

               {/* On Hold Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>On Hold</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#f59e0b'
                 }}>{tasks.filter(t => t.status === 'On Hold').length}</div>
               </div>

               {/* Cancelled Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Cancelled</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#ef4444'
                 }}>{tasks.filter(t => t.status === 'Cancelled').length}</div>
               </div>
             </div>

             {/* Team Member Cards Container */}
             <div style={{
               display: 'flex',
               gap: '20px',
               marginBottom: '20px',
               flexWrap: 'wrap'
             }}>
               {/* HOD Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>{userProfile?.name || 'HOD'}</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#8b5cf6'
                 }}>{tasks.filter(t => t.category === 'self').length}</div>
               </div>

               {/* Team Member Cards */}
               {[...teamMembers].sort((a, b) => a.name.localeCompare(b.name)).map(member => {
                 const memberTasks = tasks.filter(t => t.category === 'assigned' && t.users?.user_id === member.user_id).length;
                 return (
                   <div key={member.user_id} style={{
                     background: 'white',
                     borderRadius: '12px',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                     padding: '20px',
                     flex: '1',
                     minWidth: '200px',
                     textAlign: 'center'
                   }}>
                     <h3 style={{
                       margin: '0 0 10px 0',
                       fontSize: '16px',
                       fontWeight: '600',
                       color: '#374151'
                     }}>{member.name}</h3>
                     <div style={{
                       fontSize: '36px',
                       fontWeight: 'bold',
                       color: '#8b5cf6'
                     }}>{memberTasks}</div>
                   </div>
                 );
               })}
             </div>

             {/* Task Type Cards Container */}
             <div style={{
               display: 'flex',
               gap: '20px',
               marginBottom: '20px',
               flexWrap: 'wrap'
             }}>
               {/* Fixed Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Fixed</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#059669'
                 }}>{tasks.filter(t => t.task_type === 'Fixed').length}</div>
               </div>

               {/* Variable Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>Variable</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#dc2626'
                 }}>{tasks.filter(t => t.task_type === 'Variable').length}</div>
               </div>

               {/* HOD Assigned Card */}
               <div style={{
                 background: 'white',
                 borderRadius: '12px',
                 boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                 padding: '20px',
                 flex: '1',
                 minWidth: '200px',
                 textAlign: 'center'
               }}>
                 <h3 style={{
                   margin: '0 0 10px 0',
                   fontSize: '16px',
                   fontWeight: '600',
                   color: '#374151'
                 }}>HOD Assigned</h3>
                 <div style={{
                   fontSize: '36px',
                   fontWeight: 'bold',
                   color: '#7c3aed'
                 }}>{tasks.filter(t => t.task_type === 'HOD Assigned').length}</div>
               </div>
             </div>

            {/* Professional Dashboard Layout */}
            <div className="professional-dashboard">

              {/* Top Stats Row */}
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

              {/* Main Content Row */}
              <div className="main-content-row-compact">

                {/* Left Panel - Simple Visible Donut Chart */}
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
                          {/* Main Stats */}
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

                          {/* Simple Donut Chart with Bright Colored Segments */}
                          <div className="simple-donut-chart">
                            <div className="donut-container">
                              {/* Bright colored segments */}
                              <div className="donut-segments">
                                {/* Completed segment */}
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

                                {/* In Progress segment */}
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

                                {/* Pending segment */}
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

                              {/* Center circle */}
                              <div className="donut-center-bright">
                                <div className="donut-center-number">{totalTasks}</div>
                                <div className="donut-center-label">Tasks</div>
                              </div>
                            </div>

                            {/* Simple color indicators below */}
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

                          {/* Legend */}
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

                {/* Right Panel - Compact Actions and Recent Activity */}
                <div className="activity-panel-compact">

                  {/* Quick Actions */}
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

                  {/* Recent Items - More Compact with 4 items */}
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