import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const api = axios.create({ baseURL: configuredApiUrl || '/api' });
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
  if (!error.response) return import.meta.env.DEV
    ? 'The Blood Bank server is not running. Start the complete application with “pnpm dev” and make sure MongoDB is running.'
    : 'The Blood Bank API is unavailable. Please try again shortly.';
  if (error.response.status === 404 && !configuredApiUrl) return 'The production API address is not configured. Add VITE_API_URL in the frontend deployment settings and redeploy.';
  return error.response.data?.message || 'Unable to complete the request. Please try again.';
};
