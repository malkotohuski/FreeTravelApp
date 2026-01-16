import React, {
  createContext,
  useReducer,
  useContext,
  useState,
  useEffect,
} from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';
// Action types
const LOGIN = 'LOGIN';
const LOGOUT = 'LOGOUT';
const UPDATE_USER = 'UPDATE_USER';

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload, // директно юзер обекта
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: {...state.user, ...action.payload}, // само с новите полета
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
};

// Create context
const AuthContext = createContext();

// AuthProvider component
const AuthProvider = ({children}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loading, setLoading] = useState(false);

  const login = user => {
    dispatch({type: 'LOGIN', payload: user});
    setLoading(false);
  };

  const logout = () => {
    dispatch({type: 'LOGOUT'});
  };

  const updateUserData = updatedFields => {
    dispatch({type: 'UPDATE_USER', payload: updatedFields});
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user, // директно user
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

// Custom hook to use the AuthContext
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export {AuthProvider, useAuth};
