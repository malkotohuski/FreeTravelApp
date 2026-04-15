import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

let onLogoutCallback = null;

const API_BASE_URL = 'https://freetravelapp-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh')
    ) {
      originalRequest._retry = true;

      const refreshToken = await AsyncStorage.getItem('@refreshToken');
      if (!refreshToken) {
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
          await AsyncStorage.setItem('@refreshToken', newRefresh);
        }

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return api(originalRequest);
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

export const setLogoutHandler = callback => {
  onLogoutCallback = callback;
};

export default api;
