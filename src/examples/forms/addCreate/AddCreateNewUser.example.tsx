// @start-snippet:: addCreateNewUserExampleSource
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import { useFormik } from 'formik';
import Button from '@/components/ui/Button';
import FileInput from '@/components/form/FileInput';
import Icon from '@/components/icon/Icon';
import { CardBody, CardFooter, CardFooterChild } from '@/components/ui/Card';

const AddCreateNewUserExample = () => {
	const formik = useFormik({
		initialValues: {
			avatar: '',
			name: '',
			email: '',
			phone: [{ telCountryCode: '', telAreaCode: '', telNational: '' }],
			address1: '',
			address2: '',
			district: '',
			city: '',
			country: '',
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});

	return (
		<>
			<CardBody>
				<div className='flex flex-col gap-4'>
					<div className='grid grid-cols-12 gap-x-4'>
						<div className='col-span-12 pt-0 lg:col-span-3 lg:pt-4 xl:col-span-2'>
							<Label htmlFor='avatar'>Avatar</Label>
						</div>
						<div className='col-span-12 flex items-center gap-x-4 lg:col-span-9 xl:col-span-10'>
							<div className='flex size-24 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-500/25'>
								<Icon icon='ImageCrop' size='text-2xl' color='zinc' />
							</div>
							<FileInput
								id='avatar'
								name='avatar'
								value={formik.values.avatar}
								onChange={formik.handleChange}
							/>
						</div>
					</div>

					<div className='grid grid-cols-12 gap-x-4'>
						<div className='col-span-12 pt-0 lg:col-span-3 lg:pt-4 xl:col-span-2'>
							<Label htmlFor='name'>Name</Label>
						</div>
						<div className='col-span-12 lg:col-span-9 xl:col-span-10'>
							<Input
								id='name'
								name='name'
								autoComplete='name'
								placeholder='Name Surname'
								value={formik.values.name}
								onChange={formik.handleChange}
							/>
						</div>
					</div>
					<div className='grid grid-cols-12 gap-x-4'>
						<div className='col-span-12 pt-0 lg:col-span-3 lg:pt-4 xl:col-span-2'>
							<Label htmlFor='email'>Email</Label>
						</div>
						<div className='col-span-12 lg:col-span-9 xl:col-span-10'>
							<Input
								id='email'
								name='email'
								type='email'
								autoComplete='email'
								placeholder='name@site.com'
								value={formik.values.email}
								onChange={formik.handleChange}
							/>
						</div>
					</div>
					<div className='grid grid-cols-12 gap-x-4'>
						<div className='col-span-12 pt-0 lg:col-span-3 lg:pt-4 xl:col-span-2'>
							<Label htmlFor='phone-0'>Phone</Label>
						</div>
						<div className='col-span-12 lg:col-span-9 xl:col-span-10'>
							{formik.values.phone.map((variant, index) => (
								<div className='mb-4 grid grid-cols-12 gap-4' key={index}>
									<div className='col-span-2'>
										<Input
											id={`phone-${index}`}
											name={`phone[${index}].telCountryCode`}
											placeholder='Country code'
											autoComplete='tel-country-code'
											value={variant.telCountryCode}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-3'>
										<Input
											name={`phone[${index}].telAreaCode`}
											placeholder='Area code'
											autoComplete='tel-area-code'
											value={variant.telAreaCode}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-6'>
										<Input
											name={`phone[${index}].telNational`}
											placeholder='National Number'
											autoComplete='tel-national'
											value={variant.telNational}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-1 flex items-center justify-center'>
										<Button
											icon='Delete02'
											color='red'
											variant='soft'
											className='h-full w-full'
											isDisable={formik.values.phone.length === 1}
											onClick={() =>
												formik.setFieldValue(
													'phone',
													formik.values.phone.filter(
														(_, i) => i !== index,
													),
												)
											}
											aria-label='Delete'
										/>
									</div>
								</div>
							))}
							<div className='flex justify-end'>
								<Button
									icon='PlusSignCircle'
									className='border-dashed border-zinc-500'
									rounded='rounded-full'
									dimension='sm'
									color='zinc'
									variant='default'
									onClick={() =>
										formik.setFieldValue('phone', [
											...formik.values.phone,
											{
												telCountryCode: '',
												telAreaCode: '',
												telNational: '',
											},
										])
									}
									aria-label='Add phone'>
									Add phone
								</Button>
							</div>
						</div>
					</div>

					<div className='grid grid-cols-12 gap-x-4'>
						<div className='col-span-12 pt-0 lg:col-span-3 lg:pt-4 xl:col-span-2'>
							<Label htmlFor='address1'>Address</Label>
						</div>
						<div className='col-span-12 lg:col-span-9 xl:col-span-10'>
							<Input
								id='address1'
								name='address1'
								autoComplete='address-line1'
								placeholder='Address'
								value={formik.values.address1}
								onChange={formik.handleChange}
							/>
						</div>
						<div className='col-span-12 mt-4 lg:col-span-9 lg:col-start-4 xl:col-span-10 xl:col-start-3'>
							<Input
								id='address2'
								name='address2'
								autoComplete='address-line2'
								placeholder='Address line 2 (Optional)'
								value={formik.values.address2}
								onChange={formik.handleChange}
							/>
						</div>
						<div className='col-span-12 mt-4 lg:col-span-5 lg:col-start-3'>
							<Input
								id='district'
								name='district'
								autoComplete='district'
								placeholder='District'
								value={formik.values.district}
								onChange={formik.handleChange}
							/>
						</div>
						<div className='col-span-12 mt-4 lg:col-span-5'>
							<Input
								id='city'
								name='city'
								autoComplete='city'
								placeholder='City'
								value={formik.values.city}
								onChange={formik.handleChange}
							/>
						</div>
						<div className='col-span-12 mt-4 lg:col-span-9 lg:col-start-4 xl:col-span-10 xl:col-start-3'>
							<Input
								id='country'
								name='country'
								autoComplete='country'
								placeholder='Country'
								value={formik.values.country}
								onChange={formik.handleChange}
							/>
						</div>
					</div>
				</div>
			</CardBody>
			<CardFooter>
				<CardFooterChild />
				<CardFooterChild>
					<Button
						color='red'
						variant='link'
						onClick={formik.handleReset}
						aria-label='Clear all'>
						Clear all
					</Button>
					<Button variant='solid' onClick={formik.submitForm} aria-label='Add User'>
						Add User
					</Button>
				</CardFooterChild>
			</CardFooter>
		</>
	);
};

export default AddCreateNewUserExample;
// @end-snippet:: addCreateNewUserExampleSource
