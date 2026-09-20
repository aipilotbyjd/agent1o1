import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
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
import { useWorkspaceContext } from '@/context/workspace';
import useDarkMode from '@/hooks/useDarkMode';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import ThemeContext from '@/context/theme';
import LANG from '@/constants/lang.constant';
import { useNavigate, useParams } from 'react-router';

const AsideFooterPart = () => {
	const { asideStatus } = useAsideStatus();
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	const wsId = workspaceId || activeWorkspaceId;
	const resolvePath = (to: string) => (wsId ? to.replace(':workspaceId', wsId) : to);
	const { setDarkModeStatus, darkModeStatus } = useDarkMode();

	const navigate = useNavigate();

	const { onLogout } = useAuth();

	const { i18n } = useTranslation();
	const { setLanguage } = useContext(ThemeContext);

	const { userData, tokenStorage } = useAuth();

	const langArray = Object.values(LANG);
	const activeLang = langArray.filter((key) => key.lng === i18n.language)[0];

	return (
		<AsideFooter>
			{asideStatus && (
				<div className='flex justify-between gap-3 p-3'>
					<Dropdown>
						<DropdownToggle hasIcon={false}>
							<Button
								icon='LanguageSquare'
								variant='link'
								aria-label='Select Language'
								className='!p-0'
							/>
						</DropdownToggle>
						<DropdownMenu>
							{langArray.map((item) => (
								<DropdownItem
									isActive={activeLang.lng === item.lng}
									key={item.lng}
									onClick={() => setLanguage(item.lng)}>
									<Icon
										icon={item.icon}
										size='text-2xl'
										className='ltr:mr-2 rtl:ml-2'
									/>
									{item.text}
								</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
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
					<Button
						icon='Settings02'
						variant='link'
						aria-label='Settings'
						title='Settings'
						className='!p-0'
						onClick={() => navigate(resolvePath(pages.workspaceSettings.to))}
					/>
					<Button
						icon='AiChat02'
						variant='link'
						aria-label='Quick view'
						onClick={() => {}}
						className='!p-0'
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
