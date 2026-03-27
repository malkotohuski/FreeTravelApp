import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

let pendingNavigation = null;

// 👉 navigate функция
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    console.log('⚠️ Navigation not ready, saving...');
    pendingNavigation = {name, params}; // 💥 SAVE
  }
}

// 👉 това се вика когато Navigation е ready
export function handlePendingNavigation() {
  if (pendingNavigation && navigationRef.isReady()) {
    console.log('✅ Running pending navigation:', pendingNavigation);

    navigationRef.navigate(pendingNavigation.name, pendingNavigation.params);

    pendingNavigation = null;
  }
}
