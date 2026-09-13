import { FC } from 'react';
import Badge from '@/components/ui/Badge';
import type { TBadgeVariants } from '@/components/ui/Badge';
import { TColors } from '@/types/colors.type';
import { TIcons } from '@/types/icons.type';
import Icon from '@/components/icon/Icon';
import { humanize } from '@/utils/format.util';
import type { TNodeRunStatus, TRunStatus } from '@/types/run.type';

// ============================================================
// Run Status Badge
// ------------------------------------------------------------
// One mapping of `RunStatus` to colour and icon for the whole app,
// so a run reads the same on the dashboard, the run list and a
// node-run timeline. Covers the node-only `skipped` status too —
// node runs share the enum plus that one extra case.
//
// `awaiting_approval` is amber rather than a neutral: it is the
// one in-flight state that needs a human, and colouring it like
// `running` buries the thing the operator has to act on.
// ============================================================

const STATUS_STYLES: Record<TNodeRunStatus, { color: TColors; icon: TIcons }> = {
	pending: { color: 'zinc', icon: 'Clock01' },
	running: { color: 'blue', icon: 'Loading03' },
	awaiting_approval: { color: 'amber', icon: 'UserCheck01' },
	awaiting_callback: { color: 'violet', icon: 'Hourglass' },
	completed: { color: 'emerald', icon: 'CheckmarkCircle02' },
	failed: { color: 'red', icon: 'AlertCircle' },
	cancelled: { color: 'zinc', icon: 'CancelCircle' },
	skipped: { color: 'zinc', icon: 'ArrowRight01' },
};

interface IRunStatusBadgeProps {
	status: TRunStatus | TNodeRunStatus;
	variant?: TBadgeVariants;
	className?: string;
	/** Off for dense table cells where the icon is just noise. */
	withIcon?: boolean;
}

const RunStatusBadge: FC<IRunStatusBadgeProps> = ({
	status,
	variant = 'soft',
	className,
	withIcon = true,
}) => {
	const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

	return (
		<Badge
			color={style.color}
			variant={variant}
			rounded='rounded-full'
			className={['inline-flex items-center gap-1 whitespace-nowrap', className]
				.filter(Boolean)
				.join(' ')}>
			{withIcon && (
				<Icon
					icon={style.icon}
					className={status === 'running' ? 'animate-spin' : undefined}
					size='text-sm'
				/>
			)}
			{humanize(status)}
		</Badge>
	);
};

export default RunStatusBadge;
export { STATUS_STYLES };
