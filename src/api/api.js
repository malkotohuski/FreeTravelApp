import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// callback, който ще се задава от AuthContext
let onLogoutCallback = null;

const API_BASE_URL = 'http://10.0.2.2:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/* ===============================
   REQUEST INTERCEPTOR
   =============================== */
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('@token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

/* ===============================
   RESPONSE INTERCEPTOR
   =============================== */
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      // token невалиден / изтекъл
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');

      // извикваме callback от AuthContext
      if (onLogoutCallback) {
        onLogoutCallback();
      }
    }
    return Promise.reject(error);
  },
);

// функция, чрез която AuthContext задава callback
export const setLogoutHandler = callback => {
  onLogoutCallback = callback;
};

export default api;
