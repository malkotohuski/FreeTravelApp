import api from './api';

export const searchCities = async search => {
  const {data} = await api.get('/api/cities/search', {
    params: {search},
  });

  return data;
};
