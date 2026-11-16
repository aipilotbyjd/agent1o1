import { FC, ReactNode } from 'react';
import { useCan, TPermissionCheck } from '@/hooks/usePermission';

interface ICanProps {
	permission: TPermissionCheck;
	/** With several permissions: pass when any (default) or all are granted. */
	mode?: 'any' | 'all';
	children: ReactNode;
	/** Rendered instead when the permission is missing. */
	fallback?: ReactNode;
}

/** Renders its children only when the active workspace grants the permission. */
const Can: FC<ICanProps> = ({ permission, mode = 'any', children, fallback = null }) => {
	const allowed = useCan(permission, mode);
	return <>{allowed ? children : fallback}</>;
};

export default Can;
