import { FC, useState } from 'react';
import {
	useAgentKnowledge,
	useCreateAgentKnowledge,
	useUpdateAgentKnowledge,
	useDeleteAgentKnowledge,
	useAgentKnowledgeSources,
	useAttachAgentKnowledgeSource,
	useDetachAgentKnowledgeSource,
} from '@/api/modules/agents';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatNumber } from '@/utils/format.util';
import type { TAgentKnowledge } from '@/types/agent.type';

// ============================================================
// Knowledge Panel
// ------------------------------------------------------------
// Two different things that both end up in the agent's context,
// kept visually apart because they behave differently:
//
//  - Inline entries: text written here, owned by this agent.
//  - Knowledge-base collections: workspace-wide documents this
//    agent is *allowed to search*. Attaching one grants access; it
//    does not copy anything, so editing the collection elsewhere
//    changes what this agent sees.
//
// `is_active` is a toggle rather than a delete so an entry can be
// taken out of the prompt without losing the text.
// ============================================================

interface IKnowledgePanelProps {
	ws: string;
	agentId: string;
}

const KnowledgePanelPart: FC<IKnowledgePanelProps> = ({ ws, agentId }) => {
	const { data: entries, isLoading } = useAgentKnowledge(ws, agentId);
	const createEntry = useCreateAgentKnowledge(ws, agentId);
	const updateEntry = useUpdateAgentKnowledge(ws, agentId);
	const deleteEntry = useDeleteAgentKnowledge(ws, agentId);

	const { data: sources, isLoading: isSourcesLoading } = useAgentKnowledgeSources(ws, agentId);
	const attachSource = useAttachAgentKnowledgeSource(ws, agentId);
	const detachSource = useDetachAgentKnowledgeSource(ws, agentId);

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editing, setEditing] = useState<TAgentKnowledge | null>(null);
	const [pendingDelete, setPendingDelete] = useState<TAgentKnowledge | null>(null);
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [isActive, setIsActive] = useState(true);

	const openCreate = () => {
		setEditing(null);
		setTitle('');
		setContent('');
		setIsActive(true);
		setIsFormOpen(true);
	};

	const openEdit = (entry: TAgentKnowledge) => {
		setEditing(entry);
		setTitle(entry.title);
		setContent(entry.content);
		setIsActive(entry.is_active);
		setIsFormOpen(true);
	};

	const isPending = createEntry.isPending || updateEntry.isPending;
	const canSubmit = !!title.trim() && !!content.trim();

	const onSubmit = async () => {
		if (!canSubmit) return;
		const body = {
			title: title.trim(),
			content: content.trim(),
			source_type: 'text' as const,
			is_active: isActive,
		};
		if (editing) await updateEntry.mutateAsync({ id: editing.id, body });
		else await createEntry.mutateAsync(body);
		setIsFormOpen(false);
	};

	return (
		<>
			<div className='grid grid-cols-12 gap-4'>
				{/* ─── Inline entries ──────────────────────────── */}
				<div className='col-span-12 xl:col-span-7'>
					<Card className='h-full'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Knowledge entries</CardTitle>
							</CardHeaderChild>
							<CardHeaderChild>
								<Button
									variant='outline'
									color='zinc'
									dimension='sm'
									icon='PlusSignCircle'
									onClick={openCreate}>
									New entry
								</Button>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='flex flex-col gap-3'>
							{isLoading && (
								<>
									<Skeleton className='h-20 w-full' />
									<Skeleton className='h-20 w-full' />
								</>
							)}

							{!isLoading && !entries?.length && (
								<EmptyState
									icon='BookOpen02'
									title='No knowledge entries'
									description='Add reference text the agent should always have on hand.'
									action={
										<Button variant='solid' onClick={openCreate}>
											Add the first entry
										</Button>
									}
								/>
							)}

							{entries?.map((entry) => (
								<div
									key={entry.id}
									className='rounded-xl border border-zinc-500/25 p-3'>
									<div className='flex items-start gap-2'>
										<div className='min-w-0 grow'>
											<div className='flex items-center gap-2'>
												<span className='truncate font-medium'>
													{entry.title}
												</span>
												{!entry.is_active && (
													<Badge
														color='zinc'
														variant='soft'
														rounded='rounded-full'>
														Inactive
													</Badge>
												)}
												{entry.tokens !== null && (
													<span className='shrink-0 text-xs text-zinc-500'>
														{formatNumber(entry.tokens)} tokens
													</span>
												)}
											</div>
											<p className='mt-1 line-clamp-2 text-sm text-zinc-500'>
												{entry.content}
											</p>
										</div>
										<div className='flex shrink-0 gap-1'>
											<Button
												variant='outline'
												color='zinc'
												dimension='sm'
												aria-label={
													entry.is_active ? 'Deactivate' : 'Activate'
												}
												icon={entry.is_active ? 'ViewOff' : 'View'}
												onClick={() =>
													updateEntry.mutate({
														id: entry.id,
														body: { is_active: !entry.is_active },
													})
												}
											/>
											<Button
												variant='outline'
												color='zinc'
												dimension='sm'
												icon='PencilEdit02'
												aria-label={`Edit ${entry.title}`}
												onClick={() => openEdit(entry)}
											/>
											<Button
												variant='outline'
												color='red'
												dimension='sm'
												icon='Delete02'
												aria-label={`Delete ${entry.title}`}
												onClick={() => setPendingDelete(entry)}
											/>
										</div>
									</div>
								</div>
							))}
						</CardBody>
					</Card>
				</div>

				{/* ─── Knowledge-base collections ──────────────── */}
				<div className='col-span-12 xl:col-span-5'>
					<Card className='h-full'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Knowledge base</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody className='flex flex-col gap-2'>
							<p className='text-sm text-zinc-500'>
								Workspace collections this agent is allowed to search. Attaching
								grants access — it doesn&apos;t copy the documents.
							</p>

							{isSourcesLoading && <Skeleton className='h-24 w-full' />}

							{!isSourcesLoading &&
								!sources?.attached.length &&
								!sources?.available.length && (
									<EmptyState
										icon='Database'
										title='No collections yet'
										description='Upload documents on the Knowledge screen first.'
									/>
								)}

							{sources?.attached.map((collection) => (
								<div
									key={collection}
									className='flex items-center justify-between gap-2 rounded-xl border border-zinc-500/25 px-3 py-2'>
									<span className='truncate font-mono text-sm'>{collection}</span>
									<Button
										variant='outline'
										color='zinc'
										dimension='sm'
										isDisable={detachSource.isPending}
										onClick={() => detachSource.mutate(collection)}>
										Detach
									</Button>
								</div>
							))}

							{sources?.available
								.filter((collection) => !sources.attached.includes(collection))
								.map((collection) => (
									<div
										key={collection}
										className='flex items-center justify-between gap-2 rounded-xl border border-dashed border-zinc-500/25 px-3 py-2'>
										<span className='truncate font-mono text-sm text-zinc-500'>
											{collection}
										</span>
										<Button
											variant='outline'
											color='zinc'
											dimension='sm'
											isDisable={attachSource.isPending}
											onClick={() => attachSource.mutate(collection)}>
											Attach
										</Button>
									</div>
								))}
						</CardBody>
					</Card>
				</div>
			</div>

			<Modal isOpen={isFormOpen} setIsOpen={setIsFormOpen} rounded='rounded-2xl' isScrollable>
				<ModalHeader>{editing ? `Edit ${editing.title}` : 'New knowledge entry'}</ModalHeader>
				<ModalBody className='flex flex-col gap-4'>
					<div>
						<Label htmlFor='knowledge-title'>Title</Label>
						<Input
							id='knowledge-title'
							name='knowledge-title'
							value={title}
							placeholder='Refund policy'
							onChange={(event) => setTitle(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor='knowledge-content'>Content</Label>
						<Textarea
							id='knowledge-content'
							name='knowledge-content'
							rows={10}
							value={content}
							placeholder='Text the agent should always have available…'
							onChange={(event) => setContent(event.target.value)}
						/>
					</div>
					<Checkbox
						name='knowledge-active'
						label='Active — include this entry in the agent’s context'
						checked={isActive}
						onChange={(event) => setIsActive(event.target.checked)}
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
							{editing ? 'Save' : 'Add entry'}
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Delete “${pendingDelete?.title}”?`}
				description='The agent loses this reference text. This cannot be undone.'
				isPending={deleteEntry.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteEntry.mutate(pendingDelete.id, {
						onSuccess: () => setPendingDelete(null),
					});
				}}
			/>
		</>
	);
};

export default KnowledgePanelPart;
