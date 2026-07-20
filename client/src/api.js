import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('bloodBankToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    localStorage.removeItem('bloodBankToken');
    localStorage.removeItem('bloodBankUser');
  }
  return Promise.reject(error);
});

export const errorMessage = error => {
  if (!error.response) return 'The Blood Bank server is not running. Start the complete application with “pnpm dev” and make sure MongoDB is running.';
  return error.response.data?.message || 'Unable to complete the request. Please try again.';
};
