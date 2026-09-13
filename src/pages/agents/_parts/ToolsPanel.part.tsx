import { FC, useState } from 'react';
import {
	useAgentToolBindings,
	useCreateAgentToolBinding,
	useDeleteAgentToolBinding,
	useAgentWorkflowTools,
	useAttachAgentWorkflow,
	useDetachAgentWorkflow,
	useAgentSkillAttachments,
	useAttachAgentSkill,
	useDetachAgentSkill,
} from '@/api/modules/agents';
import { useGlobalNodeCatalog } from '@/api/modules/nodes';
import { useWorkflows } from '@/api/modules/workflows';
import { useAgentSkills } from '@/api/modules/agent-skills';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Select from '@/components/form/Select';
import EmptyState from '@/components/common/EmptyState';

// ============================================================
// Tools Panel
// ------------------------------------------------------------
// Three kinds of capability an agent can be given, on one screen
// because from the agent's side they are all just "tools it can
// call":
//
//  - Node tools: a built-in node type exposed directly.
//  - Workflows: a whole workflow the agent can invoke.
//  - Skills: reusable instruction bundles.
//
// Each is its own endpoint and its own attach/detach pair, so they
// stay visually separate rather than being merged into one list
// that would have to explain which kind each row is anyway.
// ============================================================

interface IAttachRowProps {
	title: string;
	subtitle?: string | null;
	badge?: string | null;
	actionLabel: string;
	isPending: boolean;
	onAction: () => void;
	isAttached?: boolean;
}

