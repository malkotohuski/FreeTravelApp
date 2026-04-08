import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// callback, който ще се задава от AuthContext
let onLogoutCallback = null;

const API_BASE_URL = 'https://freetravelapp-production.up.railway.app';

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
    console.log('Token:', token);
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
    console.log('INTERCEPTOR STATUS:', error.response?.status); // ← добави
    console.log('INTERCEPTOR URL:', error.config?.url);
    const originalRequest = error.config;

    // Ако access token е изтекъл
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh')
    ) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem('@refreshToken');
      if (!refreshToken) {
        // няма refresh token → logout
        await AsyncStorage.removeItem('@token');
        await AsyncStorage.removeItem('@user');
        onLogoutCallback?.();
        return Promise.reject(error);
      }

      try {
        const {data} = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const newToken = data.accessToken;
        const newRefresh = data.refreshToken;
        await AsyncStorage.setItem('@token', newToken);
        if (newRefresh) {
          await AsyncStorage.setItem('@refreshToken', newRefresh); // ✅
        }

        // ✅ Така е по-сигурно
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return api(originalRequest); // повтаря заявката
      } catch (err) {
        await AsyncStorage.removeItem('@token');
        await AsyncStorage.removeItem('@refreshToken');
        await AsyncStorage.removeItem('@user');
        onLogoutCallback?.();
        return Promise.reject(err);
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
