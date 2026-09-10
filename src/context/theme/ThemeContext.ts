import { createContext } from 'react';
import type { IThemeContextProps } from './theme.types';

const ThemeContext = createContext<IThemeContextProps>({} as IThemeContextProps);

export default ThemeContext;
