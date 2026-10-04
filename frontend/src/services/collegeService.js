import api from '../utils/api.js';

export const fetchColleges = (params = {}) =>
  api.get('/colleges', { params });

export const fetchCollegeBranches = (collegeId) =>
  api.get(`/colleges/${collegeId}/branches`);
