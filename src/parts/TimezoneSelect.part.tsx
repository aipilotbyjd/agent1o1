import type { SelectHTMLAttributes } from 'react';
import { useTimezones } from '@/api/modules/timezones';

interface ITimezoneSelectProps extends Omit<
	SelectHTMLAttributes<HTMLSelectElement>,
	'value' | 'onChange' | 'children'
> {
	/** An IANA name, or '' for the `emptyLabel` choice. */
	value: string;
	onChange: (timezone: string) => void;
	/** Offers '' as a first choice with this label, e.g. "Same as workspace". */
	emptyLabel?: string;
}

/** A picker over the backend's timezones. Shows `value` alone until the list arrives. */
const TimezoneSelectPart = ({
	value,
	onChange,
	emptyLabel,
	disabled,
	...rest
}: ITimezoneSelectProps) => {
	const { data: timezones } = useTimezones();
	const isListed = value === '' || !!timezones?.some((timezone) => timezone.id === value);
	const options = [
		...(emptyLabel !== undefined ? [{ id: '', label: emptyLabel }] : []),
		...(isListed ? [] : [{ id: value, label: value }]),
		...(timezones ?? []),
	];

	return (
		<select
			{...rest}
			value={value}
			disabled={disabled || !timezones}
			onChange={(event) => onChange(event.target.value)}>
			{options.map((timezone) => (
				<option key={timezone.id} value={timezone.id}>
					{timezone.label}
				</option>
			))}
		</select>
	);
};

export default TimezoneSelectPart;
