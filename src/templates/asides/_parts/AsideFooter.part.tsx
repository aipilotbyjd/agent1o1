import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import DARK_MODE from '@/constants/darkMode.constant';
import pages from '@/Routes/pages';
import User from '@/components/layout/User/User';
import { NavItem, NavSeparator } from '@/components/layout/Navigation/Nav';
import DarkModeSwitcherPart from '@/parts/DarkModeSwitcher.part';
import FontSizeSwitcherPart from '@/parts/FontSizeSwitcher.part';
import { AsideFooter } from '@/components/layout/Aside';
import useAsideStatus from '@/hooks/useAsideStatus';
import { useAuth } from '@/context/auth';
import useDarkMode from '@/hooks/useDarkMode';
import useResolvePath from '@/hooks/useResolvePath';
import { useNavigate } from 'react-router';

const AsideFooterPart = () => {
	const { asideStatus } = useAsideStatus();
	const { resolvePath } = useResolvePath();
	const { setDarkModeStatus, darkModeStatus } = useDarkMode();

	const navigate = useNavigate();

	const { onLogout } = useAuth();

	const { userData, tokenStorage } = useAuth();

	return (
		<AsideFooter>
			{asideStatus && (
				<div className='flex justify-between gap-3 p-3'>
					<Button
						icon='Book02'
						variant='link'
						aria-label='Documentation'
						onClick={() =>
							window.open(
								'https://docs.agent1o1.com',
								'_blank',
								'noopener,noreferrer',
							)
						}
						className='!p-0'
					/>
					<Button
						icon={pages.settings.icon}
						variant='link'
						aria-label={pages.settings.text}
						onClick={() => navigate(resolvePath(pages.settings.to))}
						className='!p-0'
					/>
					<Button
						icon={
							(darkModeStatus === DARK_MODE.LIGHT && 'Sun03') ||
							(darkModeStatus === DARK_MODE.DARK && 'Moon02') ||
							'Computer'
						}
						variant='link'
						aria-label='Change theme'
						className='!p-0'
						onClick={() => {
							if (darkModeStatus === DARK_MODE.LIGHT)
								setDarkModeStatus(DARK_MODE.DARK);
							if (darkModeStatus === DARK_MODE.DARK)
								setDarkModeStatus(DARK_MODE.SYSTEM);
							if (darkModeStatus === DARK_MODE.SYSTEM)
								setDarkModeStatus(DARK_MODE.LIGHT);
						}}
					/>
				</div>
			)}
			<User
				name={userData ? `${userData?.firstName} ${userData?.lastName}` : undefined}
				position={userData?.role}
				nameSuffix={userData?.isVerified && <Icon icon='CheckmarkBadge02' color='blue' />}
				src={userData?.image.org}>
				<NavSeparator />

				{tokenStorage && (
					<NavItem {...pages.settings} to={resolvePath(pages.settings.to)} end={false} />
				)}
				{tokenStorage && (
					<NavItem text='Logout' icon='Logout03' onClick={() => onLogout(true)} />
				)}
				{!tokenStorage && (
					<NavItem
						text='Log in'
						icon='Login03'
						onClick={() => navigate(pages.identity.login.to)}
					/>
				)}
				<DarkModeSwitcherPart />
				<FontSizeSwitcherPart />
			</User>
		</AsideFooter>
	);
};

export default AsideFooterPart;
