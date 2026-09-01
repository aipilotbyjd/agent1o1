import { Outlet } from 'react-router';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import ChangeLanguageTemplate from '@/templates/header/ChangeLanguage.template';
import EXAMPLE from '@/examples/_index';

export interface OutletContextType {
	headerLeft?: ReactNode;
	setHeaderLeft: Dispatch<SetStateAction<ReactNode>>;
}

const MailLayoutPage = () => {
	const [headerLeft, setHeaderLeft] = useState('');

	return (
		<>
			<Header className='-mb-2'>
				<HeaderLeft>{headerLeft}</HeaderLeft>
				<HeaderRight>
					<ChangeDarkModeTemplate />
					<ChangeLanguageTemplate />
					<EXAMPLE.Ui.Dropdown.Notifications />
				</HeaderRight>
			</Header>
			<Outlet context={{ headerLeft, setHeaderLeft }} />
		</>
	);
};

export default MailLayoutPage;
