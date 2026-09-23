import axios from 'axios';
export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});
api.interceptors.request.use((config) => {
  const token = globalThis.sessionStorage?.getItem('f2h:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (failure) => {
    const error = new Error(
      failure.response?.data?.message ||
        (failure.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : 'The server could not be reached. Please try again.'),
    );
    error.status = failure.response?.status;
    error.fields = failure.response?.data?.errors || [];
    error.code = failure.code;
    return Promise.reject(error);
  },
);
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
