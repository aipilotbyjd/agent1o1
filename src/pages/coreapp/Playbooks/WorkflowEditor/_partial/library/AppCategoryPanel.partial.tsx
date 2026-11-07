import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useRecentlyUsedNodes } from '@/api/modules/nodes';
import {
	filterNodes,
	isListed,
	mapApiNodeToDefinition,
	splitNodesByKind,
} from '../../_helper/apiNodeCatalog.helper';
import type { TNodeCategoryGroup } from '../../_helper/apiNodeCatalog.helper';
import type { TNodeDefinition } from '../../_types/node.type';
import AccountSelect from '../canvas/nodes/AccountSelect.partial';
import { NodeGroupHeader, NodeRow, NodeSearchBox } from './LibraryItems.partial';

type Props = {
	group: TNodeCategoryGroup;
	workspaceId: string;
	connected: boolean;
	onAdd: (node: TNodeDefinition) => void;
};

const RECENT_LIMIT = 3;

/** One app: whether it is connected (with a way to connect), its nodes split into triggers and actions, and a search over just them. */
const AppCategoryPanel = ({ group, workspaceId, connected, onAdd }: Props) => {
	const [query, setQuery] = useState('');
	const [connecting, setConnecting] = useState(false);
	const { data: recentlyUsed } = useRecentlyUsedNodes(workspaceId);

	const { triggers, actions } = useMemo(
		() => splitNodesByKind(filterNodes(group.nodes, query)),
		[group.nodes, query],
	);

	const recent = useMemo(() => {
		if (query || !recentlyUsed || recentlyUsed.is_default) return [];
		return recentlyUsed.nodes
			.map((node) => mapApiNodeToDefinition(node))
			.filter(isListed)
			.filter((node) => node.appSlug === group.slug)
			.slice(0, RECENT_LIMIT);
	}, [query, recentlyUsed, group.slug]);

	return (
		<div className='space-y-1 px-4 pb-4'>
			<div className='flex items-center gap-2 px-1 pb-3 text-[10px] font-black tracking-widest uppercase'>
				<span className={connected ? 'text-emerald-500' : 'text-zinc-400'}>
					{connected ? '● Connected' : '○ Not connected'}
				</span>
				<span className='text-zinc-400'>· {group.nodes.length} nodes</span>
				{!connected && (
					<button
						type='button'
						onClick={() => setConnecting(true)}
						className='border-primary-300 bg-primary-50 text-primary-900 hover:bg-primary-100 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-300 ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-normal normal-case transition'>
						<Plus size={11} />
						Connect
					</button>
				)}
			</div>

			{group.status !== 'operational' && (
				<div
					role='status'
					className='mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'>
					<span className='font-bold'>
						{group.status === 'degraded' ? 'Having problems' : 'Down for maintenance'}
					</span>
					{group.statusNote && <span className='block'>{group.statusNote}</span>}
				</div>
			)}

			{connecting && (
				<AccountSelect
					connectorKey={group.slug}
					popupOnly
					onChange={() => undefined}
					onClose={() => setConnecting(false)}
				/>
			)}

			<NodeSearchBox
				value={query}
				onChange={setQuery}
				placeholder={`Search ${group.label} nodes`}
			/>

			{recent.length > 0 && (
				<>
					<NodeGroupHeader title='Recently used' count={recent.length} />
					{recent.map((node) => (
						<NodeRow key={`recent-${node.key}`} node={node} onAdd={onAdd} />
					))}
				</>
			)}

			{triggers.length > 0 && (
				<>
					<NodeGroupHeader
						title='Triggers'
						count={triggers.length}
						hint='Can start a flow'
					/>
					{triggers.map((node) => (
						<NodeRow key={node.key} node={node} onAdd={onAdd} />
					))}
				</>
			)}

			{actions.length > 0 && (
				<>
					<NodeGroupHeader
						title='Actions'
						count={actions.length}
						hint='Do a job in a flow'
					/>
					{actions.map((node) => (
						<NodeRow key={node.key} node={node} onAdd={onAdd} />
					))}
				</>
			)}

			{triggers.length === 0 && actions.length === 0 && (
				<div className='py-10 text-center text-xs font-medium text-zinc-400 dark:text-zinc-500'>
					No {group.label} nodes match “{query}”.
				</div>
			)}
		</div>
	);
};

export default AppCategoryPanel;
