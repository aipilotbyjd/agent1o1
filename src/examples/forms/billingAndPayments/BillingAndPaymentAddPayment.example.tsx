import { useFormik } from 'formik';
import { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Label from '@/components/form/Label';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Icon from '@/components/icon/Icon';
import FieldWrap from '@/components/form/FieldWrap';
import Input from '@/components/form/Input';
import { ChangeEvent } from 'react';
import Checkbox from '@/components/form/Checkbox';
import Button from '@/components/ui/Button';

const BillingAndPaymentAddPaymentExample = () => {
	const formik = useFormik({
		initialValues: {
			paymentMethod: 'card',
			cardNumber: '',
			exp: '',
			cvc: '',
			name: '',
			default: false,
			paypal: '',
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});

	const formatExpiry = (value: string) => {
		const cleaned = value.replace(/\D/g, '').slice(0, 4);
		if (cleaned.length >= 3) {
			return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
		}
		return cleaned;
	};
	return (
		<>
			<ModalHeader>Add a payment method</ModalHeader>
			<ModalBody>
				<div className='grid grid-cols-2 gap-4'>
					<div className='col-span-2'>
						<Label htmlFor='paymentMethod' className='sr-only'>
							What would you like to tell us about?
						</Label>
						<RadioGroup isInline className='grid grid-cols-3'>
							<Radio
								labelClassName='p-4'
								name='paymentMethod'
								selectedValue={formik.values.paymentMethod}
								onChange={formik.handleChange}
								value='card'>
								<div className='flex items-center justify-center gap-2'>
									<Icon icon='CreditCard' size='text-3xl' />
									<div>Credit Card</div>
								</div>
							</Radio>
							<Radio
								labelClassName='p-4'
								name='paymentMethod'
								selectedValue={formik.values.paymentMethod}
								onChange={formik.handleChange}
								value='paypal'>
								<div className='flex items-center justify-center gap-2'>
									<Icon icon='Paypal' size='text-3xl' />
									<div>PayPal</div>
								</div>
							</Radio>
							<Radio
								labelClassName='p-4'
								name='paymentMethod'
								selectedValue={formik.values.paymentMethod}
								onChange={formik.handleChange}
								value='applePay'
								disabled>
								<div className='flex items-center justify-center gap-2'>
									<Icon icon='Apple' size='text-3xl' />
									<div>Apple Pay</div>
								</div>
							</Radio>
						</RadioGroup>
					</div>
					{formik.values.paymentMethod === 'card' && (
						<>
							<div className='col-span-2'>
								<Label htmlFor='cardNumber' className='sr-only'>
									Card Number
								</Label>
								<FieldWrap
									lastSuffix={
										<div className='inline-flex gap-1'>
											<Icon icon='CustomVisa' size='text-3xl' />
											<Icon icon='CustomMastercard' size='text-3xl' />
											<Icon icon='CustomDiscovery' size='text-3xl' />
										</div>
									}>
									<Input
										id='cardNumber'
										name='cardNumber'
										maxLength={19}
										placeholder='Card Number'
										autoComplete='cc-number'
										value={formik.values.cardNumber}
										onChange={formik.handleChange}
									/>
								</FieldWrap>
							</div>
							<div className='col-span-1'>
								<Label htmlFor='exp' className='sr-only'>
									Expiration Date
								</Label>
								<Input
									id='exp'
									name='exp'
									placeholder='MM/YY'
									autoComplete='cc-exp'
									value={formik.values.exp}
									onChange={(e: ChangeEvent<HTMLInputElement>) => {
										const formatted = formatExpiry(e.target.value);
										formik.setFieldValue('exp', formatted);
									}}
								/>
							</div>
							<div className='col-span-1'>
								<Label htmlFor='cvc' className='sr-only'>
									CVC
								</Label>
								<FieldWrap lastSuffix={<Icon icon='CreditCard' size='text-3xl' />}>
									<Input
										id='cvc'
										name='cvc'
										placeholder='CVC'
										autoComplete='cc-csc'
										value={formik.values.cvc}
										onChange={formik.handleChange}
									/>
								</FieldWrap>
							</div>
							<div className='col-span-2'>
								<Label htmlFor='name' className='sr-only'>
									Name
								</Label>
								<Input
									id='name'
									name='name'
									placeholder='Name'
									autoComplete='cc-name'
									value={formik.values.name}
									onChange={formik.handleChange}
								/>
							</div>
							<div className='col-span-2'>
								<Label htmlFor='name' className='sr-only'>
									Name
								</Label>
								<Checkbox
									id='default'
									name='default'
									placeholder='Name'
									checked={formik.values.default}
									onChange={formik.handleChange}
									label='Set as default payment method'
									dimension='sm'
									variant='switch'
								/>
							</div>
						</>
					)}
					<div className='col-span-2'>
						<Label htmlFor='paypal' className='sr-only'>
							Name
						</Label>
						<Input
							id='paypal'
							name='paypal'
							type='email'
							placeholder='PayPal Email Address'
							value={formik.values.paypal}
							onChange={formik.handleChange}
						/>
					</div>
				</div>
			</ModalBody>
			<ModalFooter className='gap-4'>
				<ModalFooterChild className='w-full'>
					<Button className='w-full' variant='outline' color='zinc' dimension='lg'>
						Cancel
					</Button>
				</ModalFooterChild>
				<ModalFooterChild className='w-full'>
					<Button className='w-full' variant='solid' dimension='lg'>
						Add Card
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</>
	);
};

export default BillingAndPaymentAddPaymentExample;
