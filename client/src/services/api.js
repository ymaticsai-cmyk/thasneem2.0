import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/** @type {null | (() => Promise<string | null>)} */
let refreshAccessToken = null;

export function setAuthRefreshHandler(fn) {
  refreshAccessToken = fn;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const res = error.response;
    const cfg = error.config;
    if (!res || res.status !== 401 || cfg._authRetry || !refreshAccessToken) {
      return Promise.reject(error);
    }
    const path = cfg.url || '';
    if (path.includes('/auth/refresh') || path.includes('/auth/login')) {
      return Promise.reject(error);
    }
    cfg._authRetry = true;
    try {
      const access = await refreshAccessToken();
      if (!access) return Promise.reject(error);
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${access}`;
      return api(cfg);
    } catch {
      return Promise.reject(error);
    }
  }
);

// Instance default is application/json. Axios transformRequest will stringify FormData as JSON
// when it sees that type, so Multer never receives multipart — strip before transform runs.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    const h = config.headers;
    if (typeof h.delete === 'function') {
      h.delete('Content-Type');
    }
    if (typeof h.setContentType === 'function') {
      h.setContentType(undefined);
    }
    delete h['Content-Type'];
    delete h['content-type'];
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
