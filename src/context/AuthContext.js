import React, {
  createContext,
  useReducer,
  useContext,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {setLogoutHandler} from '../api/api';
import NotificationService from '../backend-v2/services/NotificationService';
import socket from '../socket/socket';

const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';
const UPDATE_USER = 'UPDATE_USER';
const initialState = {isAuthenticated: false, user: null, token: null};

const authReducer = (state, action) => {
  switch (action.type) {
    case LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case UPDATE_USER:
      return {...state, user: {...state.user, ...action.payload}};
    case LOGOUT:
      return {...state, isAuthenticated: false, user: null, token: null};
    default:
      return state;
  }
};

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('@token');
        const userString = await AsyncStorage.getItem('@user');

        if (token && userString) {
          const user = JSON.parse(userString);

          api.defaults.headers.common.Authorization = `Bearer ${token}`;

          dispatch({type: LOGIN, payload: {user, token}});
          await NotificationService.syncDeviceToken();
        }
      } catch (err) {
        console.log('Error loading persisted user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    setLogoutHandler(async () => {
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('@user');
      delete api.defaults.headers.common.Authorization;
      dispatch({type: LOGOUT});
    });
  }, []);

  useEffect(() => {
    if (!state.user?.id) {
      return;
    }

    const joinUserRoom = () => {
      socket.emit('joinUserRoom', state.user.id);
    };

    joinUserRoom();
    socket.on('connect', joinUserRoom);

    return () => {
      socket.off('connect', joinUserRoom);
    };
  }, [state.user?.id]);

  const login = async (user, token, refreshToken) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    dispatch({
      type: LOGIN,
      payload: {user, token},
    });

    await AsyncStorage.setItem('@user', JSON.stringify(user));
    await AsyncStorage.setItem('@token', token);
    await AsyncStorage.setItem('@refreshToken', refreshToken);
    await NotificationService.syncDeviceToken();
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.log('Logout API error:', error?.message || error);
    } finally {
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('@user');
      delete api.defaults.headers.common.Authorization;
      dispatch({type: LOGOUT});
    }
  };

  const updateUserData = updatedFields => {
    dispatch({type: UPDATE_USER, payload: updatedFields});
    AsyncStorage.mergeItem('@user', JSON.stringify(updatedFields));
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading,
        login,
        logout,
        updateUserData,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');

  const getToken = () => {
    return context.token;
  };

  return {...context, getToken, token: context.token};
};
