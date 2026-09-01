import { useState, useCallback, FC } from 'react';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { TColors } from '@/types/colors.type';

// Define allowed status keys and options
export type TStatusKey = 'backlog' | 'todo' | 'changeRequest' | 'inProgress' | 'inReview' | 'done';

interface StatusOption {
	key: TStatusKey;
	label: string;
	icon: string;
	color: TColors;
}

const statusOptions: StatusOption[] = [
	{ key: 'backlog', label: 'Backlog', icon: 'DashedLineCircle', color: 'zinc' },
	{ key: 'todo', label: 'To Do', icon: 'Progress01', color: 'zinc' },
	{ key: 'changeRequest', label: 'Change request', icon: 'Progress02', color: 'secondary' },
	{ key: 'inProgress', label: 'In progress', icon: 'Progress03', color: 'amber' },
	{ key: 'inReview', label: 'In review', icon: 'Progress04', color: 'emerald' },
	{ key: 'done', label: 'Done', icon: 'CheckmarkCircle02', color: 'blue' },
];

export interface DropdownChangeStatusExampleProps {
	/** Initial selected status key, defaults to 'inProgress' */
	initialStatusKey?: TStatusKey;
	/** Callback invoked when status changes */
	onStatusChange?: (key: TStatusKey) => void;
}

const DropdownChangeStatusExample: FC<DropdownChangeStatusExampleProps> = ({
	initialStatusKey = 'inProgress',
	onStatusChange,
}) => {
	const [currentKey, setCurrentKey] = useState<TStatusKey>(initialStatusKey);

	// Find the current status object
	const currentStatus =
		statusOptions.find((option) => option.key === currentKey) || statusOptions[0];

	// Handler when a dropdown item is selected
	const handleSelect = useCallback(
		(key: TStatusKey) => {
			setCurrentKey(key);
			if (onStatusChange) onStatusChange(key);
		},
		[onStatusChange],
	);

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button
					color='zinc'
					variant='link'
					className='flex items-center gap-2 px-0!'
					aria-label='Dropdown'>
					<Icon icon={currentStatus.icon} color={currentStatus.color} size='text-xl' />
					<span>{currentStatus.label}</span>
				</Button>
			</DropdownToggle>
			<DropdownMenu>
				{statusOptions.map((option) => (
					<DropdownItem
						key={option.key}
						className='flex items-center gap-2'
						onClick={() => handleSelect(option.key)}>
						<Icon icon={option.icon} color={option.color} size='text-xl' />
						<span>{option.label}</span>
						{option.key === currentKey && (
							<Icon
								icon='Tick02'
								color={option.color}
								size='text-xl'
								className='ms-auto'
							/>
						)}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownChangeStatusExample;
