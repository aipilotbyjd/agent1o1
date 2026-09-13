import { FC } from 'react';
import ButtonGroup from '@/components/ui/ButtonGroup';
import Button from '@/components/ui/Button';

// ============================================================
// Window Selector
// ------------------------------------------------------------
// The `days` parameter every dashboard endpoint shares. Kept to
// three presets rather than a date picker: the endpoints return
// one series point per day and cap at a year, so anything longer
// is a report, not a dashboard.
// ============================================================

export const WINDOW_OPTIONS = [7, 30, 90] as const;

interface IWindowSelectorProps {
	value: number;
	onChange: (days: number) => void;
}

const WindowSelectorPart: FC<IWindowSelectorProps> = ({ value, onChange }) => (
	<ButtonGroup variant='outline' color='zinc'>
		{WINDOW_OPTIONS.map((days) => (
			<Button
				key={days}
				isActive={value === days}
				onClick={() => onChange(days)}
				aria-pressed={value === days}>
				{`${days}d`}
			</Button>
		))}
	</ButtonGroup>
);

export default WindowSelectorPart;
