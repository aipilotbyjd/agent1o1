import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import classNames from 'classnames';
import { useAgent, useUpdateAgent } from '@/api/modules/agents';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import EmptyState from '@/components/common/EmptyState';
import { TIcons } from '@/types/icons.type';
import AgentFormModalPart from './_parts/AgentFormModal.part';
import ChatPanelPart from './_parts/ChatPanel.part';
import KnowledgePanelPart from './_parts/KnowledgePanel.part';
import MemoryPanelPart from './_parts/MemoryPanel.part';
import ToolsPanelPart from './_parts/ToolsPanel.part';
import VersionsPanelPart from './_parts/VersionsPanel.part';
import type { TCreateAgentDto } from '@/types/agent.type';

// ============================================================
// Agent Detail
// ------------------------------------------------------------
// One agent, five views of it. The tab lives in the URL rather
// than in state so a particular view is linkable and survives a
// reload — "look at this agent's memory" is a thing people send
// each other.
//
// Chat is the default because it is what the screen is for; the
// rest configure what chat does.
// ============================================================

const TABS = [
	{ id: 'chat', label: 'Chat', icon: 'Message02' },
	{ id: 'knowledge', label: 'Knowledge', icon: 'BookOpen02' },
	{ id: 'memory', label: 'Memory', icon: 'Brain' },
	{ id: 'tools', label: 'Tools', icon: 'Wrench01' },
	{ id: 'versions', label: 'Versions', icon: 'Clock03' },
] as const satisfies readonly { id: string; label: string; icon: TIcons }[];

type TTabId = (typeof TABS)[number]['id'];

const isTabId = (value: string): value is TTabId => TABS.some((tab) => tab.id === value);

const AgentDetailPage = () => {
	const { agentId = '', tab } = useParams();
	const ws = useWorkspaceId();
	const navigate = useNavigate();

	const { data: agent, isLoading: isAgentLoading } = useAgent(ws, agentId);
	useDocumentTitle({ name: agent?.name ?? 'Agent' });

	const updateAgent = useUpdateAgent(ws);
	const [isEditOpen, setIsEditOpen] = useState(false);

	// An unknown tab segment falls back to chat rather than rendering an
	// empty shell — a stale or mistyped link should still land somewhere.
	const activeTab: TTabId = tab && isTabId(tab) ? tab : 'chat';

	if (!isAgentLoading && !agent) {
		return (
			<Container>
				<Card className='mt-8'>
					<CardBody>
						<EmptyState
							icon='Bot'
							title='Agent not found'
							description='It may belong to another workspace, or have been deleted.'
							action={
								<Button variant='solid' onClick={() => navigate('/agents')}>
									Back to agents
								</Button>
							}
						/>
					</CardBody>
				</Card>
			</Container>
		);
	}

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='link'
						color='zinc'
						icon='ArrowLeft01'
						onClick={() => navigate('/agents')}>
						Agents
					</Button>
					<span className='text-lg font-semibold'>{agent?.name ?? '…'}</span>
					{(agent?.model_catalog_slug || agent?.model) && (
						<Badge color='zinc' variant='soft' rounded='rounded-full'>
							{agent.model_catalog_slug ?? agent.model}
						</Badge>
					)}
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='outline'
						color='zinc'
						icon='PencilEdit02'
						onClick={() => setIsEditOpen(true)}>
						Edit agent
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<nav className='mb-4 flex flex-wrap gap-1 border-b border-zinc-500/25'>
					{TABS.map((item) => (
						<Link
							key={item.id}
							// Chat is the bare route so the canonical agent URL
							// stays `/agents/:id`.
							to={
								item.id === 'chat'
									? `/agents/${agentId}`
									: `/agents/${agentId}/${item.id}`
							}
							className={classNames(
								'-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm transition-colors',
								activeTab === item.id
									? 'border-primary-500 text-primary-500 font-semibold'
									: 'border-transparent text-zinc-500 hover:text-inherit',
							)}>
							<Icon icon={item.icon} />
							{item.label}
						</Link>
					))}
				</nav>

				{activeTab === 'chat' && <ChatPanelPart ws={ws} agentId={agentId} />}
				{activeTab === 'knowledge' && <KnowledgePanelPart ws={ws} agentId={agentId} />}
				{activeTab === 'memory' && <MemoryPanelPart ws={ws} agentId={agentId} />}
				{activeTab === 'tools' && <ToolsPanelPart ws={ws} agentId={agentId} />}
				{activeTab === 'versions' && <VersionsPanelPart ws={ws} agentId={agentId} />}
			</Container>

			<AgentFormModalPart
				agent={agent ?? null}
				isOpen={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				isPending={updateAgent.isPending}
				onSubmit={(payload: TCreateAgentDto) => {
					updateAgent.mutate(
						{ id: agentId, body: payload },
						{ onSuccess: () => setIsEditOpen(false) },
					);
				}}
			/>
		</>
	);
};

export default AgentDetailPage;
