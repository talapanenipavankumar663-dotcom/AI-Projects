import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const PORT = '8000';

const DEFAULT_BASE_URL = Platform.OS === 'android' ? `http://10.0.2.2:${PORT}` : `http://127.0.0.1:${PORT}`;

export const CANDIDATE_URLS = [
  `http://127.0.0.1:${PORT}`,
  `http://10.0.2.2:${PORT}`,
  `http://localhost:${PORT}`,
  `http://192.168.31.225:${PORT}`,
];

export const STORAGE_KEY_API_URL = 'custom_api_base_url';

let activeApiBaseUrl = DEFAULT_BASE_URL;

export const getStoredApiBaseUrl = async (): Promise<string> => {
  const defaultUrl = DEFAULT_BASE_URL;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved && saved.includes('http://')) {
      activeApiBaseUrl = saved;
      return saved;
    }
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, defaultUrl);
  } catch {
    // Ignore storage errors
  }
  return defaultUrl;
};

export const saveApiBaseUrl = async (url: string): Promise<void> => {
  activeApiBaseUrl = url;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_API_URL, url);
  } catch {
    // Ignore storage errors
  }
};

export const getActiveApiBaseUrl = (): string => {
  return activeApiBaseUrl;
};

export const API_BASE_URL = activeApiBaseUrl;

