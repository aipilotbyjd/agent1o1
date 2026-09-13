import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { TColors } from '@/types/colors.type';
import { TIcons } from '@/types/icons.type';

// ============================================================
// Stat Tile
// ------------------------------------------------------------
// The headline-number card every overview screen repeats. Holds
// its own loading state so a dashboard renders its real layout
// on first paint instead of a block of grey that reflows once
// the numbers land.
// ============================================================

const ICON_TINT: Record<TColors, string> = {
	primary: 'bg-primary-500/15 text-primary-500',
	secondary: 'bg-secondary-500/15 text-secondary-500',
	zinc: 'bg-zinc-500/15 text-zinc-500',
	red: 'bg-red-500/15 text-red-500',
	amber: 'bg-amber-500/15 text-amber-500',
	lime: 'bg-lime-500/15 text-lime-500',
	emerald: 'bg-emerald-500/15 text-emerald-500',
	sky: 'bg-sky-500/15 text-sky-500',
	blue: 'bg-blue-500/15 text-blue-500',
	violet: 'bg-violet-500/15 text-violet-500',
};

export interface IStatTileProps {
	label: string;
	value: ReactNode;
	icon?: TIcons;
	color?: TColors;
	/** Secondary line under the value — a comparison or a unit. */
	hint?: ReactNode;
	isLoading?: boolean;
	className?: string;
}

const StatTile: FC<IStatTileProps> = ({
	label,
	value,
	icon,
	color = 'zinc',
	hint,
	isLoading = false,
	className,
}) => {
	return (
		<Card className={className}>
			<CardBody>
				<div className='flex items-start justify-between gap-3'>
					<div className='min-w-0'>
						<div className='truncate text-sm text-zinc-500'>{label}</div>
						{isLoading ? (
							<Skeleton className='mt-2 h-8 w-20' />
						) : (
							<div className='mt-1 text-3xl font-semibold'>{value}</div>
						)}
						{hint && !isLoading && (
							<div className='mt-1 text-xs text-zinc-500'>{hint}</div>
						)}
					</div>
					{icon && (
						<div
							className={classNames(
								'flex size-10 shrink-0 items-center justify-center rounded-xl',
								ICON_TINT[color],
							)}>
							<Icon icon={icon} size='text-2xl' />
						</div>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default StatTile;
