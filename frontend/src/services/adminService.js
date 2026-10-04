import api from '../utils/api.js';

export const fetchAdminStats = () => api.get('/admin/dashboard');

export const fetchStudents = (params = {}) => api.get('/admin/students', { params });
export const fetchStudent = (id) => api.get('/admin/students/' + id);
export const createStudent = (data) => api.post('/admin/students', data);
export const updateStudent = (id, data) => api.patch('/admin/students/' + id, data);
export const deactivateStudent = (id) => api.delete('/admin/students/' + id);
export const assignCounselor = (studentId, counselorId) =>
  api.post('/admin/students/' + studentId + '/assign-counselor', { counselorId });

export const fetchCounselors = (params = {}) => api.get('/admin/counselors', { params });
export const fetchCounselor = (id) => api.get('/admin/counselors/' + id);
export const createCounselor = (data) => api.post('/admin/counselors', data);
export const updateCounselor = (id, data) => api.patch('/admin/counselors/' + id, data);
export const deactivateCounselor = (id) => api.delete('/admin/counselors/' + id);

export const fetchCutoffs = (params = {}) => api.get('/admin/cutoff', { params });
export const createCutoff = (data) => api.post('/admin/cutoff', data);
export const bulkUploadCutoff = (formData) =>
  api.post('/admin/cutoff/bulk', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadCutoffTemplate = () => api.get('/admin/cutoff/template', { responseType: 'blob' });
export const deleteCutoff = (id) => api.delete('/admin/cutoff/' + id);
