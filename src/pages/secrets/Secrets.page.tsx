import { useState } from 'react';
import {
	useSecrets,
	useCreateSecret,
	useUpdateSecret,
	useDeleteSecret,
} from '@/api/modules/secrets';
import { notify } from '@/api/core';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import Textarea from '@/components/form/Textarea';
import DataTable, { TColumn } from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatRelative } from '@/utils/format.util';
import type { TSecret } from '@/types/secret.type';

// ============================================================
// Secrets
// ------------------------------------------------------------
// Workspace secrets and plain variables — one resource, split by
// `is_secret`.
//
// A secret's `value` never comes back from the API, so editing one
// is deliberately a *replace*: the field starts empty and an empty
// field means "leave it alone". Pre-filling it with dots would be
// a lie about what the client knows, and pre-filling it with the
// real value is impossible.
//
// `reference` is the `{{ secrets.KEY }}` string a node config
// actually uses, which is the thing people come to this screen to
// copy — so it gets its own column and a copy button rather than
// being something you reconstruct from the key by hand.
// ============================================================

const SecretsPage = () => {
	useDocumentTitle({ name: 'Secrets' });

	const ws = useWorkspaceId();
	const { data: secrets, isLoading } = useSecrets(ws);
	const createSecret = useCreateSecret(ws);
	const updateSecret = useUpdateSecret(ws);
	const deleteSecret = useDeleteSecret(ws);

	const [editing, setEditing] = useState<TSecret | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<TSecret | null>(null);

	const [key, setKey] = useState('');
	const [value, setValue] = useState('');
	const [description, setDescription] = useState('');
	const [isSecret, setIsSecret] = useState(true);

	const openCreate = () => {
		setEditing(null);
		setKey('');
		setValue('');
		setDescription('');
		setIsSecret(true);
		setIsFormOpen(true);
	};

	const openEdit = (secret: TSecret) => {
		setEditing(secret);
		setKey(secret.key);
		// Secrets come back without a value; variables come back with one.
		setValue(secret.is_secret ? '' : (secret.value ?? ''));
		setDescription(secret.description ?? '');
		setIsSecret(secret.is_secret);
		setIsFormOpen(true);
	};

	const isPending = createSecret.isPending || updateSecret.isPending;
	const canSubmit = !!key.trim() && (!!editing || !!value);

	const onSubmit = async () => {
		if (!canSubmit) return;

		if (editing) {
			await updateSecret.mutateAsync({
				id: editing.id,
				body: {
					key: key.trim(),
					description: description.trim() || null,
					is_secret: isSecret,
					// Omitted rather than sent empty — an empty string would
					// overwrite a working secret with nothing.
					...(value ? { value } : {}),
				},
			});
		} else {
			await createSecret.mutateAsync({
				key: key.trim(),
				value,
				description: description.trim() || null,
				is_secret: isSecret,
			});
		}
		setIsFormOpen(false);
	};

	const onCopyReference = (secret: TSecret) => {
		void navigator.clipboard.writeText(secret.reference).then(() => {
			notify.success('Reference copied.');
		});
	};

	const columns: TColumn<TSecret>[] = [
		{
			key: 'key',
			header: 'Key',
			cell: (secret) => (
				<div className='flex items-center gap-2'>
					<span className='font-mono font-medium'>{secret.key}</span>
					<Badge
						color={secret.is_secret ? 'amber' : 'zinc'}
						variant='soft'
						rounded='rounded-full'>
						{secret.is_secret ? 'Secret' : 'Variable'}
					</Badge>
				</div>
			),
		},
		{
			key: 'value',
			header: 'Value',
			className: 'font-mono text-zinc-500',
			cell: (secret) => (secret.is_secret ? '••••••••' : (secret.value ?? '—')),
		},
		{
			key: 'description',
			header: 'Description',
			className: 'text-zinc-500',
			cell: (secret) => secret.description ?? '—',
		},
		{
			key: 'last_used',
			header: 'Last used',
			className: 'text-zinc-500',
			cell: (secret) => formatRelative(secret.last_used_at),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			cell: (secret) => (
				<div className='flex justify-end gap-2'>
					<Button
						variant='outline'
						color='zinc'
						dimension='sm'
						icon='Copy01'
						aria-label={`Copy reference for ${secret.key}`}
						onClick={() => onCopyReference(secret)}>
						Reference
					</Button>
					<Button
						variant='outline'
						color='zinc'
						dimension='sm'
						icon='PencilEdit02'
						aria-label={`Edit ${secret.key}`}
						onClick={() => openEdit(secret)}
					/>
					<Button
						variant='outline'
						color='red'
						dimension='sm'
						icon='Delete02'
						aria-label={`Delete ${secret.key}`}
						onClick={() => setPendingDelete(secret)}
					/>
				</div>
			),
		},
	];

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-lg font-semibold'>Secrets</span>
					<span className='text-zinc-500'>{secrets?.length ?? 0}</span>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='solid' icon='PlusSignCircle' onClick={openCreate}>
						New secret
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card>
					<CardBody>
						<DataTable
							columns={columns}
							rows={secrets}
							rowKey={(secret) => secret.id}
							isLoading={isLoading}
							skeletonRows={4}
							empty={
								<EmptyState
									icon='SquareLockPassword'
									title='No secrets yet'
									description='Store API keys and variables here, then reference them from node configs.'
									action={
										<Button variant='solid' onClick={openCreate}>
											Add your first secret
										</Button>
									}
								/>
							}
						/>
					</CardBody>
				</Card>
			</Container>

			<Modal isOpen={isFormOpen} setIsOpen={setIsFormOpen} rounded='rounded-2xl' isScrollable>
				<ModalHeader>{editing ? `Edit ${editing.key}` : 'New secret'}</ModalHeader>
				<ModalBody className='flex flex-col gap-4'>
					<div>
						<Label htmlFor='secret-key'>Key</Label>
						<Input
							id='secret-key'
							name='secret-key'
							className='font-mono'
							value={key}
							placeholder='STRIPE_API_KEY'
							onChange={(event) => setKey(event.target.value)}
						/>
					</div>

					<div>
						<Label htmlFor='secret-value'>Value</Label>
						<Input
							id='secret-value'
							name='secret-value'
							type={isSecret ? 'password' : 'text'}
							value={value}
							placeholder={
								editing?.is_secret ? 'Leave blank to keep the current value' : ''
							}
							onChange={(event) => setValue(event.target.value)}
						/>
					</div>

					<div>
						<Label htmlFor='secret-description'>Description</Label>
						<Textarea
							id='secret-description'
							name='secret-description'
							rows={2}
							value={description}
							placeholder='What is this used for?'
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>

					<Checkbox
						name='is-secret'
						label='Treat as a secret (value is write-only once saved)'
						checked={isSecret}
						onChange={(event) => setIsSecret(event.target.checked)}
					/>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='zinc'
							isDisable={isPending}
							onClick={() => setIsFormOpen(false)}>
							Cancel
						</Button>
						<Button
							variant='solid'
							isLoading={isPending}
							isDisable={!canSubmit || isPending}
							onClick={() => void onSubmit()}>
							{editing ? 'Save' : 'Create'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Delete ${pendingDelete?.key}?`}
				description='Any node config referencing it will fail on the next run. This cannot be undone.'
				isPending={deleteSecret.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteSecret.mutate(pendingDelete.id, {
						onSuccess: () => setPendingDelete(null),
					});
				}}
			/>
		</>
	);
};

export default SecretsPage;