const AttachRow: FC<IAttachRowProps> = ({
	title,
	subtitle,
	badge,
	actionLabel,
	isPending,
	onAction,
	isAttached = true,
}) => (
	<div
		className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
			isAttached ? 'border-zinc-500/25' : 'border-dashed border-zinc-500/25'
		}`}>
		<div className='min-w-0'>
			<div className='flex items-center gap-2'>
				<span className='truncate font-medium'>{title}</span>
				{badge && (
					<Badge color='zinc' variant='soft' rounded='rounded-full'>
						{badge}
					</Badge>
				)}
			</div>
			{subtitle && <p className='truncate text-sm text-zinc-500'>{subtitle}</p>}
		</div>
		<Button
			variant='outline'
			color={isAttached ? 'red' : 'zinc'}
			dimension='sm'
			isDisable={isPending}
			onClick={onAction}>
			{actionLabel}
		</Button>
	</div>
);

interface IToolsPanelProps {
	ws: string;
	agentId: string;
}

const ToolsPanelPart: FC<IToolsPanelProps> = ({ ws, agentId }) => {
	const { data: bindings, isLoading: isBindingsLoading } = useAgentToolBindings(ws, agentId);
	const createBinding = useCreateAgentToolBinding(ws, agentId);
	const deleteBinding = useDeleteAgentToolBinding(ws, agentId);
	const { data: catalog } = useGlobalNodeCatalog();

	const { data: attachedWorkflows, isLoading: isWorkflowsLoading } = useAgentWorkflowTools(
		ws,
		agentId,
	);
	const attachWorkflow = useAttachAgentWorkflow(ws, agentId);
	const detachWorkflow = useDetachAgentWorkflow(ws, agentId);
	const { data: allWorkflows } = useWorkflows(ws);

	const { data: attachedSkills, isLoading: isSkillsLoading } = useAgentSkillAttachments(
		ws,
		agentId,
	);
	const attachSkill = useAttachAgentSkill(ws, agentId);
	const detachSkill = useDetachAgentSkill(ws, agentId);
	const { data: allSkills } = useAgentSkills(ws);

	const [nodeType, setNodeType] = useState('');
	const [workflowId, setWorkflowId] = useState('');
	const [skillId, setSkillId] = useState('');

	const boundTypes = new Set((bindings ?? []).map((binding) => binding.node_type));
	const attachedWorkflowIds = new Set((attachedWorkflows ?? []).map((item) => String(item.id)));
	const attachedSkillIds = new Set((attachedSkills ?? []).map((item) => String(item.id)));

	return (
		<div className='grid grid-cols-12 gap-4'>
			{/* ─── Node tools ──────────────────────────────── */}
			<div className='col-span-12 xl:col-span-4'>
				<Card className='h-full'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Node tools</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody className='flex flex-col gap-2'>
						<div className='flex gap-2'>
							<Select
								id='tool-node-type'
								name='tool-node-type'
								value={nodeType}
								onChange={(event) => setNodeType(event.target.value)}>
								<option value=''>Add a node…</option>
								{(catalog ?? [])
									.filter((node) => !boundTypes.has(node.type))
									.map((node) => (
										<option key={node.type} value={node.type}>
											{node.name}
										</option>
									))}
							</Select>
							<Button
								variant='solid'
								isDisable={!nodeType || createBinding.isPending}
								isLoading={createBinding.isPending}
								onClick={() =>
									createBinding.mutate(
										{ node_type: nodeType },
										{ onSuccess: () => setNodeType('') },
									)
								}>
								Add
							</Button>
						</div>

						{isBindingsLoading && <Skeleton className='h-16 w-full' />}

						{!isBindingsLoading && !bindings?.length && (
							<EmptyState
								icon='Wrench01'
								title='No node tools'
								description='Give the agent a node it can call directly.'
							/>
						)}

						{bindings?.map((binding) => (
							<AttachRow
								key={binding.id}
								title={
									catalog?.find((node) => node.type === binding.node_type)?.name ??
									binding.node_type
								}
								subtitle={binding.node_type}
								actionLabel='Remove'
								isPending={deleteBinding.isPending}
								onAction={() => deleteBinding.mutate(binding.id)}
							/>
						))}
					</CardBody>
				</Card>
			</div>

			{/* ─── Workflows ───────────────────────────────── */}
			<div className='col-span-12 xl:col-span-4'>
				<Card className='h-full'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Workflows</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody className='flex flex-col gap-2'>
						<div className='flex gap-2'>
							<Select
								id='tool-workflow'
								name='tool-workflow'
								value={workflowId}
								onChange={(event) => setWorkflowId(event.target.value)}>
								<option value=''>Attach a workflow…</option>
								{(allWorkflows ?? [])
									.filter((workflow) => !attachedWorkflowIds.has(String(workflow.id)))
									.map((workflow) => (
										<option key={workflow.id} value={workflow.id}>
											{workflow.name}
										</option>
									))}
							</Select>
							<Button
								variant='solid'
								isDisable={!workflowId || attachWorkflow.isPending}
								isLoading={attachWorkflow.isPending}
								onClick={() =>
									attachWorkflow.mutate(workflowId, {
										onSuccess: () => setWorkflowId(''),
									})
								}>
								Attach
							</Button>
						</div>

						{isWorkflowsLoading && <Skeleton className='h-16 w-full' />}

						{!isWorkflowsLoading && !attachedWorkflows?.length && (
							<EmptyState
								icon='WorkflowSquare10'
								title='No workflows attached'
								description='Let the agent run a workflow as a tool.'
							/>
						)}

						{attachedWorkflows?.map((workflow) => (
							<AttachRow
								key={workflow.id}
								title={workflow.name}
								subtitle={workflow.description}
								badge={workflow.is_published ? 'Published' : 'Draft'}
								actionLabel='Detach'
								isPending={detachWorkflow.isPending}
								onAction={() => detachWorkflow.mutate(workflow.id)}
							/>
						))}
					</CardBody>
				</Card>
			</div>

			{/* ─── Skills ──────────────────────────────────── */}
			<div className='col-span-12 xl:col-span-4'>
				<Card className='h-full'>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Skills</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody className='flex flex-col gap-2'>
						<div className='flex gap-2'>
							<Select
								id='tool-skill'
								name='tool-skill'
								value={skillId}
								onChange={(event) => setSkillId(event.target.value)}>
								<option value=''>Attach a skill…</option>
								{(allSkills ?? [])
									.filter((skill) => !attachedSkillIds.has(String(skill.id)))
									.map((skill) => (
										<option key={skill.id} value={skill.id}>
											{skill.name}
										</option>
									))}
							</Select>
							<Button
								variant='solid'
								isDisable={!skillId || attachSkill.isPending}
								isLoading={attachSkill.isPending}
								onClick={() =>
									attachSkill.mutate(skillId, { onSuccess: () => setSkillId('') })
								}>
								Attach
							</Button>
						</div>

						{isSkillsLoading && <Skeleton className='h-16 w-full' />}

						{!isSkillsLoading && !attachedSkills?.length && (
							<EmptyState
								icon='Rocket01'
								title='No skills attached'
								description='Skills are reusable instruction bundles.'
							/>
						)}

						{attachedSkills?.map((skill) => (
							<AttachRow
								key={skill.id}
								title={skill.name}
								subtitle={skill.description}
								badge={skill.category}
								actionLabel='Detach'
								isPending={detachSkill.isPending}
								onAction={() => detachSkill.mutate(skill.id)}
							/>
						))}
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default ToolsPanelPart;
