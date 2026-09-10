import { Navigate, Outlet } from 'react-router';
import { Suspense } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/context/authContext';

const OnboardingLayout = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (!isLoading && !isAuthenticated) {
		return <Navigate to='/login' replace />;
	}

	return (
		<Suspense
			fallback={
				<div className='flex h-screen w-full items-center justify-center p-8'>
					<div className='grid w-full max-w-lg grid-cols-1 gap-4'>
						<Skeleton className='h-12 w-1/2' />
						<Skeleton className='h-6 w-full' />
						<Skeleton className='h-6 w-3/4' />
						<Skeleton className='h-48 w-full' />
						<Skeleton className='h-10 w-full' />
					</div>
				</div>
			}>
			<Outlet />
		</Suspense>
	);
};

export default OnboardingLayout;
