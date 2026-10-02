import { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router';
import dayjs from 'dayjs';
import Button from '@/components/ui/Button';
import { LogoDark, LogoLight } from '@/assets/images';
import useDarkMode from '@/hooks/useDarkMode';

const RELOAD_FLAG = 'route-error-chunk-reload';

// After a deploy, a tab still running the old build asks for chunk files that
// no longer exist. That is not a bug in the page — one reload fixes it.
const isChunkLoadError = (error: unknown) =>
	error instanceof Error &&
	/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
		error.message,
	);

/**
 * Router `errorElement`: shown instead of react-router's developer error
 * screen when a page throws while rendering or loading. Same shell as 404.
 */
const RouteErrorPage = () => {
	const error = useRouteError();
	const navigate = useNavigate();
	const { isDarkTheme } = useDarkMode();
	const isChunkError = isChunkLoadError(error);

	useEffect(() => {
		if (import.meta.env.DEV) console.error(error);
		if (!isChunkError) return;
		try {
			// Reload once; if the chunk is still missing, show the page instead of looping.
			if (sessionStorage.getItem(RELOAD_FLAG)) return;
			sessionStorage.setItem(RELOAD_FLAG, '1');
		} catch {
			return;
		}
		window.location.reload();
	}, [error, isChunkError]);

	useEffect(() => {
		// A page that renders fine again clears the flag for the next deploy.
		if (isChunkError) return;
		try {
			sessionStorage.removeItem(RELOAD_FLAG);
		} catch {
			// Storage blocked — nothing to clear.
		}
	}, [isChunkError]);

	return (
		<div className='flex h-full min-h-screen flex-col items-center justify-stretch p-8'>
			<button aria-label='Homepage' onClick={() => navigate('/')}>
				<img
					src={isDarkTheme ? LogoDark : LogoLight}
					alt='Boltify'
					className='h-18 cursor-pointer transition-all duration-300 ease-in-out'
				/>
			</button>
			<div className='flex h-full flex-col items-center justify-center gap-4 text-center'>
				<div className='text-4xl font-bold'>Something went wrong.</div>
				<div className=''>
					{isChunkError
						? 'A new version is available. Reload to continue.'
						: 'This page hit an unexpected error. Reloading usually fixes it.'}
				</div>
				<div className='flex flex-wrap items-center justify-center gap-3'>
					<Button
						aria-label='Reload page'
						variant='solid'
						color='primary'
						dimension='lg'
						onClick={() => window.location.reload()}>
						Reload
					</Button>
					<Button
						aria-label='Homepage'
						variant='outline'
						color='zinc'
						icon='ArrowLeft01'
						dimension='lg'
						onClick={() => navigate('/')}>
						Back to Home
					</Button>
				</div>
			</div>
			<div className='text-zinc-500'>© All Rights Reserved. {dayjs().format('YYYY')}.</div>
		</div>
	);
};

export default RouteErrorPage;
