import React, {
  createContext,
  useReducer,
  useContext,
  useState,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {setLogoutHandler} from '../api/api';

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
  const [loading, setLoading] = useState(true); // важен за splash/loading screen

  // ⚡ Persist login на стартиране
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('@token');
        console.log('Token:', token);
        const userString = await AsyncStorage.getItem('@user');

        if (token && userString) {
          const user = JSON.parse(userString);
          const refreshToken = await AsyncStorage.getItem('@refreshToken');

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          dispatch({type: LOGIN, payload: {user, token}});
        }
      } catch (err) {
        console.log('Error loading persisted user:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    // 🧹 Свързваме автоматичния logout при 401
    setLogoutHandler(async () => {
      // взимаме токена само за логване (не е задължително)
      const token = await AsyncStorage.getItem('@token');
      console.log('TOKEN FROM STORAGE:', token);

      // чистим всички токени
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('@user');

      // обновяваме state
      dispatch({type: LOGOUT});
    });
  }, []);

  const login = async (user, token, refreshToken) => {
    dispatch({
      type: LOGIN,
      payload: {user, token}, // state ще е обновен
    });

    // ⚡ AsyncStorage
    await AsyncStorage.setItem('@user', JSON.stringify(user));
    await AsyncStorage.setItem('@token', token);
    await AsyncStorage.setItem('@refreshToken', refreshToken);
  };

  const logout = async () => {
    try {
      // ✅ Изчиства токена в базата
      await api.post('/api/auth/logout');
    } catch (error) {
      // дори да фейлне → продължаваме с logout
      console.log('Logout API error:', error);
    } finally {
      await AsyncStorage.removeItem('@token');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('@user');
      dispatch({type: LOGOUT});
    }
  };

  const updateUserData = updatedFields => {
    dispatch({type: UPDATE_USER, payload: updatedFields});
    // ⚡ опционално можем да обновим AsyncStorage
    AsyncStorage.mergeItem('@user', JSON.stringify(updatedFields));
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token, // ако искаш да имаш директен достъп
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

  // helper за токен
  const getToken = () => {
    return context.token; // взимаме от state.token
  };

  return {...context, getToken, token: context.token};
};
