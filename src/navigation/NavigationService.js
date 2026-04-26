import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;
let routeHistory = [];

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingNavigation = {name, params};
  }
}

export function handlePendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    navigationRef.navigate(pendingNavigation.name, pendingNavigation.params);
    pendingNavigation = null;
  }
}

export function trackCurrentRoute() {
  const currentRoute = navigationRef.getCurrentRoute();
  const currentName = currentRoute?.name;

  if (!currentName) {
    return;
  }

  if (routeHistory[routeHistory.length - 1] !== currentName) {
    routeHistory.push(currentName);
  }

  if (routeHistory.length > 30) {
    routeHistory = routeHistory.slice(-30);
  }
}

export function getPreviousRouteName(currentRouteName) {
  for (let i = routeHistory.length - 2; i >= 0; i -= 1) {
    const routeName = routeHistory[i];

    if (
      routeName &&
      routeName !== currentRouteName &&
      routeName !== 'WelcomeScreen'
    ) {
      return routeName;
    }
  }

  return null;
}
