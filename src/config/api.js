// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/login`,
  REGISTER: `${API_BASE_URL}/register`,
  
  // Tasks
  TASKS: `${API_BASE_URL}/tasks`,
  TASK_HISTORY: `${API_BASE_URL}/tasks/history`,
  
  // Meetings
  MEETINGS: `${API_BASE_URL}/meetings`,
  
  // Admin
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_MEMBERS: `${API_BASE_URL}/admin/members`,
  ADMIN_TASKS: `${API_BASE_URL}/admin/tasks`,
  ADMIN_MEETINGS: `${API_BASE_URL}/admin/meetings`,
  ADMIN_ANALYTICS: `${API_BASE_URL}/admin/analytics`,
  ADMIN_DEPT_ANALYTICS: `${API_BASE_URL}/admin/deptanalytics`,
  ADMIN_ASSIGN: `${API_BASE_URL}/admin/assign`,
  
  // HOD
  HOD_TASKS: `${API_BASE_URL}/hod/tasks`,
  HOD_MEETINGS: `${API_BASE_URL}/hod/meetings`,
  HOD_DASHBOARD: `${API_BASE_URL}/hod/dashboard`,
  HOD_WEEKLY: `${API_BASE_URL}/hod/weekly`,
  HOD_DOWNLOAD: `${API_BASE_URL}/hod/reports`,
  HOD_ASSIGN: `${API_BASE_URL}/hod/assign`,
  
  // Reports
  REPORTS: `${API_BASE_URL}/reports`,
  WEEKLY: `${API_BASE_URL}/weekly`,

  // Dashboard
  DASHBOARD_MONTHLY_STATS: `${API_BASE_URL}/dashboard/monthly-stats`,
  DASHBOARD_TODAY_TASKS: `${API_BASE_URL}/dashboard/today-tasks`,
  DASHBOARD_TODAY_MEETINGS: `${API_BASE_URL}/dashboard/today-meetings`,
  DASHBOARD_LAST_WORKING_DAY_TASKS: `${API_BASE_URL}/dashboard/last-working-day-tasks`,
  DASHBOARD_MEETINGS_BY_DATE: `${API_BASE_URL}/dashboard/meetings-by-date`
};

