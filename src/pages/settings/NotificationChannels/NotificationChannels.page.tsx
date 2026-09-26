import { useState } from 'react';
import type { ComponentType, FormEvent } from 'react';
import { MessageSquare, PlayCircle, Plus, Send, Trash2, Webhook } from 'lucide-react';
import {
	useNotificationChannels,
	useCreateNotificationChannel,
	useDeleteNotificationChannel,
	useTestNotificationChannel,
} from '@/api/modules/notification-channels';
import { useWorkspaceContext } from '@/context/workspace';
import { notify } from '@/api/core';
import formatDate from '@/utils/formatDate.util';
import type { TNotificationChannel, TNotificationChannelType } from '@/types/notification.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Spinner from '@/components/ui/Spinner';

const typeOptions: {
	value: TNotificationChannelType;
	label: string;
	icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
	{ value: 'webhook', label: 'Webhook', icon: Webhook },
	{ value: 'slack', label: 'Slack', icon: Send },
	{ value: 'discord', label: 'Discord', icon: MessageSquare },
];

const typeConfig = Object.fromEntries(typeOptions.map((o) => [o.value, o])) as Record<
	TNotificationChannelType,
	(typeof typeOptions)[number]
>;

const NotificationChannelsPage = () => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const { data: channels = [], isLoading, error } = useNotificationChannels(activeWorkspaceId);
	const createChannel = useCreateNotificationChannel(activeWorkspaceId);
	const deleteChannel = useDeleteNotificationChannel(activeWorkspaceId);
	const testChannel = useTestNotificationChannel(activeWorkspaceId);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [channelToDelete, setChannelToDelete] = useState<TNotificationChannel | null>(null);
	const [testingId, setTestingId] = useState<string | null>(null);

	const [type, setType] = useState<TNotificationChannelType>('webhook');
	const [name, setName] = useState('');
	const [url, setUrl] = useState('');

	const resetForm = () => {
		setType('webhook');
		setName('');
		setUrl('');
	};

	const handleCreate = async (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			notify.error('Please enter a name for the channel');
			return;
		}
		if (!url.trim()) {
			notify.error('Please enter a webhook URL');
			return;
		}

		try {
			await createChannel.mutateAsync({
				type,
				name: name.trim(),
				config: { url: url.trim() },
			});
			setIsCreateModalOpen(false);
			resetForm();
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleDelete = async () => {
		if (!channelToDelete) return;
		try {
			await deleteChannel.mutateAsync(channelToDelete.id);
			setChannelToDelete(null);
		} catch {
			// Toast is handled by the API hook.
		}
	};

	const handleTest = async (channel: TNotificationChannel) => {
		setTestingId(channel.id);
		try {
			const result = await testChannel.mutateAsync(channel.id);
			notify.success(result.message);
		} catch {
			// Toast is handled by the API hook.
		} finally {
			setTestingId(null);
		}
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Notification Channels
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Deliver workspace notifications to Slack, Discord, or any webhook.
					</p>
				</div>
				<Button
					variant='solid'
					color='primary'
					icon='Add01'
					onClick={() => setIsCreateModalOpen(true)}
					className='shadow-primary-500/10 h-12 font-bold text-zinc-950 shadow-md'>
					Add channel
				</Button>
			</div>

			{isLoading ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900'>
					<Spinner color='primary' className='size-8' />
					<p className='mt-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Loading notification channels...
					</p>
				</div>
			) : error ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-700 dark:bg-zinc-900'>
					<div className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10'>
						<Webhook size={24} />
					</div>
					<h3 className='mt-4 text-lg font-bold text-zinc-900 dark:text-white'>
						Could not load notification channels
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Please try again after refreshing.
					</p>
				</div>
			) : channels.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/35 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs'>
						<Webhook size={22} />
					</div>
					<h3 className='text-lg font-bold text-zinc-900 dark:text-white'>
						No channels yet
					</h3>
					<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
						Add a Slack, Discord, or webhook channel to route notifications to.
					</p>
					<button
						type='button'
						onClick={() => setIsCreateModalOpen(true)}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold shadow-md transition active:scale-95'>
						<Plus size={14} />
						<span>Add your first channel</span>
					</button>
				</div>
			) : (
				<div className='space-y-3'>
					{channels.map((channel) => {
						const cfg = typeConfig[channel.type];
						return (
							<div
								key={channel.id}
								className='flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs transition hover:border-zinc-200 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'>
								<div className='flex items-center gap-4'>
									<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'>
										<cfg.icon size={18} />
									</div>
									<div>
										<div className='flex items-center gap-2'>
											<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
												{channel.name}
											</p>
											{!channel.is_active && (
												<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
													Inactive
												</span>
											)}
										</div>
										<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
											{cfg.label} · Added {formatDate(channel.created_at)}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-2 pl-15 sm:pl-0'>
									<button
										type='button'
										onClick={() => handleTest(channel)}
										disabled={testingId === channel.id}
										className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
										<PlayCircle size={14} />
										{testingId === channel.id ? 'Sending…' : 'Send test'}
									</button>
									<button
										type='button'
										aria-label={`Delete ${channel.name}`}
										onClick={() => setChannelToDelete(channel)}
										className='rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Create channel modal */}
			<Modal isOpen={isCreateModalOpen} setIsOpen={setIsCreateModalOpen} size='sm'>
				<ModalHeader setIsOpen={setIsCreateModalOpen}>
					<div className='flex items-center gap-3'>
						<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
							<Plus size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Add notification channel
						</span>
					</div>
				</ModalHeader>
				<form onSubmit={handleCreate}>
					<ModalBody>
						<div className='space-y-4 pt-2'>
							<div>
								<div className='mb-2 block text-sm font-bold text-zinc-700 dark:text-zinc-300'>
									Type
								</div>
								<Select
									name='type'
									aria-label='Channel type'
									value={type}
									onChange={(e) =>
										setType(e.target.value as TNotificationChannelType)
									}
									variant='default'
									dimension='default'>
									{typeOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							</div>
							<Input
								label='Name'
								name='name'
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='e.g. #alerts'
								variant='default'
								dimension='default'
							/>
							<Input
								label={
									type === 'webhook'
										? 'Webhook URL'
										: `${typeConfig[type].label} webhook URL`
								}
								name='url'
								type='url'
								required
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder='https://...'
								variant='default'
								dimension='default'
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild className='flex w-full justify-end gap-3'>
							<Button
								variant='outline'
								color='zinc'
								onClick={() => setIsCreateModalOpen(false)}
								className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
								Cancel
							</Button>
							<Button
								type='submit'
								variant='solid'
								color='primary'
								isLoading={createChannel.isPending}
								className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
								Add channel
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</form>
			</Modal>

			{/* Delete confirmation */}
			<Modal
				isOpen={!!channelToDelete}
				setIsOpen={(open) => !open && setChannelToDelete(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setChannelToDelete(null)}>
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'>
							<Trash2 size={18} />
						</div>
						<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Remove channel
						</span>
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-base leading-relaxed font-semibold text-zinc-500 dark:text-zinc-400'>
						Are you sure you want to remove{' '}
						<span className='font-bold text-zinc-800 dark:text-zinc-100'>
							{channelToDelete?.name}
						</span>
						? Notifications routed here will stop being delivered.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full justify-end gap-3'>
						<Button
							variant='outline'
							color='zinc'
							onClick={() => setChannelToDelete(null)}
							className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
							Cancel
						</Button>
						<Button
							variant='solid'
							color='red'
							onClick={handleDelete}
							isLoading={deleteChannel.isPending}
							className='h-11 font-bold text-white shadow-md shadow-red-500/15'>
							Remove
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</div>
	);
};

export default NotificationChannelsPage;
