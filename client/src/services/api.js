import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header của mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Quản lý queue khi đang refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
};

// Tự động refresh token khi nhận 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue request: chờ refresh xong rồi retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const resp = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const newToken = resp.data.data.token;
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// GET Request Caching and Deduplication
const getCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Override api.request to intercept all calls
const originalRequest = api.request;
api.request = function (configOrUrl, config) {
  let conf = {};
  if (typeof configOrUrl === 'string') {
    conf = config || {};
    conf.url = configOrUrl;
  } else {
    conf = configOrUrl || {};
  }

  const method = (conf.method || 'get').toLowerCase();

  if (method === 'get') {
    const bypassCache = conf.cache === false || conf.forceRefresh === true;

    // Create a unique key based on URL and query params
    const key = JSON.stringify({ url: conf.url, params: conf.params });

    if (bypassCache) {
      getCache.delete(key);
    } else {
      const cached = getCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.promise;
      }
    }

    const promise = originalRequest.call(this, configOrUrl, config)
      .catch((err) => {
        // If the request fails, remove it from cache immediately
        getCache.delete(key);
        throw err;
      });

    getCache.set(key, { promise, timestamp: Date.now() });
    return promise;
  } else {
    // For non-GET requests (POST, PUT, DELETE, PATCH), invalidate the entire cache
    getCache.clear();
    return originalRequest.call(this, configOrUrl, config);
  }
};

// Bind Axios helper methods to our overridden api.request
api.get = function (url, config) {
  return this.request({ ...config, method: 'get', url });
};
api.post = function (url, data, config) {
  return this.request({ ...config, method: 'post', url, data });
};
api.put = function (url, data, config) {
  return this.request({ ...config, method: 'put', url, data });
};
api.delete = function (url, config) {
  return this.request({ ...config, method: 'delete', url });
};
api.patch = function (url, data, config) {
  return this.request({ ...config, method: 'patch', url, data });
};

export default api;

