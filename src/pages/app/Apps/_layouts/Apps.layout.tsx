import { Outlet } from 'react-router';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import EXAMPLE from '@/examples/_index';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';

export interface OutletContextType {
	headerLeft?: ReactNode;
	setHeaderLeft: Dispatch<SetStateAction<ReactNode>>;
}

const AppsLayout = () => {
	const [headerLeft, setHeaderLeft] = useState('');

	return (
		<>
			<Header>
				<HeaderLeft>{headerLeft}</HeaderLeft>
				<HeaderRight>
					<NotificationsDropdown />
					<EXAMPLE.Ui.Dropdown.WorkspaceSwitcher />
				</HeaderRight>
			</Header>
			<Outlet context={{ headerLeft, setHeaderLeft }} />
		</>
	);
};

export default AppsLayout;
