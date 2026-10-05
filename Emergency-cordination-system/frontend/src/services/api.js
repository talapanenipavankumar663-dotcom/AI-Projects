import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor to handle 401 Unauthorized (expired/invalid credentials)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Authentication token expired or invalid. Clearing stored credentials.");
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    }
    return Promise.reject(error);
  }
);

// Helper functions for backend endpoints
export const authService = {
  login: async (email, password) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    return await api.post("/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  },
  register: async (userData) => {
    return await api.post("/users/", userData);
  },
  getCurrentUser: async () => {
    return await api.get("/users/me");
  },
};

export const emergencyContactsService = {
  getAll: async () => {
    try {
      return await api.get("/contacts/");
    } catch {
      return await api.get("/emergency-contacts/");
    }
  },
  getResidentContacts: async (residentId) => {
    return await api.get(`/emergency-contacts/resident/${residentId}`);
  },
  createContact: async (contactData) => {
    return await api.post("/contacts/", contactData);
  },
  updateContact: async (id, contactData) => {
    return await api.put(`/emergency-contacts/${id}`, contactData);
  },
  deleteContact: async (id) => {
    try {
      return await api.delete(`/contacts/${id}`);
    } catch {
      return await api.delete(`/emergency-contacts/${id}`);
    }
  },
  generateOtp: async (contactId) => {
    return await api.post(`/contacts/${contactId}/generate-otp`);
  },
  verifyOtp: async (contactId, otp, firebaseToken = null) => {
    return await api.post(`/contacts/${contactId}/verify`, {
      otp,
      firebase_id_token: firebaseToken,
    });
  },
};

export const sosService = {
  raiseAlert: async (data = {}) => {
    return await api.post("/sos/raise", data);
  },
  getActiveAlerts: async () => {
    return await api.get("/sos/active");
  },
  resolveAlert: async (alertId) => {
    return await api.post(`/sos/${alertId}/resolve`);
  },
};

export const incidentService = {
  getAllIncidents: async () => {
    return await api.get("/api/incidents/");
  },
  getActiveIncidents: async () => {
    return await api.get("/api/incidents/active");
  },
  getSummary: async () => {
    return await api.get("/api/incidents/summary/");
  },
  getIncidentById: async (id) => {
    return await api.get(`/api/incidents/${id}`);
  },
  updateStatus: async (id, status) => {
    return await api.patch(`/api/incidents/${id}/status`, { status });
  },
};

export const societyService = {
  getAllSocieties: async () => {
    return await api.get("/society/");
  },
  createSociety: async (data) => {
    return await api.post("/society/", data);
  },
  getBlocks: async () => {
    return await api.get("/block/");
  },
  createBlock: async (data) => {
    return await api.post("/block/", data);
  },
  getFlats: async () => {
    return await api.get("/flat/");
  },
  createFlat: async (data) => {
    return await api.post("/flat/", data);
  },
};

export const userService = {
  getAllUsers: async () => {
    return await api.get("/users/");
  },
  getRoles: async () => {
    return await api.get("/roles/");
  },
  assignRole: async (userId, roleId) => {
    return await api.post("/user-roles/", { user_id: userId, role_id: roleId });
  },
  updateUser: async (id, data) => {
    return await api.put(`/users/${id}`, data);
  },
  getResidentProfile: async (userId) => {
    return await api.get(`/resident-profiles/${userId}`);
  },
  updateResidentProfile: async (id, data) => {
    return await api.put(`/resident-profiles/${id}`, data);
  },
};

export const notificationService = {
  getNotifications: async () => {
    return await api.get("/notifications/");
  },
  createNotification: async (data) => {
    return await api.post("/notifications/", data);
  },
};

export default api;