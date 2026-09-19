import { useContext } from 'react';
import ThemeContext from '@/context/theme';

export default function useFontSize() {
	const { fontSize, setFontSize } = useContext(ThemeContext);

	return { fontSize, setFontSize };
}
