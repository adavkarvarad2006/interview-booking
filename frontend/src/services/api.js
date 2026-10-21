const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Universal fetch wrapper that automatically attaches JWT token and parses JSON
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  sendOtp: (data) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Sessions
  getPublicSessions: () => request('/sessions'),
  getAllSessions: () => request('/sessions/all'),
  getSession: (id) => request(`/sessions/${id}`),
  createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  updateSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  // Appointments
  getMyAppointments: () => request('/appointments/my'),
  getAllAppointments: (params = '') => request(`/appointments${params ? `?${params}` : ''}`),
  getAppointment: (id) => request(`/appointments/${id}`),
  updateAppointmentStatus: (id, data) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancelAppointment: (id, data = {}) => request(`/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify(data) }),
  rescheduleAppointment: (id, data) => request(`/appointments/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),

  // Availability & Blocked Dates
  getBlockedDates: () => request('/availability/blocked'),
  getBookedSlots: (date = '') => request(`/availability/slots${date ? `?date=${date}` : ''}`),
  blockDate: (data) => request('/availability/block', { method: 'POST', body: JSON.stringify(data) }),
  unblockDate: (id) => request(`/availability/block/${id}`, { method: 'DELETE' }),
  getAvailabilityExplanation: () => request('/availability/explanation'),

  // Counsellor Profile
  getCounsellorProfile: () => request('/counsellor/profile'),
  updateCounsellorProfile: (data) => request('/counsellor/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Admin
  getDashboardStats: () => request('/admin/dashboard-stats'),
  getIntegrationConfig: () => request('/admin/integration'),
  updateIntegrationConfig: (data) => request('/admin/integration', { method: 'PUT', body: JSON.stringify(data) }),
  getAllStudents: () => request('/admin/students'),
  getNotifications: () => request('/admin/notifications'),
  markNotificationRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH' }),

  // Calendly Webhook Simulation
  simulateWebhook: (data) => request('/calendly/webhook/simulate', { method: 'POST', body: JSON.stringify(data) })
};
