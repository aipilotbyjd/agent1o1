import { useContext } from 'react';
import ThemeContext from '@/context/theme';

export default function useDarkMode() {
	const { darkModeStatus, setDarkModeStatus, isDarkTheme } = useContext(ThemeContext);

	return { isDarkTheme, darkModeStatus, setDarkModeStatus };
}
