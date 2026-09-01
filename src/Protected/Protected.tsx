import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/context/authContext';
import { LogoDark } from '@/assets/images';

// `role` is unused: the backend has no global role, only per-workspace ones.
const Protected = ({ role: _role }: { role: string }) => {
	const { userData, tokenStorage, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<img src={LogoDark} alt='' className='h-24' />
			</div>
		);
	}
	if (!tokenStorage || !userData) {
		return <Navigate to='/login' />;
	}

	return <Outlet />;
};

export default Protected;
