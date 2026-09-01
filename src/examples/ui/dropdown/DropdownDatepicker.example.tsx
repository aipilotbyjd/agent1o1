import { useState } from 'react';
import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import dayjs from 'dayjs';
import { DateRange, Range } from 'react-date-range';
import colors from '@/tailwindcss/colors.tailwind';

const DropdownDatepickerExample = () => {
	const [stateDateRange, setStateDateRange] = useState<Range[]>([
		{
			startDate: dayjs().add(-7, 'day').toDate(),
			endDate: dayjs().add(-1, 'day').toDate(),
			key: 'selection',
		},
	]);

	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Calendar' variant='link' color='blue' icon='Calendar01'>
					{`${dayjs(stateDateRange[0].startDate).format('DD MMM YY')} / ${dayjs(stateDateRange[0].endDate).format('DD MMM YY')}`}
				</Button>
			</DropdownToggle>
			<DropdownMenu placement='bottom-end'>
				<DateRange
					editableDateInputs
					months={2}
					direction='horizontal'
					onChange={(item) => setStateDateRange([item.selection])}
					moveRangeOnFirstSelection={false}
					ranges={stateDateRange}
					color={colors.blue['500']}
				/>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownDatepickerExample;
