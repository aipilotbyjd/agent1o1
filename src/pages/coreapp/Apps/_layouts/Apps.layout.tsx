import { Outlet } from 'react-router';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import DropdownWorkspaceSwitcher from '@/examples/ui/dropdown/DropdownWorkspaceSwitcher.example';
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
					<DropdownWorkspaceSwitcher />
				</HeaderRight>
			</Header>
			<Outlet context={{ headerLeft, setHeaderLeft }} />
		</>
	);
};

export default AppsLayout;
