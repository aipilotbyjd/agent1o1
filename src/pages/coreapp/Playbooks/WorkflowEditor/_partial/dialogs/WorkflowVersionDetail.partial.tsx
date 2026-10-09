import { useState } from 'react';
import { ArrowRight, Box, Copy, Loader2 } from 'lucide-react';
import { useWorkflowVersion } from '@/api/modules/workflows';
import { notify } from '@/api/core';

/** A published graph as `Workflow::draftGraph()` stores it — nodes by `key`, edges by `from`/`to`. */
type TVersionNode = { key?: string; type?: string; config?: Record<string, unknown> | null };
type TVersionEdge = { from?: string; to?: string; condition?: string | null };

/**
 * What one published version actually contains, read from its own endpoint:
 * every node (key and type) and every connection. The row above it only has
 * the number, notes and author.
 */
const WorkflowVersionDetail = ({
	workspaceId,
	workflowId,
	versionId,
}: {
	workspaceId: string;
	workflowId: string;
	versionId: string;
}) => {
	const { data, isLoading, isError } = useWorkflowVersion(workspaceId, workflowId, versionId);
	const [showJson, setShowJson] = useState(false);

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 py-3 text-[11px] font-semibold text-zinc-400'>
				<Loader2 size={12} className='animate-spin' />
				Loading version…
			</div>
		);
	}

	if (isError || !data) {
		return (
			<p className='py-3 text-[11px] font-semibold text-zinc-400'>
				This version could not be loaded.
			</p>
		);
	}

	const nodes = (data.graph?.nodes ?? []) as TVersionNode[];
	const edges = (data.graph?.edges ?? []) as TVersionEdge[];
	const json = JSON.stringify(data.graph ?? {}, null, 2);

	return (
		<div className='space-y-3 pt-3'>
			<div className='grid gap-3 sm:grid-cols-2'>
				<div>
					<p className='mb-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase'>
						Nodes ({nodes.length})
					</p>
					<div className='max-h-48 space-y-1 overflow-y-auto'>
						{nodes.length === 0 && (
							<p className='text-[11px] text-zinc-400'>No nodes.</p>
						)}
						{nodes.map((node, idx) => (
							<div
								key={node.key ?? idx}
								className='flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50/60 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
								<Box size={11} className='text-primary-500 shrink-0' />
								<span className='min-w-0 flex-1 truncate font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-200'>
									{node.key ?? `node ${idx + 1}`}
								</span>
								<span className='shrink-0 truncate text-[10px] font-semibold text-zinc-400'>
									{node.type}
								</span>
							</div>
						))}
					</div>
				</div>
				<div>
					<p className='mb-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase'>
						Connections ({edges.length})
					</p>
					<div className='max-h-48 space-y-1 overflow-y-auto'>
						{edges.length === 0 && (
							<p className='text-[11px] text-zinc-400'>No connections.</p>
						)}
						{edges.map((edge, idx) => (
							<div
								key={`${edge.from}-${edge.to}-${idx}`}
								className='flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/60 px-2.5 py-1.5 font-mono text-[11px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'>
								<span className='min-w-0 truncate'>{edge.from}</span>
								<ArrowRight size={10} className='shrink-0 text-zinc-400' />
								<span className='min-w-0 truncate'>{edge.to}</span>
								{edge.condition && (
									<span className='ml-auto shrink-0 rounded bg-amber-50 px-1.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'>
										{edge.condition}
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='flex items-center gap-3'>
				<button
					type='button'
					onClick={() => setShowJson((v) => !v)}
					className='text-[10px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
					{showJson ? 'Hide raw graph' : 'Raw graph JSON'}
				</button>
				<button
					type='button'
					onClick={() => {
						navigator.clipboard?.writeText(json);
						notify.success(`v${data.version} graph copied`);
					}}
					className='flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
					<Copy size={10} />
					Copy
				</button>
			</div>
			{showJson && (
				<pre className='max-h-64 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50 p-3 font-mono text-[10px] leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300'>
					{json}
				</pre>
			)}
		</div>
	);
};

export default WorkflowVersionDetail;
