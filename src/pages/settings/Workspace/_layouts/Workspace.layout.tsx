import { Outlet } from 'react-router';
import { Dispatch, ReactNode, SetStateAction, useState } from 'react';

export interface OutletContextType {
	headerLeft?: ReactNode;
	setHeaderLeft: Dispatch<SetStateAction<ReactNode>>;
}

const WorkspaceLayout = () => {
	const [headerLeft, setHeaderLeft] = useState('');

	return (
		<>
			<Outlet context={{ headerLeft, setHeaderLeft }} />
		</>
	);
};

export default WorkspaceLayout;
