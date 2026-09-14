import { useContext } from 'react';
import ThemeContext from '@/context/themeContext';
import { useWorkflowShellStore } from '@/store/workflowShell.store';

export default function useAsideStatus() {
	const { asideStatus, setAsideStatus } = useContext(ThemeContext);
	const { toggleMobileSidebar, closeMobileSidebar } = useWorkflowShellStore();

	const toggleAside = () => {
		setAsideStatus(!asideStatus);
		toggleMobileSidebar();
	};

	const closeAside = () => {
		setAsideStatus(false);
		closeMobileSidebar();
	};

	return { asideStatus, setAsideStatus, toggleAside, closeAside };
}