// Helper function to build API URLs with dynamic parameters
export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // Replace path parameters (e.g., /users/:userId)
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` })
  };
};

// Helper function to refresh access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) throw new Error("Refresh failed");

  const data = await response.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("refreshToken", data.refreshToken);
  return data.token;
};

// Generic API request function with automatic token refresh
export const apiRequest = async (endpoint, options = {}) => {
  // Check session expiry (12 hours from login)
  const loginTime = localStorage.getItem("loginTime");
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    const twelveHours = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    if (elapsed > twelveHours) {
      // Session expired, logout
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      window.location.reload(); // Reload to show login screen
      throw new Error("Session expired after 12 hours");
    }
  }

  try {
    const response = await fetch(endpoint, {
      headers: getAuthHeaders(),
      ...options
    });

    if (response.status === 401) {
      // Try to refresh token
      try {
        await refreshAccessToken();
        // Retry the request with new token
        const retryResponse = await fetch(endpoint, {
          headers: getAuthHeaders(),
          ...options
        });
        const data = await retryResponse.json();
        if (!retryResponse.ok) throw new Error(data.error || data.message);
        return data;
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("loginTime");
        localStorage.removeItem("user");
        localStorage.removeItem("profile");
        window.location.reload(); // Reload to show login screen
        throw new Error("Session expired");
      }
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.message);
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// API methods for common operations
export const api = {
  // Authentication
  login: (credentials) => 
    apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  
  register: (userData) => 
    apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  
  // Tasks
  getTasks: () =>
    apiRequest(API_ENDPOINTS.TASKS),

  getTaskSuggestions: (userId) =>
    apiRequest(buildApiUrl(API_ENDPOINTS.TASKS + '/suggestions/:userId', { userId })),

  createTask: (taskData) =>
    apiRequest(API_ENDPOINTS.TASKS, {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),
  
  updateTask: (taskId, taskData) => 
    apiRequest(buildApiUrl(API_ENDPOINTS.TASKS, { taskId }), {
      method: 'PUT',
      body: JSON.stringify(taskData)
    }),
  
  deleteTask: (taskId) =>
    apiRequest(buildApiUrl(API_ENDPOINTS.TASKS, { taskId }), {
      method: 'DELETE'
    }),

  getTaskHistory: (taskId) =>
    apiRequest(API_ENDPOINTS.TASK_HISTORY, {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId })
    }),
  
  // Meetings
  getMeetings: () => 
    apiRequest(API_ENDPOINTS.MEETINGS),
  
  createMeeting: (meetingData) => 
    apiRequest(API_ENDPOINTS.MEETINGS, {
      method: 'POST',
      body: JSON.stringify(meetingData)
    }),
  
  updateMeeting: (meetingId, meetingData) => 
    apiRequest(buildApiUrl(API_ENDPOINTS.MEETINGS, { meetingId }), {
      method: 'PUT',
      body: JSON.stringify(meetingData)
    }),
  
  deleteMeeting: (meetingId) =>
    apiRequest(buildApiUrl(API_ENDPOINTS.MEETINGS, { meetingId }), {
      method: 'DELETE'
    }),

  getMeetingsMembers: () =>
    apiRequest(API_ENDPOINTS.MEETINGS + '/members'),

  // Admin - Users
  getUsers: () =>
    apiRequest(API_ENDPOINTS.ADMIN_USERS),

  createUser: (userData) =>
    apiRequest(API_ENDPOINTS.ADMIN_USERS, {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  updateUser: (userId, userData) =>
    apiRequest(buildApiUrl(API_ENDPOINTS.ADMIN_USERS, { userId }), {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  deleteUser: (userId) =>
    apiRequest(buildApiUrl(API_ENDPOINTS.ADMIN_USERS, { userId }), {
      method: 'DELETE'
    }),

  // Admin - Members
  getMembers: () =>
    apiRequest(API_ENDPOINTS.ADMIN_MEMBERS + '/list'),

  createMember: (memberData) =>
    apiRequest(API_ENDPOINTS.ADMIN_MEMBERS + '/add', {
      method: 'POST',
      body: JSON.stringify(memberData)
    }),

  updateMember: (memberId, memberData) =>
    apiRequest(API_ENDPOINTS.ADMIN_MEMBERS + `/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(memberData)
    }),

  deleteMember: (memberId) =>
    apiRequest(API_ENDPOINTS.ADMIN_MEMBERS + `/${memberId}`, {
      method: 'DELETE'
    }),

  // Admin - Assign Members
  getAssignMembers: () =>
    apiRequest(API_ENDPOINTS.ADMIN_ASSIGN + '/members'),

  // Dashboard
  getMonthlyStats: (userId, dateFilter = 'current_month') =>
    apiRequest(API_ENDPOINTS.DASHBOARD_MONTHLY_STATS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, date_filter: dateFilter })
    }),

  getTodayTasks: (userId) =>
    apiRequest(API_ENDPOINTS.DASHBOARD_TODAY_TASKS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    }),

  getTodayMeetings: (userId) =>
    apiRequest(API_ENDPOINTS.DASHBOARD_TODAY_MEETINGS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    }),

  getLastWorkingDayTasks: (userId) =>
    apiRequest(API_ENDPOINTS.DASHBOARD_LAST_WORKING_DAY_TASKS, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    }),

  getMeetingsByDate: (userId, date) =>
    apiRequest(API_ENDPOINTS.DASHBOARD_MEETINGS_BY_DATE, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, date: date })
    }),

  // HOD Dashboard
  getHodDashboardData: (userId, viewType, targetUserId) =>
    apiRequest(API_ENDPOINTS.HOD_DASHBOARD + '/data', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        view_type: viewType,
        target_user_id: targetUserId
      })
    }),

  getHodYesterdayData: (userId, viewType, targetUserId) =>
    apiRequest(API_ENDPOINTS.HOD_DASHBOARD + '/yesterday-data', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        view_type: viewType,
        target_user_id: targetUserId
      })
    }),

  getHodTeamOverview: (userId) =>
    apiRequest(API_ENDPOINTS.HOD_DASHBOARD + '/team-overview', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
};

export default API_ENDPOINTS;