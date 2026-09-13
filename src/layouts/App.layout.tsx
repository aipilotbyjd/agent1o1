import { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { Outlet } from 'react-router';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import NotificationsTemplate from '@/templates/header/Notifications.template';

// ============================================================
// App Layout
// ------------------------------------------------------------
// The shell every real product screen sits in: one header with
// the notification bell, nested inside `DefaultLayout` (which
// owns the aside and the route-level Suspense boundary).
//
// It exists because `DefaultLayout` renders no header of its own
// — the template's demo apps each build one in their own layout.
// Doing the same here means the bell is mounted once, rather than
// once per screen with a different set of actions beside it each
// time.
//
// `headerLeft` follows the template's outlet-context convention so
// a screen can push a breadcrumb up into the header without the
// layout having to know the route table.
// ============================================================

export interface IAppOutletContext {
	headerLeft?: ReactNode;
	setHeaderLeft: Dispatch<SetStateAction<ReactNode>>;
}

const AppLayout = () => {
	const [headerLeft, setHeaderLeft] = useState<ReactNode>(null);

	return (
		<>
			<Header>
				<HeaderLeft>{headerLeft}</HeaderLeft>
				<HeaderRight>
					<ChangeDarkModeTemplate />
					<NotificationsTemplate />
				</HeaderRight>
			</Header>
			<Outlet context={{ headerLeft, setHeaderLeft } satisfies IAppOutletContext} />
		</>
	);
};

export default AppLayout;
