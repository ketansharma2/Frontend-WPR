import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TaskList from './TaskList';
import WeeklyTemplate from './WeeklyTemplate';
import TaskPopup from './TaskPopup';
import TaskDetails from './TaskDetails';
import ProfilePanel from './ProfilePanel';
import TaskStatsPanel from './TaskStatsPanel';
import DateToggleSwitch from './DateToggleSwitch';
// import FullTaskPage from './FullTaskPage';
import RnR from './RnR';
import RandR from './RandR'
import FullTaskPage from './FullTaskPage';
import MonthlyProjection from './MonthlyProjection';
import { api } from '../config/api';
import { FaEllipsisV, FaExternalLinkAlt } from 'react-icons/fa';
import './Home.css';
import { History } from "lucide-react";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const Home = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: taskId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('task');
  const [dateFilter, setDateFilter] = useState('all');
  const [taskTypeFilter, setTaskTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [weeklyTaskTypeFilter, setWeeklyTaskTypeFilter] = useState('');
  const [weeklyStatusFilter, setWeeklyStatusFilter] = useState('');
  const [weeklyCategoryFilter, setWeeklyCategoryFilter] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const [menuOpen, setMenuOpen] = useState(null);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  const [isRemarksRequired, setIsRemarksRequired] = useState(null);
  
  // Fetch tasks from backend
  const fetchTasks = async (category = 'all') => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));
      
      if (!token || !profile) {
        setError("Authentication required");
        return;
      }
  
      // Fetch tasks with user filter
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          date_filter: 'all',
          task_type: 'all',
          status: 'all',
          category
        })
      });
  
      // Fetch meetings
      const meetingsResponse = await fetch(`${API_BASE_URL}/meetings/filter`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: profile.user_id,
          date_filter: 'all',
          status: 'all'
        })
      });
  
      if (tasksResponse.ok && meetingsResponse.ok) {
        const tasksData = await tasksResponse.json();
        const meetingsData = await meetingsResponse.json();
        
        console.log('Tasks data:', tasksData);
        console.log('Meetings data:', meetingsData);
        
        // Combine tasks and meetings into a single array - master_tasks first, then self_tasks
        const allTasks = [
          ...(tasksData.master_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'assigned' })),
          ...(tasksData.self_tasks || []).map(task => ({ ...task, itemType: 'task', category: 'self' })),
          ...(meetingsData.meetings || []).map(meeting => ({ ...meeting, itemType: 'meeting' }))
        ];
        
        console.log('Combined tasks with descriptions:', allTasks.map(t => ({ name: t.task_name, description: t.description })));
        setTasks(allTasks);
      } else {
        const tasksError = tasksResponse.ok ? null : await tasksResponse.json();
        const meetingsError = meetingsResponse.ok ? null : await meetingsResponse.json();
        console.error('Tasks error:', tasksError);
        console.error('Meetings error:', meetingsError);
        setError("Failed to fetch data from server");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch weekly report data
  const fetchWeeklyData = async (filters = {}, showLoading = true) => {
    try {
      if (showLoading) setWeeklyLoading(true);
      const token = localStorage.getItem("token");
      const profile = JSON.parse(localStorage.getItem("profile"));
     
      if (!token || !profile) {
        setError("Authentication required");
        return;
      }
  
      console.log('Fetching weekly data for user:', profile.user_id, 'with filters:', filters);
      
      const response = await fetch(`${API_BASE_URL}/weekly`, {
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
        console.log('Weekly data fetched:', data);
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
  };
  
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
  
      const stats = await api.getMonthlyStats(profile.user_id);
      setMonthlyStats(stats);
  
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
  
      const tasksData = await api.getTodayTasks(profile.user_id);
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
  
      const meetingsData = await api.getTodayMeetings(profile.user_id);
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
        // No working days found, show empty state
        setYesterdayTasks([]);
        setYesterdayMeetings([]);
        setYesterdayDate(null);
        setIsRemarksRequired(false); // Allow auto-populate to run
        console.log("No working days found in last 30 days");
      }
    } catch (err) {
      console.error("Error fetching last working day data:", err);
      setYesterdayTasks([]);
      setYesterdayMeetings([]);
      setYesterdayDate(null);
      setIsRemarksRequired(false); // Allow auto-populate to run even on error
    }
  };
  
  // Auto-populate fixed tasks for today
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
        console.log('Auto-populate result:', result);
        if (result.populated_tasks?.length > 0) {
          alert(`✅ Success: ${result.populated_tasks.length} fixed tasks populated for today!`);
        }
        // Refresh today's tasks
        fetchTodayTasks();
      } else {
        const error = await response.json();
        alert(`❌ Failed: ${error.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error auto-populating fixed tasks:', error);
      alert('❌ Failed: Network error while auto-populating tasks');
    }
  };
  
  // Determine current page from URL path
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/home') return 'home';
    if (path === '/tasks') return 'tasks';
    if (path === '/meetings') return 'meetings';
    if (path === '/calendar') return 'calendar';
    if (path === '/rnr') return 'rnr';
    if (path === '/projection') return 'projection';
    return 'home'; // default
  };
  
  const currentPage = getCurrentPage();
  
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
    fetchTasks();
  }, []);
  
  // Refetch tasks when category filter changes
  useEffect(() => {
    if (userProfile) {
      const cat = categoryFilter === '' ? 'all' : categoryFilter;
      fetchTasks(cat);
    }
  }, [categoryFilter, userProfile]);
  
  // Fetch weekly data when calendar page is accessed
  // useEffect(() => {
  //   if (currentPage === 'calendar' && userProfile) {
  //     fetchWeeklyData();
  //   }
  // }, [currentPage, userProfile]);
  // Add this useEffect after the existing ones
useEffect(() => {
  if (currentPage === 'calendar' && userProfile) {
    // Build filters object
    const filters = {
      task_type: weeklyTaskTypeFilter ,
      status: weeklyStatusFilter ,
      category: weeklyCategoryFilter
    };
    
    // Fetch with filters, but don't show loading indicator for filter changes to avoid flicker
    fetchWeeklyData(filters, false);
  }
}, [currentPage, userProfile, weeklyTaskTypeFilter, weeklyStatusFilter, weeklyCategoryFilter]);
  
  // Sync filter with current page on page changes
  useEffect(() => {
    if (currentPage === 'tasks' && filter !== 'task') {
      setFilter('task');
    } else if (currentPage === 'meetings' && filter !== 'meeting') {
      setFilter('meeting');
    }
  }, [currentPage, filter]);
  
  // Fetch monthly stats when user profile is available
  useEffect(() => {
    if (userProfile?.user_id) {
      fetchMonthlyStats();
    }
  }, [userProfile]);
  
  // Fetch today's data when user profile is available
  useEffect(() => {
    if (userProfile?.user_id) {
      setTodayDataLoading(true);
      Promise.all([fetchTodayTasks(), fetchTodayMeetings()])
        .finally(() => setTodayDataLoading(false));
    }
  }, [userProfile]);
  
  // Check remarks requirement when dashboard loads, and fetch yesterday data for tasks page
  useEffect(() => {
    if (userProfile?.user_id && (currentPage === 'home' || currentPage === 'tasks' || currentPage === 'meetings')) {
      if (currentPage === 'home' && isRemarksRequired === null) {
        fetchLastWorkingDayData();
      } else if (currentPage === 'tasks' || currentPage === 'meetings') {
        fetchLastWorkingDayData();
      }
    }
  }, [userProfile, currentPage, isRemarksRequired]);
  
  // Auto-populate fixed tasks when dashboard loads and remarks are checked
  useEffect(() => {
    if (userProfile?.user_id && currentPage === 'home' && !hasAutoPopulated && isRemarksRequired === false) {
      autoPopulateFixedTasks();
      setHasAutoPopulated(true);
    }
  }, [userProfile, currentPage, hasAutoPopulated, isRemarksRequired]);
  
  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.task-menu') && !event.target.closest('.menu-icon')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  // If we have a task ID in the URL, render FullTaskPage
  if (taskId) {
    return <FullTaskPage onLogout={onLogout} />;
  }
  // Helper function for SVG donut chart calculations
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Helper function to format dates as "31 Dec"
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };
  


  const openPopup = () => { setIsPopupOpen(true); };
  const closePopup = () => {
    setIsPopupOpen(false);
    setEditingTask(null);
    setError(''); // Clear any errors when closing popup
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
          task_id: task.task_id,
          meeting_name: task.name,
          date: task.date,
          dept: task.dept,
          co_person: task.co_person,
          time: task.time,
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
          time: task.time ? parseInt(task.time) : 0,
          task_type: task.type || 'work',
          status: task.status || 'pending',
          file_link: task.attachments,
          remarks: task.remarks || '',
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

        // Also update todayTasks or yesterdayTasks for dashboard display
        const today = new Date().toISOString().split('T')[0];
        console.log('DEBUG: newTask.date:', newTask.date);
        console.log('DEBUG: today:', today);
        console.log('DEBUG: yesterdayDate:', yesterdayDate);
        console.log('DEBUG: newTask.itemType:', newTask.itemType);
        if (newTask.date === today) {
          console.log('DEBUG: Updating today state');
          if (newTask.itemType === 'task') {
            setTodayTasks(prev => [...prev, newTask]);
          } else {
            setTodayMeetings(prev => [...prev, newTask]);
          }
        } else if (newTask.date === yesterdayDate) {
          console.log('DEBUG: Updating yesterday state');
          if (newTask.itemType === 'task') {
            setYesterdayTasks(prev => [...prev, newTask]);
          } else {
            setYesterdayMeetings(prev => [...prev, newTask]);
          }
        } else {
          console.log('DEBUG: No state update for dashboard - date does not match today or yesterday');
        }
        
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
    const today = new Date().toISOString().split('T')[0];
    const isPreviousDay = task.date < today;
    setEditingTask({ ...task, isPreviousDay });
    setIsPopupOpen(true);
    // Don't force page change - let the current page stay as is
    // setCurrentPage('tasks');
  };

  // Helper function to get the correct ID for API calls
  const getTaskIdForAPI = (task) => {
    // For tasks, prefer task_id, for meetings prefer meeting_id
    if (task.itemType === 'meeting') {
      return task.meeting_id || task.id || task._id;
    }
    // For assigned tasks, use task_id (same as self tasks)
    if (task.category === 'assigned') {
      return task.task_id || task.id || task._id;
    }
    // For self tasks, prefer task_id over _id for consistency
    return task.task_id || task.id || task._id;
  };

  const updateTask = async (updatedTask) => {
    try {
      const token = localStorage.getItem("token");
      let endpoint = updatedTask.itemType === 'meeting' ? 'meetings' : 'tasks';
      let url = `${API_BASE_URL}/${endpoint}`;

      // Get the correct ID for the API call
      const taskIdForAPI = getTaskIdForAPI(updatedTask);

      if (!taskIdForAPI) {
        setError(`Cannot update ${updatedTask.itemType}: No valid ID found`);
        return;
      }

      // For assigned tasks, use master endpoint
      if (updatedTask.category === 'assigned') {
        url = `${API_BASE_URL}/tasks/master/${taskIdForAPI}`;
      } else {
        url = `${API_BASE_URL}/${endpoint}/${taskIdForAPI}`;
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
        // For assigned tasks, only update allowed fields
        apiData = {
          status: updatedTask.status,
          upload_closing: updatedTask.upload_closing || null,
          remarks: updatedTask.remarks
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
          source:updatedTask.source,
          status: updatedTask.status,
          file_link: (updatedTask.file_link || updatedTask.attachments) || null,
          remarks: updatedTask.remarks
        };
      }
      console.log('chekckc',updatedTask);
      const response = await fetch(url, {
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

        // Determine which state to update based on task date
        const today = new Date().toISOString().split('T')[0];
        if (updatedTask.date === today) {
          // Update todayTasks
          if (updatedTask.itemType === 'task') {
            setTodayTasks(prev => prev.map(task => {
              const isMatch = task.date === updatedTask.date && task.task_id === updatedTask.task_id;
              return isMatch ? { ...task, ...updatedTask, ...updatedTaskData } : task;
            }));
          } else {
            setTodayMeetings(prev => prev.map(meeting => {
              const isMatch = meeting.date === updatedTask.date && meeting.meeting_id === updatedTask.meeting_id;
              return isMatch ? { ...meeting, ...updatedTask, ...updatedTaskData } : meeting;
            }));
          }
        } else {
          // Update yesterdayTasks
          setYesterdayTasks(prev => prev.map(task => {
            const isMatch = task.date === updatedTask.date && task.task_id === updatedTask.task_id;
            return isMatch ? { ...task, ...updatedTask, ...updatedTaskData } : task;
          }));
        }

        // Also update the general tasks state for consistency
        setTasks(prevTasks => {
          return prevTasks.map(task => {
            // Match using task_id and date for uniqueness
            const isMatch = task.itemType === updatedTask.itemType && task.date === updatedTask.date && (
              (task.task_id && updatedTask.task_id && task.task_id === updatedTask.task_id) ||
              (task.meeting_id && updatedTask.meeting_id && task.meeting_id === updatedTask.meeting_id)
            );

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
      navigate('/tasks');
    } else if (newFilter === 'meeting' && currentPage === 'tasks') {
      navigate('/meetings');
    }
  };

  // Handle page changes from sidebar and sync filter
  const handlePageChange = (pageId) => {
    navigate(`/${pageId}`);

    // Sync filter with page for consistent behavior
    if (pageId === 'tasks') {
      setFilter('task');
    } else if (pageId === 'meetings') {
      setFilter('meeting');
    }
  };

  const handleDateToggle = async (newDate) => {
    setSelectedDate(newDate);

    if (newDate === 'yesterday') {
      // Fetch last working day data when switching to yesterday
      await fetchLastWorkingDayData();
    }

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

  if (loading) {
    return (
      <div>
        <Sidebar
          userRole={userProfile?.user_type || 'team member'}
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
      
      <main style={{ padding: '0' }}>
        {currentPage === 'tasks' ? (
          <TaskList
            key={yesterdayDate}
            tasks={tasks.filter(task => task.itemType === 'task')}
            onEdit={editTask}
            onViewDetails={onViewDetails}
            onDelete={deleteTask}
            onViewHistory={(task) => {
              const taskId = getTaskIdForAPI(task);
              navigate(`/tasks/${taskId}`, { state: { task } });
            }}
            filter={filter}
            setFilter={handleFilterChange}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            taskTypeFilter={taskTypeFilter}
            setTaskTypeFilter={setTaskTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            userRole={userProfile.user_type}
            yesterdayDate={yesterdayDate}
          />
        ) : currentPage === 'calendar' ? (
          <WeeklyTemplate
            tasks={weeklyTasks}
            loading={weeklyLoading}
            filter={filter}
            setFilter={setFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            taskTypeFilter={weeklyTaskTypeFilter}
            setTaskTypeFilter={setWeeklyTaskTypeFilter}
            statusFilter={weeklyStatusFilter}
            setStatusFilter={setWeeklyStatusFilter}
            categoryFilter={weeklyCategoryFilter}
            setCategoryFilter={setWeeklyCategoryFilter}
            fetchWeeklyData={fetchWeeklyData}
          />
        ) : currentPage === 'meetings' ? (
          <TaskList
            key={yesterdayDate}
            tasks={tasks.filter(task => task.itemType === 'meeting')}
            onEdit={editTask}
            onViewDetails={onViewDetails}
            onDelete={deleteTask}
            onViewHistory={(task) => {
              const taskId = getTaskIdForAPI(task);
              navigate(`/tasks/${taskId}`, { state: { task } });
            }}
            filter={filter}
            setFilter={handleFilterChange}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            taskTypeFilter={taskTypeFilter}
            setTaskTypeFilter={setTaskTypeFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            userRole={userProfile.user_type}
            yesterdayDate={yesterdayDate}
          />
        ) : currentPage === 'rnr' ? (
          <RandR/>
        ) : currentPage === 'projection' ? (
          <MonthlyProjection />
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

            {/* Date Filter Toggle - Moved above Today's Planning header */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', marginBottom: '10px', paddingRight: '20px' }}>
              <DateToggleSwitch
                onToggle={handleDateToggle}
                active={selectedDate === 'today' ? 'Today' : 'Yesterday'}
              />
            </div>

            {/* Today's Planning Section - Header and Table in Single Container */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              width: '100%',
              overflow: 'visible',
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
                    ? (yesterdayDate ? `Previous Day Tasks` : "Yesterday's Tasks")
                    : "Today's Planning"
                  }
                </h3>
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
                    }}>Task Name</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'black',
                      borderRight: '1px solid #e5e7eb',
                      width: '120px'
                    }}>Deadline</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'black',
                      borderRight: '1px solid #e5e7eb',
                      width: '100px'
                    }}>Task Type</th>
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
                      borderRight: '1px solid #e5e7eb',
                      width: '120px'
                    }}>Time (in mins)</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'black',
                      borderRight: '1px solid #e5e7eb',
                      width: '150px'
                    }}>Remarks</th>
                    <th style={{
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'black',
                      width: '80px'
                    }}>Link</th>
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
                  {(selectedDate === 'yesterday' ? yesterdayTasks : todayTasks).length > 0 ? (
                    (selectedDate === 'yesterday' ? yesterdayTasks : todayTasks).map((task, index) => (
                      <tr key={`${task.task_id || 'no-id'}-${task.date}-${index}`} style={{
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                        <td style={{
    padding: '8px 12px',
    color: '#374151',
    fontWeight: '500',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}>{task.task_name || task.name}   {task.source === "task_history" && <History size={14} />}
</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{formatDate(task.timeline) || 'N/A'}</td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{task.task_type || 'work'}</td>
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
                        <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'left' }}>
                          {task.remarks ? (task.remarks.length > 15 ? `${task.remarks.substring(0, 15)}...` : task.remarks) : 'N/A'}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#374151' }}>
                          {task.file_link ? (
                            <a href={task.file_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                              <FaExternalLinkAlt style={{ fontSize: '14px' }} />
                            </a>
                          ) : 'N/A'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', position: 'relative' }}>
                          <FaEllipsisV
                            className="menu-icon"
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(menuOpen === `task-${index}` ? null : `task-${index}`);
                            }}
                          />
                          {menuOpen === `task-${index}` && (
                            <div className="task-menu" style={{
                              position: 'absolute',
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              zIndex: 1000,
                              marginTop: '5px',
                              left: '-80px'
                            }}>
                              <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const today = new Date().toISOString().split('T')[0];
                                       const yesterday = new Date();
                                       yesterday.setDate(yesterday.getDate() - 1);
                                       const yesterdayStr = yesterday.toISOString().split('T')[0];
                                       const lastWorkingDayStr = yesterdayDate ? new Date(yesterdayDate).toISOString().split('T')[0] : yesterdayStr;
                                       const taskDate = task.date ? new Date(task.date).toISOString().split('T')[0] : null;
                                       const isBeforeLastWorkingDay = taskDate && lastWorkingDayStr && taskDate < lastWorkingDayStr;
                                       if (isBeforeLastWorkingDay && userProfile?.user_type !== 'hod' && userProfile?.user_type !== 'HOD' && task.category !== 'assigned') {
                                         alert(`You can't edit tasks from before the previous working day`);
                                         setMenuOpen(null);
                                         return;
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
                                  const taskId = getTaskIdForAPI(task);
                                  navigate(`/tasks/${taskId}`);
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" style={{
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
              overflow: 'visible',
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
                    ? (yesterdayDate ? `Previous Day Meetings` : "Yesterday's Meetings")
                    : "Today's Meetings"
                  }
                </h3>
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
                  {(selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings).length > 0 ? (
                    (selectedDate === 'yesterday' ? yesterdayMeetings : todayMeetings).map((meeting, index) => (
                      <tr key={`${meeting.meeting_id || 'no-id'}-${meeting.date}-${index}`} style={{
                        backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <td style={{ padding: '8px 12px', color: '#374151', textAlign: 'center', fontWeight: '500' }}>{index + 1}</td>
                        <td style={{ padding: '8px 12px', color: '#374151', fontWeight: '500', textAlign: 'left' }}>{meeting.meeting_name || meeting.name}</td>
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
                        <td style={{ padding: '8px 12px', color: '#374151' }}>{meeting.notes ? (meeting.notes.length > 10 ? `${meeting.notes.substring(0, 10)}...` : meeting.notes) : 'N/A'}</td>
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
                              zIndex: 1000,
                              marginTop: '5px',
                              left: '-80px'
                            }}>
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const today = new Date().toISOString().split('T')[0];
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                                    const lastWorkingDayStr = yesterdayDate ? new Date(yesterdayDate).toISOString().split('T')[0] : yesterdayStr;
                                    const taskDate = meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : null;
                                    const isBeforeLastWorkingDay = taskDate && lastWorkingDayStr && taskDate < lastWorkingDayStr;
                                    if (isBeforeLastWorkingDay && userProfile?.user_type !== 'hod' && userProfile?.user_type !== 'HOD') {
                                      alert(`You can't edit meetings from before the previous working day`);
                                      setMenuOpen(null);
                                      return;
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
                      <td colSpan="8" style={{
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
        mode={editingTask?.category === 'assigned' ? 'assign' : 'create'}
        isRestrictedEdit={editingTask ? true : false}
        isPreviousDay={editingTask?.isPreviousDay}
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

export default Home;