import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/context/auth';
import { LogoDark } from '@/assets/images';

const Protected = () => {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<img src={LogoDark} alt='' className='h-24' />
			</div>
		);
	}
	if (!isAuthenticated) {
		return <Navigate to='/login' />;
	}

	return <Outlet />;
};

export default Protected;
