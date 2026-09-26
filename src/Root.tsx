import { ReactNode, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useAuth } from './context/auth';
import useFontSize from './hooks/useFontSize';
import { ToastContainer } from 'react-toastify';
import useDarkMode from './hooks/useDarkMode';
import AppLogo from './components/AppLogo';
import colors from './tailwindcss/colors.tailwind';

const RootWrapper = ({ children }: { children: ReactNode }) => {
	const { fontSize } = useFontSize();
	const { isDarkTheme } = useDarkMode();
	return (
		<>
			<style>{`:root {font-size: ${fontSize}px;
			--toastify-toast-bd-radius: 0.75rem;
			--toastify-color-dark: ${colors.zinc['950']};
			--toastify-color-info: ${colors.blue['500']};
			--toastify-color-success: ${colors.emerald['500']};
			--toastify-color-warning: ${colors.amber['500']};
			--toastify-color-error: ${colors.red['500']};
			--toastify-color-progress-light: linear-gradient(to right, ${colors.blue['500']}, ${colors.emerald['500']}, ${colors.amber['500']}, ${colors.red['500']});
				}`}</style>
			{children}
			<ToastContainer
				theme={isDarkTheme ? 'dark' : 'light'}
				hideProgressBar
				// rtl={isRTL}
			/>
		</>
	);
};

const Root = () => {
	const { isLoading } = useAuth();
	const location = useLocation();


	useEffect(() => {
		window.scrollTo(0, 0);
	}, [location.pathname, location.search]);

	return (
		<RootWrapper>
			{isLoading && (
				<div className='flex h-full items-center justify-center'>
					<AppLogo className='size-24' rounded='rounded-3xl' alt='' />
				</div>
			)}
			{!isLoading && (
				<div className='flex grow flex-col'>
					<Outlet />
				</div>
			)}
		</RootWrapper>
	);
};

export default Root;
