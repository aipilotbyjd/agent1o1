import { useState } from 'react';
import Button from '@/components/ui/Button';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import colors from '@/tailwindcss/colors.tailwind';
import dayjs from 'dayjs';
import { DateRange, Range } from 'react-date-range';

const DropdownRangeExample = () => {
	const [stateDateRange, setStateDateRange] = useState<Range[]>([
		{
			startDate: dayjs().toDate(),
			endDate: dayjs().toDate(),
			key: 'selection',
		},
	]);
	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Calendar' variant='link' color='blue' icon='Calendar01'>
					{stateDateRange[0].startDate?.getDay() === dayjs().toDate().getDay() &&
					stateDateRange[0].endDate?.getDay() === dayjs().toDate().getDay()
						? 'Today'
						: `${dayjs(stateDateRange[0].startDate).format('DD MMM YY')} / ${dayjs(stateDateRange[0].endDate).format('DD MMM YY')}`}
				</Button>
			</DropdownToggle>
			<DropdownMenu>
				<DateRange
					editableDateInputs
					onChange={(item) => setStateDateRange([item.selection])}
					moveRangeOnFirstSelection={false}
					ranges={stateDateRange}
					color={colors.blue['500']}
				/>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownRangeExample;
