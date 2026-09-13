import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';

type TOptionCardProps = {
	title: string;
	description?: ReactNode;
	isSelected: boolean;
	onSelect: () => void;
	/** Rendered top-right — a price, a badge, anything short. */
	aside?: ReactNode;
};

const OptionCard: FC<TOptionCardProps> = ({ title, description, isSelected, onSelect, aside }) => (
	<button
		type='button'
		onClick={onSelect}
		aria-pressed={isSelected}
		className={classNames(
			'flex w-full cursor-pointer flex-col gap-1 rounded-xl border p-4 text-start transition',
			isSelected
				? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/30'
				: 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-500/5 dark:border-zinc-800 dark:hover:border-zinc-700',
		)}>
		<div className='flex w-full items-start justify-between gap-3'>
			<span className='font-semibold text-zinc-800 dark:text-white'>{title}</span>
			<span className='flex shrink-0 items-center gap-2'>
				{aside}
				{isSelected && <Icon icon='CheckmarkCircle02' color='blue' />}
			</span>
		</div>
		{description && (
			<span className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</span>
		)}
	</button>
);

export default OptionCard;
