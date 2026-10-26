import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Decode JWT helper
export const decodeJwtPayload = (jwtToken) => {
  try {
    const tokenParts = jwtToken.split('.');
    if (tokenParts.length !== 3) return null;

    const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (jwtToken) => {
  if (!jwtToken) return true;
  const payload = decodeJwtPayload(jwtToken);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 <= Date.now();
};

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, role) => api.post('/api/auth/register', { email, password, role }),
  getPendingUsers: () => api.get('/api/auth/pending'),
  approveUser: (userId) => api.patch(`/api/auth/approve/${userId}`),
  rejectUser: (userId) => api.patch(`/api/auth/reject/${userId}`),
  getAllUsers: () => api.get('/api/auth/users'),
  updateUserRole: (userId, role) => api.patch(`/api/auth/user/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/api/auth/user/${userId}`),
  getAdminStats: () => api.get('/api/auth/stats'),
};

export const fileAPI = {
  uploadFile: (formData) => api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyFiles: () => api.get('/api/upload/my-files'),
  getAllFiles: () => api.get('/api/upload/list'),
  deleteFile: (fileId) => api.delete(`/api/upload/delete/${fileId}`),
  downloadFileDirect: (fileId) => api.get(`/api/upload/download/${fileId}`, { responseType: 'blob' }),
};

export const shareAPI = {
  createShare: (fileId, sharedWith, expiresAt) => api.post('/api/share', { fileId, sharedWith, expiresAt }),
  getMyShares: () => api.get('/api/share/my-shares'),
  getReceivedShares: () => api.get('/api/share/received-shares'),
  revokeShare: (shareId) => api.delete(`/api/share/revoke/${shareId}`),
  getShareDetails: (token) => api.get(`/api/share/details/${token}`),
  downloadSharedFile: (token) => api.get(`/api/share/download/${token}`, { responseType: 'blob' }),
};

export const auditAPI = {
  getAuditLogs: (params) => api.get('/api/audit-log', { params }),
  getBlockchain: () => api.get('/api/upload/chain'),
};

export default api;
