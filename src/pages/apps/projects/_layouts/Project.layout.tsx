import { Outlet } from 'react-router';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';

export interface OutletContextType {
	headerLeft?: ReactNode;
	setHeaderLeft: Dispatch<SetStateAction<ReactNode>>;
	headerRight?: ReactNode;
	setHeaderRight: Dispatch<SetStateAction<ReactNode>>;
}

const ProjectLayout = () => {
	const [headerLeft, setHeaderLeft] = useState(undefined);
	const [headerRight, setHeaderRight] = useState(undefined);

	return (
		<>
			{(headerLeft || headerRight) && (
				<Header>
					{headerLeft && <HeaderLeft>{headerLeft}</HeaderLeft>}
					{headerRight && <HeaderRight>{headerRight}</HeaderRight>}
				</Header>
			)}
			<Outlet context={{ headerLeft, setHeaderLeft, headerRight, setHeaderRight }} />
		</>
	);
};

export default ProjectLayout;
