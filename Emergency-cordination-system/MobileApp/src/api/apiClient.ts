import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CANDIDATE_URLS,
  getStoredApiBaseUrl,
  saveApiBaseUrl,
  getActiveApiBaseUrl,
} from './config';

const apiClient = axios.create({
  baseURL: getActiveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isProbing = false;

// Function to find a reachable backend URL from candidate endpoints
export const findWorkingBackendUrl = async (): Promise<string | null> => {
  let candidates = [...CANDIDATE_URLS];
  try {
    const saved = await AsyncStorage.getItem('custom_api_base_url');
    if (saved && saved.includes('http://') && !candidates.includes(saved)) {
      candidates.unshift(saved);
    }
  } catch {}

  // Check active/current default URL first to avoid unnecessary probe error logs
  const activeUrl = apiClient.defaults.baseURL;
  if (activeUrl && activeUrl.includes('http://')) {
    try {
      const res = await axios.get(`${activeUrl}/health`, { timeout: 1500 });
      if (res.status === 200) {
        return activeUrl;
      }
    } catch {}
  }

  // Probe candidates if active URL is unreachable
  for (const candidate of candidates) {
    if (candidate === activeUrl) continue;
    try {
      const res = await axios.get(`${candidate}/health`, { timeout: 1500 });
      if (res.status === 200) {
        console.log(`[API] Auto-connected to active backend at: ${candidate}`);
        await saveApiBaseUrl(candidate);
        apiClient.defaults.baseURL = candidate;
        return candidate;
      }
    } catch {}
  }

  console.warn('[API] Could not connect to any candidate backend endpoint.');
  return null;
};

// Initialize active base URL on launch
getStoredApiBaseUrl().then((savedUrl) => {
  if (savedUrl) {
    apiClient.defaults.baseURL = savedUrl;
  }
  // Probe in background on startup to verify connectivity
  findWorkingBackendUrl();
});

// Request Interceptor: Attach JWT Token & ensure active base URL is set
apiClient.interceptors.request.use(
  async (config) => {
    if (!config.baseURL) {
      config.baseURL = apiClient.defaults.baseURL || getActiveApiBaseUrl();
    }
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally & auto-probe backend on network failure
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle Network Connection Failures (e.g. backend unreachable)
    const isNetworkError =
      !error.response &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('Network Error'));

    if (isNetworkError && originalRequest && !originalRequest._probeRetried) {
      originalRequest._probeRetried = true;
      if (!isProbing) {
        isProbing = true;
        try {
          const workingUrl = await findWorkingBackendUrl();
          isProbing = false;
          if (workingUrl) {
            console.log(`[API] Auto-recovered backend connection at: ${workingUrl}`);
            apiClient.defaults.baseURL = workingUrl;
            originalRequest.baseURL = workingUrl;
            return apiClient(originalRequest);
          }
        } catch {
          isProbing = false;
        }
      }
    }

    // Check for HTTP 401 Unauthorized (invalid/expired token)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await AsyncStorage.removeItem('jwt_token');
        await AsyncStorage.removeItem('user_profile');
        await AsyncStorage.removeItem('user_role');
      } catch (storageError) {
        console.error('Error clearing auth credentials:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
