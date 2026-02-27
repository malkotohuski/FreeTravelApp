import React, {createContext, useContext, useState, useEffect} from 'react';
import {useAuth} from './AuthContext';
import api from '../api/api';

const RouteContext = createContext();

export const RouteProvider = ({children}) => {
  const [routes, setRoutes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [matchingRequest, setMatchingRequest] = useState(null);
  const [mainRouteUser, setMainRouteUser] = useState(null);
  const {user} = useAuth();

  useEffect(() => {
    fetchAllRoutes();
    fetchAllRequests();
  }, []);

  const refreshUserData = async () => {
    await fetchAllRequests();
  };

  const refreshRoutesData = async () => {
    fetchAllRoutes();
  };

  const addRoute = newRoute => {
    setRoutes(prevRoutes => [...prevRoutes, newRoute]);
  };

  const addRequest = newRequest => {
    setRequests(prevRequests => [...prevRequests, newRequest]);
  };

  const deleteRoute = routeId => {
    setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
  };

  const getRequestsForRouteById = routeId => {
    return requests.filter(request => request.routeId === routeId);
  };

  const getRequestsForRoute = routeId => {
    const route = routes.find(route => route.id === routeId);

    if (route && route.requests) {
      return route.requests.map(request => ({
        id: request.id,
        requestingUser: request.requestingUser,
      }));
    } else {
      return [];
    }
  };

  const removeRoute = async routeId => {
    try {
      await api.delete(`/routes/${routeId}`);
      setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const deletedRoute = async routeId => {
    try {
      await api.patch(`/routes/${routeId}`, {
        userRouteId: 'deleted',
      });

      setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const markRouteAsCompleted = async routeId => {
    try {
      await api.patch(`/routes/${routeId}`, {
        userRouteId: 'completed',
      });

      setRoutes(prevRoutes => prevRoutes.filter(route => route.id !== routeId));
    } catch (error) {
      console.error('Error marking route as completed:', error);
    }
  };

  const fetchAllRoutes = async () => {
    try {
      const response = await api.get(`/api/routes`);
      if (response.status === 200) {
        // Филтрираме маршрутите, които имат userRouteId, различен от "deleted"
        const filteredRoutes = response.data.filter(
          route => route.userRouteId !== 'deleted',
        );
        setRoutes(filteredRoutes);
      } else {
        console.error('Failed to fetch routes');
      }
    } catch (error) {
      console.error('Login Error:', error);
      console.error('Error fetching routes:', error);
    }
  };

  const fetchAllRequests = async () => {
    try {
      const response = await api.get('/api/requests');

      if (response.status === 200) {
        setRequests(response.data);
        return response.data; // 🔥 важно
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const filterAndDeleteExpiredRoutes = () => {
    const currentDate = new Date();
    setRoutes(prevRoutes =>
      prevRoutes.filter(route => {
        const routeDate = new Date(route.selectedDateTime);
        return (
          routeDate >= currentDate &&
          route.userRouteId !== 'deleted' &&
          route.userRouteId !== 'completed'
        );
      }),
    );
  };

  useEffect(() => {
    const intervalId = setInterval(filterAndDeleteExpiredRoutes, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <RouteContext.Provider
      value={{
        routes,
        requests,
        matchingRequest,
        mainRouteUser,
        addRoute,
        removeRoute,
        deleteRoute,
        deletedRoute,
        addRequest,
        getRequestsForRoute,
        getRequestsForRouteById,
        refreshUserData,
        refreshRoutesData,
        markRouteAsCompleted,
      }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRouteContext must be used within a RouteProvider');
  }
  return context;
};
