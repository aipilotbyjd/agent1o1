import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from '@/pages/apps/chat/_layouts/Chat.layout';
import UnderConstructionTemplate from '@/templates/container/UnderConstruction.template';

const ChatDashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.apps.chat }]} />);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return (
		<>
			<UnderConstructionTemplate />
		</>
	);
};

export default ChatDashboardPage;
