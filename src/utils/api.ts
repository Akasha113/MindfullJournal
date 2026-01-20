const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get stored token
export const getToken = () => localStorage.getItem('authToken');

// Get auth headers
export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Handle API response
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
};

// =====================
// JOURNAL API
// =====================

export const journalAPI = {
  // Create journal
  create: async (journal) => {
    const response = await fetch(`${API_URL}/api/journals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(journal),
    });
    return handleResponse(response);
  },

  // Get all journals
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });
    const response = await fetch(
      `${API_URL}/api/journals?${params}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  // Get single journal
  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/journals/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update journal
  update: async (id, updates) => {
    const response = await fetch(`${API_URL}/api/journals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  // Delete journal
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/journals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Archive journal
  archive: async (id) => {
    const response = await fetch(`${API_URL}/api/journals/${id}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================
// CHAT API
// =====================

export const chatAPI = {
  // Create chat
  create: async (chat) => {
    const response = await fetch(`${API_URL}/api/chats`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(chat),
    });
    const data = await handleResponse(response);
    return data.chat || data;
  },

  // Get all chats
  getAll: async (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page,
      limit,
      ...filters,
    });
    const response = await fetch(
      `${API_URL}/api/chats?${params}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse(response);
  },

  // Get single chat
  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/chats/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Add message to chat
  addMessage: async (id, content, role = 'user') => {
    const response = await fetch(`${API_URL}/api/chats/${id}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, role }),
    });
    const data = await handleResponse(response);
    return data.chat || data;
  },

  // Update chat metadata
  update: async (id, updates) => {
    const response = await fetch(`${API_URL}/api/chats/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  // Delete chat
  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/chats/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Archive chat
  archive: async (id) => {
    const response = await fetch(`${API_URL}/api/chats/${id}/archive`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================
// USER PROFILE API
// =====================

export const userAPI = {
  // Get profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update profile
  updateProfile: async (updates) => {
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  // Get statistics
  getStats: async () => {
    const response = await fetch(`${API_URL}/api/stats/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================
// AUTH API
// =====================

export const authAPI = {
  // Register
  register: async (name, email, password, confirmPassword) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    return handleResponse(response);
  },

  // Verify
  verify: async (email, code) => {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  // Login
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  // Resend code
  resendCode: async (email) => {
    const response = await fetch(`${API_URL}/api/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
  },
};

export default {
  journalAPI,
  chatAPI,
  userAPI,
  authAPI,
  getToken,
  getAuthHeaders,
};
