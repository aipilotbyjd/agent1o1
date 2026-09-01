// @start-snippet:: descriptionListSimpleWithIconExampleSource
import Icon from '@/components/icon/Icon';

const DescriptionListSimpleWithIconExample = () => {
	return (
		<div className='flex flex-col gap-2'>
			<div className='flex gap-2'>
				<Icon icon='Office' size='text-2xl' color='zinc' />
				<span>Omtanke Studio</span>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Location05' size='text-2xl' color='zinc' />
				<span>United States</span>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Clock01' size='text-2xl' color='zinc' />
				<span>Europe/Berlin (GMT)</span>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Mail01' size='text-2xl' color='zinc' />
				<span>namesurname@mail.com</span>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Globe02' size='text-2xl' color='zinc' />
				<a href='/'>https://example.com/</a>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Globe02' size='text-2xl' color='zinc' />
				<a href='/'>https://example.com/username</a>
			</div>
			<div className='flex gap-2'>
				<Icon icon='Globe02' size='text-2xl' color='zinc' />
				<a href='/'>https://example.com/nickname</a>
			</div>
		</div>
	);
};

export default DescriptionListSimpleWithIconExample;
// @end-snippet:: descriptionListSimpleWithIconExampleSource
