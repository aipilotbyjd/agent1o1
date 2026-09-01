import { useState } from 'react';
import Header, { HeaderLeft } from '@/components/layout/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';
import Container from '@/components/layout/Container';
import dayjs from 'dayjs';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import {
	Calendar,
	DateRange,
	DateRangePicker,
	DefinedRange,
	Range,
	RangeKeyDict,
} from 'react-date-range';
import PreviewComponent from '@/components/utils/PreviewComponent';
import daterangeMd from './_md/daterange.md';
import daterangepickerMd from './_md/daterangepicker.md';
import calendarMd from './_md/calendar.md';
import definedMd from './_md/defined.md';
import colors from '@/tailwindcss/colors.tailwind';

const DatepickerPage = () => {
	const [stateDateRange, setStateDateRange] = useState<Range[]>([
		{
			startDate: dayjs().toDate(),
			endDate: undefined,
			key: 'selection',
		},
	]);
	const [stateDateRangePicker, setStateDateRangePicker] = useState<RangeKeyDict>({
		selection: {
			startDate: dayjs().startOf('week').add(-1, 'week').toDate(),
			endDate: dayjs().endOf('week').toDate(),
			key: 'selection',
		},
		selection2: {
			startDate: dayjs().startOf('week').add(-1, 'week').add(2, 'day').toDate(),
			endDate: dayjs().endOf('week').add(-4, 'day').toDate(),
			key: 'selection2',
		},
		selection3: {
			startDate: dayjs().startOf('week').add(2, 'week').add(2, 'day').toDate(),
			endDate: dayjs().startOf('week').add(3, 'week').add(5, 'day').toDate(),
			key: 'selection3',
		},
		selection4: {
			startDate: dayjs().startOf('week').add(-2, 'week').add(2, 'day').toDate(),
			endDate: dayjs().startOf('week').add(-2, 'week').add(5, 'day').toDate(),
			key: 'selection4',
		},
	});
	const [stateCalendar, setStateCalendar] = useState<Date>(dayjs().toDate());
	const [stateDefinedRange, setStateDefinedRange] = useState<Range[]>([
		{
			startDate: dayjs().toDate(),
			endDate: undefined,
			key: 'selection',
		},
	]);

	return (
		<>
			<Header>
				<HeaderLeft className='flex-col items-start!'>
					<Breadcrumb
						list={[
							{ ...pages.documentation.baseComponent },
							{ ...pages.documentation.baseComponent.subPages.datepicker },
						]}
					/>
					<div className='flex items-center gap-4 py-8'>
						<Icon
							icon={pages.documentation.baseComponent.subPages.datepicker.icon}
							size='text-4xl'
						/>
						<span className='text-4xl font-bold'>
							{pages.documentation.baseComponent.subPages.datepicker.text}
						</span>
					</div>
				</HeaderLeft>
			</Header>
			<Container>
				<div className='flex flex-col gap-8'>
					<div className='text-2xl text-zinc-500'>
						Boltify's Tailwind CSS Collapse component represents toggle buttons, to show
						and hide or collapse and expand content or navigation items, managing its
						visibility.
					</div>
					<div className='text-3xl font-bold'>Components</div>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle
									iconProps={{
										icon: 'Calendar02',
										color: 'blue',
										size: 'text-3xl',
									}}>
									DateRange
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='text-zinc-500'>
								A basic card containing a title, content and an extra corner
								content.
							</div>
							<PreviewComponent mdFile={daterangeMd as RequestInfo} inIFrame={false}>
								<DateRange
									editableDateInputs
									onChange={(item) => setStateDateRange([item.selection])}
									moveRangeOnFirstSelection={false}
									ranges={stateDateRange}
									color={colors.blue['500']}
								/>
							</PreviewComponent>
						</CardBody>
					</Card>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle
									iconProps={{
										icon: 'CalendarCheckOut02',
										color: 'blue',
										size: 'text-3xl',
									}}>
									DateRangePicker
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='text-zinc-500'>
								A basic card containing a title, content and an extra corner
								content.
							</div>
							<PreviewComponent
								mdFile={daterangepickerMd as RequestInfo}
								inIFrame={false}>
								<DateRangePicker
									onChange={(item) =>
										setStateDateRangePicker({
											...stateDateRangePicker,
											...item,
										})
									}
									moveRangeOnFirstSelection={false}
									retainEndDateOnFirstSelection={false}
									months={2}
									ranges={Object.values(stateDateRangePicker)}
									direction='horizontal'
									rangeColors={[
										colors.blue['500'],
										colors.emerald['500'],
										colors.amber['500'],
										colors.violet['500'],
									]}
									// locale={activeLocale}
								/>
							</PreviewComponent>
						</CardBody>
					</Card>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle
									iconProps={{
										icon: 'Calendar03',
										color: 'blue',
										size: 'text-3xl',
									}}>
									Calendar
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='text-zinc-500'>
								A basic card containing a title, content and an extra corner
								content.
							</div>
							<PreviewComponent mdFile={calendarMd as RequestInfo} inIFrame={false}>
								<Calendar
									onChange={(item) => setStateCalendar(item)}
									date={stateCalendar}
								/>
							</PreviewComponent>
						</CardBody>
					</Card>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle
									iconProps={{
										icon: 'CalendarSetting01',
										color: 'blue',
										size: 'text-3xl',
									}}>
									DefinedRange
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='text-zinc-500'>
								A basic card containing a title, content and an extra corner
								content.
							</div>
							<PreviewComponent mdFile={definedMd as RequestInfo} inIFrame={false}>
								<DefinedRange
									onChange={(item) => setStateDefinedRange([item.selection])}
									ranges={stateDefinedRange}
								/>
							</PreviewComponent>
						</CardBody>
					</Card>
				</div>
			</Container>
		</>
	);
};

export default DatepickerPage;
