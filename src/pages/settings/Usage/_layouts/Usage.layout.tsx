import { Outlet } from 'react-router';

const UsageLayout = () => (
	<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
		<Outlet />
	</div>
);

export default UsageLayout;
