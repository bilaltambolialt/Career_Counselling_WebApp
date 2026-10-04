import api from '../utils/api.js';

export const fetchStudentDashboard = () => api.get('/student/dashboard');

export const fetchStudentProfile = () => api.get('/student/profile');
export const updateStudentProfile = (data) => api.patch('/student/profile', data);

export const fetchExamScores = () => api.get('/student/scores');
export const addExamScore = (data) => api.post('/student/scores', data);
export const updateExamScore = (id, data) => api.patch(`/student/scores/${id}`, data);
export const deleteExamScore = (id) => api.delete(`/student/scores/${id}`);

export const fetchPredictions = () => api.get('/student/predictions');
export const generatePredictions = () => api.post('/student/predictions/generate');
export const clearPredictions = () => api.delete('/student/predictions');

export const fetchBranchNames = () => api.get('/student/branches');

export const fetchCollegePreferences  = () => api.get('/student/college-preferences');
export const addCollegePreference     = (data) => api.post('/student/college-preferences', data);
export const removeCollegePreference  = (id) => api.delete(`/student/college-preferences/${id}`);

export const fetchDocuments = () => api.get('/student/documents');
export const uploadDocument = (formData) =>
  api.post('/student/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteDocument = (id) => api.delete(`/student/documents/${id}`);

export const generateStudentReport = (type = 'summary') =>
  api.get(`/student/reports/${type}`, { responseType: 'blob', timeout: 120000 });
