// @start-snippet:: generalInlineRemovableInputsExampleSource
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import { useFormik } from 'formik';

const GeneralInlineRemovableInputsExample = () => {
	const formik = useFormik({
		initialValues: {
			variants: [
				{ attribute: '', value: '', price: '', quantity: '' },
				{ attribute: '', value: '', price: '', quantity: '' },
				{ attribute: '', value: '', price: '', quantity: '' },
			],
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});
	return (
		<>
			{formik.values.variants.map((variant, index) => (
				<div className='mb-4 grid grid-cols-12 gap-4' key={index}>
					<div className='col-span-3'>
						<Input
							name={`variants[${index}].attribute`}
							placeholder='Attribute'
							value={variant.attribute}
							onChange={formik.handleChange}
						/>
					</div>
					<div className='col-span-3'>
						<Input
							name={`variants[${index}].value`}
							placeholder='Value'
							value={variant.value}
							onChange={formik.handleChange}
						/>
					</div>
					<div className='col-span-3'>
						<Input
							name={`variants[${index}].price`}
							placeholder='Price'
							value={variant.price}
							onChange={formik.handleChange}
						/>
					</div>
					<div className='col-span-2'>
						<Input
							name={`variants[${index}].quantity`}
							placeholder='Quantity'
							value={variant.quantity}
							onChange={formik.handleChange}
						/>
					</div>
					<div className='col-span-1 flex items-center justify-center'>
						<Button
							aria-label='Delete variant'
							icon='Delete02'
							color='red'
							variant='soft'
							className='h-full w-full'
							isDisable={formik.values.variants.length === 1}
							onClick={() =>
								formik.setFieldValue(
									'variants',
									formik.values.variants.filter((_, i) => i !== index),
								)
							}
						/>
					</div>
				</div>
			))}
			<div className='flex'>
				<Button
					aria-label='Add variant'
					icon='PlusSignCircle'
					className='border-dashed border-zinc-500'
					rounded='rounded-full'
					dimension='sm'
					color='zinc'
					variant='default'
					onClick={() =>
						formik.setFieldValue('variants', [
							...formik.values.variants,
							{
								attribute: '',
								value: '',
								price: '',
								quantity: '',
							},
						])
					}>
					Add variant
				</Button>
			</div>
		</>
	);
};

export default GeneralInlineRemovableInputsExample;
// @end-snippet:: generalInlineRemovableInputsExampleSource
