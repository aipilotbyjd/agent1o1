import { Lock, RefreshCw, Trash2, Globe, AlertTriangle, Pencil, Files } from 'lucide-react';
import { useConfirm } from '@/context/confirm';
import { ListSkeletonRows } from '@/parts/ListSkeleton.part';
import {
	useDeleteKnowledgeSource,
	useKnowledgeSources,
	useSyncKnowledgeSource,
} from '@/api/modules/knowledge-base';
import type { TKnowledgeSource } from '@/types/knowledge-base.type';
import { KNOWLEDGE_KINDS } from '../_helper/knowledge.sources';

const STATUS_STYLES: Record<TKnowledgeSource['status'], string> = {
	pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	syncing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
	ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
	failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
};

interface IKnowledgeSourcesProps {
	ws: string;
	onAdd: () => void;
	onEdit: (source: TKnowledgeSource) => void;
	onShowDocuments: (source: TKnowledgeSource) => void;
}

/** Web pages and apps the knowledge base keeps in sync. */
const KnowledgeSourcesPartial = ({
	ws,
	onAdd,
	onEdit,
	onShowDocuments,
}: IKnowledgeSourcesProps) => {
	const { confirm } = useConfirm();
	const { data: sources = [], isLoading } = useKnowledgeSources(ws);
	const syncSource = useSyncKnowledgeSource(ws);
	const deleteSource = useDeleteKnowledgeSource(ws);

	const handleDelete = async (source: TKnowledgeSource) => {
		const confirmed = await confirm({
			title: 'Remove source',
			message: (
				<>
					Stop syncing{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						&quot;{source.name}&quot;
					</strong>{' '}
					and remove its {source.documents_count} document(s) from the knowledge base?
				</>
			),
		});
		if (confirmed) deleteSource.mutate(source.id);
	};

	if (isLoading) return <ListSkeletonRows count={3} />;

	if (sources.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center gap-2 rounded-3xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900'>
				<Globe size={28} className='text-slate-300 dark:text-zinc-600' />
				<p className='text-sm font-bold text-slate-700 dark:text-zinc-300'>
					Nothing synced yet
				</p>
				<p className='max-w-sm text-xs font-semibold text-slate-400 dark:text-zinc-500'>
					Keep a web page, a Drive folder, a mail label, a repo or a Slack channel in the
					knowledge base automatically.
				</p>
				<button
					onClick={onAdd}
					className='bg-primary-400 text-primary-950 mt-2 h-9 cursor-pointer rounded-xl px-4 text-xs font-black'>
					Add a source
				</button>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-3'>
			{sources.map((source) => (
				<div
					key={source.id}
					className='flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs sm:p-4 dark:border-zinc-800 dark:bg-zinc-900'>
					<div className='min-w-0 flex-1'>
						<div className='flex flex-wrap items-center gap-2'>
							<span className='truncate text-sm font-bold text-slate-900 dark:text-white'>
								{source.name}
							</span>
							<span className='rounded-lg border border-slate-200/50 bg-slate-50/50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400'>
								{KNOWLEDGE_KINDS[source.type]?.label ?? source.type}
							</span>
							{source.private && (
								<span className='inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-zinc-400'>
									<Lock size={10} /> Private
								</span>
							)}
							<span
								className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[source.status]}`}>
								{source.status}
							</span>
						</div>
						<p className='mt-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
							{source.documents_count} documents · {source.collection}
							{source.account ? ` · ${source.account}` : ''}
							{source.last_synced_at
								? ` · synced ${new Date(source.last_synced_at).toLocaleString()}`
								: ''}
						</p>
						{source.last_error && (
							<p className='mt-1 flex items-start gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400'>
								<AlertTriangle size={12} className='mt-0.5 shrink-0' />{' '}
								{source.last_error}
							</p>
						)}
					</div>
					<div className='flex shrink-0 gap-1.5'>
						<button
							aria-label='Show documents'
							title='Documents'
							onClick={() => onShowDocuments(source)}
							className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400'>
							<Files size={12} />
						</button>
						<button
							aria-label='Edit source'
							title='Edit'
							onClick={() => onEdit(source)}
							className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-slate-500 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400'>
							<Pencil size={12} />
						</button>
						<button
							aria-label='Sync now'
							title='Sync now'
							disabled={['pending', 'syncing'].includes(source.status)}
							onClick={() => syncSource.mutate(source.id)}
							className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-400'>
							<RefreshCw
								size={12}
								className={source.status === 'syncing' ? 'animate-spin' : ''}
							/>
						</button>
						<button
							aria-label='Remove source'
							onClick={() => handleDelete(source)}
							className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-zinc-200 text-slate-400 hover:text-rose-500 dark:border-zinc-800'>
							<Trash2 size={12} />
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default KnowledgeSourcesPartial;
