import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

// Generate a simple device fingerprint
const generateFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  const canvasData = canvas.toDataURL();
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    canvasData.slice(-50)
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data, {
    headers: { 'X-Device-Fingerprint': generateFingerprint() }
  }),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/auth/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPdfTemplates: () => api.get('/pdf-templates'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token?token=${token}`),
};

// Products
export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/products/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () => api.get('/products/export/excel', { responseType: 'blob' }),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/products/import/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () => api.get('/products/template/excel', { responseType: 'blob' }),
};

// Customers
export const customersAPI = {
  getAll: (search = '') => api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Bank Accounts
export const bankAccountsAPI = {
  getAll: () => api.get('/bank-accounts'),
  create: (data) => api.post('/bank-accounts', data),
  delete: (id) => api.delete(`/bank-accounts/${id}`),
};

// Quotes
export const quotesAPI = {
  getAll: () => api.get('/quotes'),
  getById: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  updateStatus: (id, status) => api.put(`/quotes/${id}/status?status=${status}`),
  delete: (id) => api.delete(`/quotes/${id}`),
  getPdf: (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' }),
  shareEmail: (quoteId, recipientEmail, message) => api.post(`/quotes/${quoteId}/share/email`, {
    quote_id: quoteId,
    recipient_email: recipientEmail,
    message: message,
  }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Reports
export const reportsAPI = {
  get: (startDate, endDate) => api.get(`/reports?start_date=${startDate}&end_date=${endDate}`),
};

// Subscription
export const subscriptionAPI = {
  getStatus: () => api.get('/subscription/status'),
  subscribe: (data) => api.post('/subscription/subscribe', data),
  cancel: () => api.post('/subscription/cancel'),
  validateCoupon: (code) => api.post(`/coupons/validate?code=${code}`),
};

// Admin
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/stats'),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  toggleCoupon: (id) => api.put(`/admin/coupons/${id}/toggle`),
  getCampaigns: () => api.get('/admin/campaigns'),
  sendCampaign: (data) => api.post('/admin/campaigns/send', data),
  makeAdmin: (email) => api.post(`/admin/make-admin/${email}`),
  // Fraud prevention
  getFraudReport: () => api.get('/admin/fraud-report'),
  getBlockedIPs: () => api.get('/admin/blocked-ips'),
  blockIP: (ip) => api.post(`/admin/block-ip/${ip}`),
  unblockIP: (ip) => api.delete(`/admin/unblock-ip/${ip}`),
};

// Helper to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

// Helper to format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default api;
