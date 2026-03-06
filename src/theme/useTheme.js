import {useContext, useMemo} from 'react';
import {DarkModeContext} from '../navigation/DarkModeContext';
import {lightTheme, darkTheme} from './theme';

export const useTheme = () => {
  const {darkMode} = useContext(DarkModeContext);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  return theme;
};
