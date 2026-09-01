import Container from '@/components/layout/Container';
import { useOutletContext, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from '@/pages/apps/products/_layouts/Products.layout';
import PRODUCTS, { IProduct } from '@/mocks/products.mock';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Label from '@/components/form/Label';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Description from '@/components/form/Description';
import Button from '@/components/ui/Button';
import classNames from 'classnames';
import FieldWrap from '@/components/form/FieldWrap';
import Select from '@/components/form/Select';
import Tooltip from '@/components/ui/Tooltip';
import Textarea from '@/components/form/Textarea';
import { Airpods1, Airpods2, Airpods3, Airpods4, Airpods5 } from '@/assets/images';
import Checkbox from '@/components/form/Checkbox';
import EXAMPLE from '@/examples/_index';

const currentProduct = (id: number): IProduct | undefined => {
	return PRODUCTS.find((product) => product.id === id);
};

const ProductsEditPage = () => {
	const [searchParams] = useSearchParams();
	const productIdFromUrl = searchParams.get('productId');

	const [data] = useState<IProduct | undefined>(currentProduct(Number(productIdFromUrl)));

	const formik = useFormik({
		initialValues: {
			avatar: '',
			name: '',
			sku: '',
			weight: '',
			unit: 'kg',
			description: '',
			variants: [{ attribute: '', value: '', price: '', quantity: '' }],
			price: '',
			currency: 'USD',
			publish: true,
			vendor: '',
			categories: [''],
			tags: [''],
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});

	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[
					{ ...pages.apps.products },
					{ ...pages.apps.products.subPages.edit },
					...(productIdFromUrl
						? [
								{
									...pages.apps.products.subPages.edit,
									to: undefined,
									text: data ? `${data?.name}` : 'New',
								},
							]
						: []),
				]}
			/>,
		);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productIdFromUrl]);

	const [quickActions, setQuickActions] = useState<boolean>(true);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					Product
					<Button
						aria-label='Prev'
						className='p-0! font-bold'
						icon='ArrowLeft01'
						color='zinc'>
						Prev
					</Button>
					<Button
						aria-label='Next'
						className='p-0! font-bold'
						rightIcon='ArrowRight01'
						color='zinc'>
						Next
					</Button>
				</SubheaderLeft>
				<SubheaderRight>
					<Button aria-label='Save' className='p-0! font-bold'>
						Save
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container className='relative'>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12 flex flex-col gap-4 lg:col-span-8'>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle
										iconProps={{
											icon: 'FileView',
											color: 'blue',
											size: 'text-3xl',
										}}>
										Product Info
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-12 gap-4'>
									<div className='col-span-12'>
										<Label htmlFor='avatar'>Avatar</Label>
										<div className='flex items-center gap-4'>
											<div className='flex size-24 items-center justify-center rounded-full border border-dashed border-zinc-500/50'>
												<Icon icon='Image01' size='text-2xl' color='zinc' />
											</div>
											<div>
												<Input
													name='avatar'
													type='file'
													onChange={formik.handleChange}
												/>
												<Description
													id='input-helper-text'
													className='mt-2'>
													Pick a photo up to 1MB.
												</Description>
											</div>
										</div>
									</div>
									<div className='col-span-12'>
										<div className='mb-2 flex items-center justify-between [&>*]:mb-0'>
											<Label htmlFor='name'>Name</Label>
											<Description id='name'>
												<Tooltip text='Give your product a short and clear' />
											</Description>
										</div>
										<Input
											name='name'
											id='name'
											aria-describedby='name'
											placeholder='Name'
											value={formik.values.name}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-12 md:col-span-6'>
										<Label htmlFor='sku'>SKU</Label>
										<Input
											name='sku'
											id='sku'
											value={formik.values.sku}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-12 md:col-span-6'>
										<Label htmlFor='Weight'>Weight</Label>
										<FieldWrap
											lastSuffix={
												<Select
													id='unit'
													name='unit'
													variant='underline'
													className='relative -end-3 w-full border-none pe-8'
													value={formik.values.unit}
													onChange={formik.handleChange}>
													<option value='lb'>lb</option>
													<option value='oz'>oz</option>
													<option value='kg'>kg</option>
													<option value='g'>g</option>
												</Select>
											}>
											<Input
												name='weight'
												id='weight'
												step='0.01'
												type='number'
												placeholder='0.00'
												aria-describedby='weight-desc'
												value={formik.values.weight}
												onChange={formik.handleChange}
											/>
										</FieldWrap>
										<Description id='weight-desc' className='mt-2'>
											Used to calculate shipping rates at checkout and label
											prices during fulfillment.
										</Description>
									</div>
									<div className='col-span-12'>
										<Label htmlFor='description'>Description</Label>
										<Textarea
											name='description'
											id='description'
											placeholder='Product description'
											value={formik.values.description}
											onChange={formik.handleChange}
										/>
									</div>
								</div>
							</CardBody>
						</Card>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle
										iconProps={{
											icon: 'ImageAdd02',
											color: 'amber',
											size: 'text-3xl',
										}}>
										Media
									</CardTitle>
								</CardHeaderChild>
								<CardHeaderChild>
									<Button
										aria-label='Upload from URL'
										icon='CloudServer'
										variant='outline'
										color='zinc'>
										Upload from URL
									</Button>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='mb-4 flex gap-4 overflow-x-auto whitespace-nowrap'>
									<div className='relative w-48 shrink-0'>
										<img
											src={Airpods1}
											alt=''
											className='aspect-square w-full rounded-xl object-cover'
										/>
										<Button
											aria-label='Cancel'
											icon='Cancel01'
											variant='soft'
											color='zinc'
											rounded='rounded-full'
											className='absolute end-4 top-4 z-10'
										/>
									</div>
									<div className='relative w-48 shrink-0'>
										<img
											src={Airpods2}
											alt=''
											className='aspect-square w-full rounded-xl object-cover'
										/>
										<Button
											aria-label='Cancel'
											icon='Cancel01'
											variant='soft'
											color='zinc'
											rounded='rounded-full'
											className='absolute end-4 top-4 z-10'
										/>
									</div>
									<div className='relative w-48 shrink-0'>
										<img
											src={Airpods3}
											alt=''
											className='aspect-square w-full rounded-xl object-cover'
										/>
										<Button
											aria-label='Cancel'
											icon='Cancel01'
											variant='soft'
											color='zinc'
											rounded='rounded-full'
											className='absolute end-4 top-4 z-10'
										/>
									</div>
									<div className='relative w-48 shrink-0'>
										<img
											src={Airpods4}
											alt=''
											className='aspect-square w-full rounded-xl object-cover'
										/>
										<Button
											aria-label='Cancel'
											icon='Cancel01'
											variant='soft'
											color='zinc'
											rounded='rounded-full'
											className='absolute end-4 top-4 z-10'
										/>
									</div>
									<div className='relative w-48 shrink-0'>
										<img
											src={Airpods5}
											alt=''
											className='aspect-square w-full rounded-xl object-cover'
										/>
										<Button
											aria-label='Cancel'
											icon='Cancel01'
											variant='soft'
											color='zinc'
											rounded='rounded-full'
											className='absolute end-4 top-4 z-10'
										/>
									</div>
								</div>
								<div
									className={classNames(
										'flex justify-center',
										'rounded-lg',
										'border-2 border-dashed border-zinc-500/25',
										'px-6 py-10',
										'dark:border-zinc-500/50',
									)}>
									<div className='text-center'>
										<Icon
											icon='Album02'
											color='zinc'
											className='mx-auto h-12 w-12'
										/>
										<div className='mt-4 flex text-sm leading-6 text-zinc-500'>
											<label
												htmlFor='file-upload'
												className={classNames(
													'relative',
													'cursor-pointer',
													'rounded-md',
													'font-semibold',
													'text-blue-500',
													'focus-within:outline-hidden',
													'focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 focus-within:ring-offset-transparent',
													'hover:text-blue-600',
												)}>
												<span>Upload a file</span>
												<input
													aria-label='File upload'
													id='file-upload'
													name='file-upload'
													type='file'
													className='sr-only'
												/>
											</label>
											<span className='pl-1'>or drag and drop</span>
										</div>
										<p className='text-xs leading-5 text-zinc-500'>
											PNG, JPG, GIF up to 10MB
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle
										iconProps={{
											icon: 'Blend',
											color: 'emerald',
											size: 'text-3xl',
										}}>
										Variants
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<EXAMPLE.Forms.General.InlineRemovableInputs />
							</CardBody>
						</Card>
					</div>
					<div className='col-span-12 flex flex-col gap-4 lg:col-span-4'>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle
										iconProps={{
											icon: 'Money04',
											color: 'emerald',
											size: 'text-3xl',
										}}>
										Price
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4'>
									<div className='col-span-1'>
										<Label htmlFor='price'>Price</Label>
										<FieldWrap
											lastSuffix={
												<Select
													id='currency'
													name='currency'
													variant='underline'
													className='relative -end-3 w-full border-none pe-8'
													value={formik.values.currency}
													onChange={formik.handleChange}>
													<option value='USD'>USD</option>
													<option value='EUR'>EUR</option>
												</Select>
											}>
											<Input
												name='price'
												id='price'
												step='0.01'
												type='number'
												placeholder='0.00'
												value={formik.values.price}
												onChange={formik.handleChange}
											/>
										</FieldWrap>
									</div>
									<div className='col-span-1'>
										<Label htmlFor='publish'>Publish</Label>
										<Checkbox
											name='publish'
											id='publish'
											variant='switch'
											onChange={formik.handleChange}
											checked={formik.values.publish}
										/>
									</div>
								</div>
							</CardBody>
						</Card>
						<Card>
							<CardHeader>
								<CardHeaderChild>
									<CardTitle
										iconProps={{
											icon: 'Database',
											color: 'red',
											size: 'text-3xl',
										}}>
										Meta
									</CardTitle>
								</CardHeaderChild>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4'>
									<div className='col-span-1'>
										<Label htmlFor='vendor'>Vendor</Label>
										<Input
											name='vendor'
											id='vendor'
											value={formik.values.vendor}
											onChange={formik.handleChange}
										/>
									</div>
									<div className='col-span-1'>
										<Label htmlFor='categories'>Categories</Label>
										<Select
											multiple
											name='categories'
											id='categories'
											value={formik.values.categories}
											onChange={formik.handleChange}>
											<option value='Category1'>Category 1</option>
											<option value='Category2'>Category 2</option>
											<option value='Category3'>Category 3</option>
										</Select>
									</div>
									<div className='col-span-1'>
										<Label htmlFor='categories'>Tags</Label>
										<Select
											multiple
											name='tags'
											id='tags'
											value={formik.values.tags}
											onChange={formik.handleChange}>
											<option value='Tag1'>Tag 1</option>
											<option value='Tag2'>Tag 2</option>
											<option value='Tag3'>Tag 3</option>
										</Select>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
				</div>
				<div
					className={classNames(
						'sticky start-0 end-0 bottom-4 z-[999] mx-auto mt-4 flex min-h-12 items-center justify-between overflow-hidden rounded-full border border-zinc-500/25 bg-white p-2 font-bold shadow dark:bg-zinc-950',
						'transition-all duration-300 ease-in-out',
						{ 'max-w-96': quickActions, 'max-w-14': !quickActions },
					)}>
					{!quickActions && (
						<Button
							aria-label='Quick Actions'
							icon='Zap'
							variant='soft'
							color='emerald'
							rounded='rounded-full'
							onClick={() => setQuickActions(true)}
						/>
					)}
					{quickActions && (
						<>
							<div className='flex items-center ps-2'>
								<Button aria-label='Delete' color='red' className='p-0!'>
									Delete
								</Button>
							</div>
							<div className='flex items-center gap-2'>
								<Button aria-label='Cancel' color='zinc' className='p-0!'>
									Cancel
								</Button>
								<div className='h-8 rounded-full border-s border-zinc-500/25'></div>
								<Button aria-label='Save' className='p-0!'>
									Save
								</Button>
								<Button
									aria-label='Cancel'
									icon='Cancel01'
									variant='soft'
									color='zinc'
									rounded='rounded-full'
									onClick={() => setQuickActions(false)}
								/>
							</div>
						</>
					)}
				</div>
			</Container>
		</>
	);
};

export default ProductsEditPage;
