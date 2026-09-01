// @start-snippet:: notificationSystemsTableFormatListOfCheckboxExampleSource
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import { useFormik } from 'formik';

const NotificationSystemsTableFormatListOfCheckboxExample = () => {
	const notificationsFormik = useFormik({
		initialValues: {
			notifications: {
				mentions: {
					mail: true,
					desktop: true,
					mobile: true,
				},
				serviceUpdates: {
					mail: true,
					desktop: false,
					mobile: true,
				},
				webhooks: {
					mail: true,
					desktop: true,
					mobile: false,
				},
			},
		},
		onSubmit: (values) => console.log('Notifications form submitted:', values),
	});

	return (
		<>
			<div className='grid grid-cols-12 gap-4 p-4'>
				<div className='col-span-6'>Notify me about</div>
				<div className='col-span-2 flex items-center justify-center'>Mail</div>
				<div className='col-span-2 flex items-center justify-center'>Desktop</div>
				<div className='col-span-2 flex items-center justify-center'>Mobile</div>
			</div>
			<div className='grid grid-cols-12 gap-4 rounded-xl bg-zinc-500/25 p-4'>
				<div className='col-span-6'>General</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.mentions', {
								...notificationsFormik.values.notifications.mentions,
								mail: true,
							});
							notificationsFormik.setFieldValue('notifications.serviceUpdates', {
								...notificationsFormik.values.notifications.serviceUpdates,
								mail: true,
							});
						}}>
						Select All
					</Button>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.mentions', {
								...notificationsFormik.values.notifications.mentions,
								desktop: true,
							});
							notificationsFormik.setFieldValue('notifications.serviceUpdates', {
								...notificationsFormik.values.notifications.serviceUpdates,
								desktop: true,
							});
						}}>
						Select All
					</Button>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.mentions', {
								...notificationsFormik.values.notifications.mentions,
								mobile: true,
							});
							notificationsFormik.setFieldValue('notifications.serviceUpdates', {
								...notificationsFormik.values.notifications.serviceUpdates,
								mobile: true,
							});
						}}>
						Select All
					</Button>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4 p-4'>
				<div className='col-span-6'>
					<div>Mentions</div>
					<div className='text-sm text-zinc-500'>
						Receive a notification if a teammate mentions you in a note.
					</div>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.mentions.mail}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.mentions.mail',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.mentions.desktop}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.mentions.desktop',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.mentions.mobile}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.mentions.mobile',
								e.target.checked,
							)
						}
					/>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4 p-4'>
				<div className='col-span-6'>
					<div>Service provider updates</div>
					<div className='text-sm text-zinc-500'>
						Receive a notification when there are changes to the list of Boltify service
						providers
					</div>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.serviceUpdates.mail}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.serviceUpdates.mail',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.serviceUpdates.desktop}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.serviceUpdates.desktop',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.serviceUpdates.mobile}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.serviceUpdates.mobile',
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className='grid grid-cols-12 gap-4 rounded-xl bg-zinc-500/25 p-4'>
				<div className='col-span-6'>API</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.webhooks', {
								...notificationsFormik.values.notifications.webhooks,
								mail: true,
							});
						}}>
						Select All
					</Button>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.webhooks', {
								...notificationsFormik.values.notifications.webhooks,
								desktop: true,
							});
						}}>
						Select All
					</Button>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Button
						aria-label='Select All'
						className='p-0!'
						onClick={() => {
							notificationsFormik.setFieldValue('notifications.webhooks', {
								...notificationsFormik.values.notifications.webhooks,
								mobile: true,
							});
						}}>
						Select All
					</Button>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4 p-4'>
				<div className='col-span-6'>
					<div>Webhooks</div>
					<div className='text-sm text-zinc-500'>
						Receive a notification when webhooks are consistently failing.
					</div>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.webhooks.mail}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.webhooks.mail',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.webhooks.desktop}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.webhooks.desktop',
								e.target.checked,
							)
						}
					/>
				</div>
				<div className='col-span-2 flex items-center justify-center'>
					<Checkbox
						variant='switch'
						checked={notificationsFormik.values.notifications.webhooks.mobile}
						onChange={(e) =>
							notificationsFormik.setFieldValue(
								'notifications.webhooks.mobile',
								e.target.checked,
							)
						}
					/>
				</div>
			</div>
		</>
	);
};

export default NotificationSystemsTableFormatListOfCheckboxExample;
// @end-snippet:: notificationSystemsTableFormatListOfCheckboxExampleSource
