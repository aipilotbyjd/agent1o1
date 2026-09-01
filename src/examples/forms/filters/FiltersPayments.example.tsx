// @start-snippet:: filtersPaymentsExampleSource
import Input from '@/components/form/Input';
import InputGroup from '@/components/form/InputGroup';
import Select from '@/components/form/Select';
import FieldWrap from '@/components/form/FieldWrap';
import Label from '@/components/form/Label';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Description from '@/components/form/Description';
import { useFormik } from 'formik';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import Checkbox, { CheckboxGroup } from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import { CardBody, CardFooter, CardFooterChild } from '@/components/ui/Card';

interface FormValues {
	min: string;
	max: string;
	currency: string;
	dateFrom: string;
	dateTo: string;
	period: 'custom' | 'last30Days' | 'last30Months';
	transactionTypes: string[];
	types: string[];
	direction: 'all' | 'moneyIn' | 'moneyOut';
}

const FiltersPaymentsExample = () => {
	const formik = useFormik<FormValues>({
		initialValues: {
			min: '',
			max: '',
			currency: 'usd',
			dateFrom: '',
			dateTo: '',
			period: 'custom',
			transactionTypes: ['Transfers', 'Cash withdrawal'],
			types: [''],
			direction: 'all',
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});

	useEffect(() => {
		const today = dayjs();

		if (formik.values.period === 'last30Days') {
			formik.setValues({
				...formik.values,
				dateFrom: today.subtract(30, 'day').format('YYYY-MM-DD'),
				dateTo: today.format('YYYY-MM-DD'),
			});
		} else if (formik.values.period === 'last30Months') {
			formik.setValues({
				...formik.values,
				dateFrom: today.subtract(3, 'month').format('YYYY-MM-DD'),
				dateTo: today.format('YYYY-MM-DD'),
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formik.values.period]);
	useEffect(() => {
		const today = dayjs();
		const expectedLast30 = {
			from: today.subtract(30, 'day').format('YYYY-MM-DD'),
			to: today.format('YYYY-MM-DD'),
		};
		const expectedLast3Months = {
			from: today.subtract(3, 'month').format('YYYY-MM-DD'),
			to: today.format('YYYY-MM-DD'),
		};

		const isLast30 =
			formik.values.dateFrom === expectedLast30.from &&
			formik.values.dateTo === expectedLast30.to;
		const isLast3Months =
			formik.values.dateFrom === expectedLast3Months.from &&
			formik.values.dateTo === expectedLast3Months.to;

		if (isLast30 && formik.values.period !== 'last30Days') {
			formik.setFieldValue('period', 'last30Days');
		} else if (isLast3Months && formik.values.period !== 'last30Months') {
			formik.setFieldValue('period', 'last30Months');
		} else if (!isLast30 && !isLast3Months && formik.values.period !== 'custom') {
			formik.setFieldValue('period', 'custom');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [formik.values.dateFrom, formik.values.dateTo]);

	return (
		<>
			<CardBody>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<Label htmlFor='min'>Price</Label>
						<InputGroup>
							<Button
								aria-label='Money'
								variant='outline'
								icon='CoinsDollar'
								color='zinc'
								inert
								className='px-4!'
							/>
							<FieldWrap firstSuffix='Min:'>
								<Input
									id='min'
									name='min'
									placeholder='0.00'
									min={0}
									type='number'
									step='0.01'
									value={formik.values.min}
									onChange={formik.handleChange}
								/>
							</FieldWrap>
							<FieldWrap firstSuffix='Max:'>
								<Input
									name='max'
									placeholder='0.00'
									min={0}
									type='number'
									step='0.01'
									value={formik.values.max}
									onChange={formik.handleChange}
								/>
							</FieldWrap>
							<Select
								name='currency'
								className='w-48!'
								value={formik.values.currency}
								onChange={formik.handleChange}>
								<option value='usd'>USD</option>
								<option value='eur'>EUR</option>
							</Select>
						</InputGroup>
					</div>
					<div className='col-span-12'>
						<Label htmlFor='dateFrom'>Date</Label>
						<InputGroup>
							<Button
								aria-label='Calendar'
								variant='outline'
								icon='Calendar02'
								color='zinc'
								inert
								className='px-4!'
							/>
							<FieldWrap firstSuffix='From:'>
								<Input
									id='dateFrom'
									name='dateFrom'
									type='date'
									aria-describedby='dateDesc"'
									value={formik.values.dateFrom}
									onChange={formik.handleChange}
								/>
							</FieldWrap>
							<FieldWrap firstSuffix='To:'>
								<Input
									name='dateTo'
									type='date'
									aria-describedby='dateDesc'
									value={formik.values.dateTo}
									onChange={formik.handleChange}
								/>
							</FieldWrap>
						</InputGroup>
						<Description id='dateDesc'>
							<RadioGroup isInline>
								<Radio
									name='period'
									label='Custom'
									value='custom'
									selectedValue={formik.values.period}
									onChange={formik.handleChange}
								/>
								<Radio
									name='period'
									label='Last 30 days'
									value='last30Days'
									selectedValue={formik.values.period}
									onChange={formik.handleChange}
								/>
								<Radio
									name='period'
									label='Last 3 months'
									value='last30Months'
									selectedValue={formik.values.period}
									onChange={formik.handleChange}
								/>
							</RadioGroup>
						</Description>
					</div>
					<div className='col-span-12'>
						<Label htmlFor='transactionTypes'>Date</Label>
						<CheckboxGroup>
							{[
								'Transfers',
								'Money added',
								'Cash withdrawal',
								'Card transactions',
								'Direct debits',
								'Batch transfers',
								'Conversions',
							].map((label) => (
								<Checkbox
									key={label}
									name='transactionTypes'
									label={label}
									value={label}
									checked={formik.values.transactionTypes.includes(label)}
									onChange={formik.handleChange}
								/>
							))}
						</CheckboxGroup>
					</div>
					<div className='col-span-12'>
						<Label htmlFor='types'>Type</Label>
						<CheckboxGroup>
							{['Completed', 'Pending', 'Cancelled'].map((label) => (
								<Checkbox
									key={label}
									name='types'
									label={label}
									value={label}
									checked={formik.values.types.includes(label)}
									onChange={formik.handleChange}
								/>
							))}
						</CheckboxGroup>
					</div>
					<div className='col-span-12'>
						<Label htmlFor='direction'>Direction</Label>
						<RadioGroup isInline>
							<Radio
								id='direction'
								name='direction'
								label={
									<div className='flex items-center gap-2'>
										<Icon icon='MoneyExchange02' />
										<div>All</div>
									</div>
								}
								value='all'
								selectedValue={formik.values.direction}
								onChange={formik.handleChange}
							/>
							<Radio
								name='direction'
								label={
									<div className='flex items-center gap-2'>
										<Icon icon='MoneyAdd02' />
										<div>Money in</div>
									</div>
								}
								value='moneyIn'
								selectedValue={formik.values.direction}
								onChange={formik.handleChange}
							/>
							<Radio
								name='direction'
								label={
									<div className='flex items-center gap-2'>
										<Icon icon='MoneyRemove02' />
										<div>Money out</div>
									</div>
								}
								value='moneyOut'
								selectedValue={formik.values.direction}
								onChange={formik.handleChange}
							/>
						</RadioGroup>
					</div>
				</div>
			</CardBody>
			<CardFooter>
				<CardFooterChild>
					<Button
						aria-label='Clear'
						color='red'
						variant='link'
						onClick={formik.handleReset}>
						Clear all
					</Button>
				</CardFooterChild>
				<CardFooterChild>
					<Button aria-label='Apply' variant='solid' onClick={formik.submitForm}>
						Apply
					</Button>
				</CardFooterChild>
			</CardFooter>
		</>
	);
};

export default FiltersPaymentsExample;
// @end-snippet:: filtersPaymentsExampleSource
