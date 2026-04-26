import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;

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
