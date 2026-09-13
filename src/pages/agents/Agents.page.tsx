import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
	useAgents,
	useAgent,
	useCreateAgent,
	useUpdateAgent,
	useDeleteAgent,
	useDuplicateAgent,
} from '@/api/modules/agents';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Input from '@/components/form/Input';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Icon from '@/components/icon/Icon';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatRelative } from '@/utils/format.util';
import AgentFormModalPart from './_parts/AgentFormModal.part';
import type { TAgent, TCreateAgentDto } from '@/types/agent.type';

// ============================================================
// Agents
// ------------------------------------------------------------
// The workspace's agents, as cards rather than a table: an agent
// is defined by its instructions, and a two-line preview of those
// tells you which one you want far better than a name column.
//
// Search filters client-side. The list endpoint takes no `q`
// parameter, and fetching every agent to filter in the browser is
// the honest option at this size — worth revisiting if the API
// grows server-side search.
// ============================================================

const AgentsPage = () => {
	useDocumentTitle({ name: 'Agents' });

	const ws = useWorkspaceId();
	const navigate = useNavigate();

	const { data: agents, isLoading } = useAgents(ws);
	const createAgent = useCreateAgent(ws);
	const updateAgent = useUpdateAgent(ws);
	const deleteAgent = useDeleteAgent(ws);
	const duplicateAgent = useDuplicateAgent(ws);

	const [search, setSearch] = useState('');
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<TAgent | null>(null);

	// The list payload may omit `instructions`, so editing reads the agent
	// back in full — saving a form seeded from a partial record would blank
	// whatever the list left out.
	const { data: editingAgent } = useAgent(ws, editingId ?? '');

	const filtered = (agents ?? []).filter((agent) => {
		const needle = search.trim().toLowerCase();
		if (!needle) return true;
		return (
			agent.name.toLowerCase().includes(needle) ||
			(agent.description ?? '').toLowerCase().includes(needle)
		);
	});

	const onSubmit = async (payload: TCreateAgentDto) => {
		if (editingId) {
			await updateAgent.mutateAsync({ id: editingId, body: payload });
		} else {
			const created = await createAgent.mutateAsync(payload);
			navigate(`/agents/${created.id}`);
		}
		setIsFormOpen(false);
		setEditingId(null);
	};

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-lg font-semibold'>Agents</span>
					<span className='text-zinc-500'>{agents?.length ?? 0}</span>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='w-56'>
						<Input
							name='agent-search'
							type='search'
							value={search}
							placeholder='Search agents'
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
					<Button
						variant='solid'
						icon='PlusSignCircle'
						onClick={() => {
							setEditingId(null);
							setIsFormOpen(true);
						}}>
						New agent
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				{isLoading && (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
						<Skeleton className='h-44 w-full' />
						<Skeleton className='h-44 w-full' />
						<Skeleton className='h-44 w-full' />
					</div>
				)}

				{!isLoading && !agents?.length && (
					<Card>
						<CardBody>
							<EmptyState
								icon='Bot'
								title='No agents yet'
								description='An agent is a system prompt plus the tools and knowledge you give it. Create one and start a conversation.'
								action={
									<Button
										variant='solid'
										onClick={() => {
											setEditingId(null);
											setIsFormOpen(true);
										}}>
										Create your first agent
									</Button>
								}
							/>
						</CardBody>
					</Card>
				)}

				{!isLoading && !!agents?.length && !filtered.length && (
					<Card>
						<CardBody>
							<EmptyState
								icon='Search01'
								title='No agents match that search'
								action={
									<Button
										variant='outline'
										color='zinc'
										onClick={() => setSearch('')}>
										Clear search
									</Button>
								}
							/>
						</CardBody>
					</Card>
				)}

				{!isLoading && !!filtered.length && (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
						{filtered.map((agent) => (
							<Card key={agent.id} className='flex h-full flex-col'>
								<CardBody className='flex grow flex-col gap-3'>
									<div className='flex items-start gap-3'>
										<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500'>
											<Icon icon='Bot' size='text-2xl' />
										</span>
										<div className='min-w-0 grow'>
											<div className='truncate font-semibold'>
												{agent.name}
											</div>
											<div className='truncate text-xs text-zinc-500'>
												Updated {formatRelative(agent.updated_at)}
											</div>
										</div>

										<Dropdown>
											<DropdownToggle hasIcon={false}>
												<Button
													variant='link'
													color='zinc'
													icon='MoreVerticalCircle01'
													aria-label={`Actions for ${agent.name}`}
													className='!p-0'
												/>
											</DropdownToggle>
											<DropdownMenu placement='bottom-end'>
												<DropdownItem
													onClick={() => {
														setEditingId(agent.id);
														setIsFormOpen(true);
													}}>
													Edit
												</DropdownItem>
												<DropdownItem
													onClick={() => duplicateAgent.mutate(agent.id)}>
													Duplicate
												</DropdownItem>
												<DropdownItem
													onClick={() => setPendingDelete(agent)}>
													Delete
												</DropdownItem>
											</DropdownMenu>
										</Dropdown>
									</div>

									<p className='line-clamp-3 grow text-sm text-zinc-500'>
										{agent.description || agent.instructions}
									</p>

									<div className='flex items-center justify-between gap-2'>
										{agent.model_catalog_slug || agent.model ? (
											<Badge
												color='zinc'
												variant='soft'
												rounded='rounded-full'
												className='truncate'>
												{agent.model_catalog_slug ?? agent.model}
											</Badge>
										) : (
											<span />
										)}
										<Button
											variant='outline'
											color='zinc'
											dimension='sm'
											rightIcon='ArrowRight01'
											onClick={() => navigate(`/agents/${agent.id}`)}>
											Open chat
										</Button>
									</div>
								</CardBody>
							</Card>
						))}
					</div>
				)}
			</Container>

			<AgentFormModalPart
				agent={editingId ? (editingAgent ?? null) : null}
				isOpen={isFormOpen}
				onClose={() => {
					setIsFormOpen(false);
					setEditingId(null);
				}}
				isPending={createAgent.isPending || updateAgent.isPending}
				onSubmit={(payload) => void onSubmit(payload)}
			/>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Delete ${pendingDelete?.name}?`}
				description='Its sessions, memories and evaluation history go with it. This cannot be undone.'
				isPending={deleteAgent.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteAgent.mutate(pendingDelete.id, {
						onSuccess: () => setPendingDelete(null),
					});
				}}
			/>
		</>
	);
};

export default AgentsPage;
