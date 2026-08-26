const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('task_manager_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
      // Don't auto-redirect if we're explicitly trying to login
      if (!endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/signup') && !endpoint.startsWith('/auth/demo-users')) {
        localStorage.removeItem('task_manager_token');
        localStorage.removeItem('task_manager_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    getAllUsers: () => request('/auth/users'),
    getDemoUsers: () => request('/auth/demo-users')
  },
  projects: {
    list: () => request('/projects'),
    get: (id) => request(`/projects/${id}`),
    create: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (projectId, data) => request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) }),
    updateMemberRole: (projectId, userId, role) => request(`/projects/${projectId}/members/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) }),
    removeMember: (projectId, userId) => request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
    getActivity: (projectId) => request(`/projects/${projectId}/activity`)
  },
  tasks: {
    listByProject: (projectId, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/project/${projectId}/tasks${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/tasks/${id}`),
    create: (projectId, data) => request(`/project/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    getMyTasks: () => request('/tasks/my-tasks')
  },
  subtasks: {
    create: (taskId, title) => request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify({ title }) }),
    update: (taskId, subtaskId, data) => request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (taskId, subtaskId) => request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' })
  },
  comments: {
    list: (taskId) => request(`/tasks/${taskId}/comments`),
    create: (taskId, content) => request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) })
  },
  stats: {
    getDashboard: () => request('/stats/dashboard')
  }
};

