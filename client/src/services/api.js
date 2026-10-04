import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  // Let the browser/Axios add the multipart boundary for image FormData.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers?.delete?.('Content-Type');
    if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') error.message = 'The request took too long. Please try again.';
    if (!error.response && error.message !== 'Network Error') error.message = 'Could not reach the Pure Aqua service.';
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => error?.response?.data?.message || error?.message || fallback;
export default api;
