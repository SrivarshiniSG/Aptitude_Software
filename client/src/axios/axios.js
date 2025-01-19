import axios from 'axios';

// Create axios instance with custom config
const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_HOSTNAME || 'http://localhost:5000', // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional but recommended)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // Handle 401 unauthorized errors
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       // Optionally redirect to login
//       // window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default api;