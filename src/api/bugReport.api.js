import api from './api';

export const submitBugReport = payload => {
  return api.post('/api/bug-reports', payload);
};
