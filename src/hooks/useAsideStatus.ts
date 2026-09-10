import { useContext } from 'react';
import ThemeContext from '@/context/theme';

export default function useAsideStatus() {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);

	return { asideStatus, setAsideStatus };
}
