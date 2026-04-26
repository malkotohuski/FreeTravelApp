import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;
let routeHistory = [];
const blockedBackTargets = new Set([
  'WelcomeScreen',
  'Login',
  'Register',
  'ResetPassword',
]);

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

  const lastRouteName = routeHistory[routeHistory.length - 1];
  const previousRouteName = routeHistory[routeHistory.length - 2];

  if (lastRouteName === currentName) {
    return;
  }

  // Treat navigation back to the previous screen as a stack pop,
  // not as a brand new forward navigation entry.
  if (previousRouteName === currentName) {
    routeHistory.pop();
  } else {
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
      !blockedBackTargets.has(routeName)
    ) {
      return routeName;
    }
  }

  return null;
}
