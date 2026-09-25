import { useState } from 'react';
import { Plus, FileText, Globe, File as FileIcon, Trash2, Pencil, X, Loader2 } from 'lucide-react';
import {
	useAgentKnowledge,
	useCreateAgentKnowledge,
	useUpdateAgentKnowledge,
	useDeleteAgentKnowledge,
} from '@/api/modules/agents';
import type { TAgentKnowledge, TAgentKnowledgeSourceType } from '@/types/agent.type';
import { toast } from 'react-toastify';

type TProps = {
	ws: string;
	agentId?: string;
};

const SOURCE_ICON: Record<TAgentKnowledgeSourceType, typeof FileText> = {
	text: FileText,
	url: Globe,
	file: FileIcon,
};

const emptyForm = {
	title: '',
	content: '',
	source_type: 'text' as TAgentKnowledgeSourceType,
	source_url: '',
};

/**
 * CRUD manager for an agent's knowledge base (RAG grounding).
 * Backed by {agent}/knowledge — see AgentKnowledgeController.
 */
const AgentKnowledgePanel = ({ ws, agentId }: TProps) => {
	const [search, setSearch] = useState('');
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [form, setForm] = useState(emptyForm);
	const [isReadingFile, setIsReadingFile] = useState(false);

	const loadFile = async (file: File | undefined) => {
		if (!file) return;
		if (!/\.(txt|md|html|csv|json|xml|ya?ml)$/i.test(file.name)) {
			toast.error('Choose a text, Markdown, HTML, CSV, JSON, XML, or YAML file.');
			return;
		}
		setIsReadingFile(true);
		try {
			const content = await file.text();
			if (content.length > 50000) {
				toast.error('Knowledge files must contain at most 50,000 characters.');
				return;
			}
			setForm((current) => ({ ...current, title: current.title || file.name, content }));
		} finally {
			setIsReadingFile(false);
		}
	};

	const { data, isLoading } = useAgentKnowledge(ws, agentId ?? '');
	const createMutation = useCreateAgentKnowledge(ws, agentId ?? '');
	const updateMutation = useUpdateAgentKnowledge(ws, agentId ?? '');
	const deleteMutation = useDeleteAgentKnowledge(ws, agentId ?? '');

	// `knowledge.index` has no search parameter, so filtering happens here.
	const items = (data ?? []).filter((k) =>
		search.trim()
			? `${k.title} ${k.content}`.toLowerCase().includes(search.trim().toLowerCase())
			: true,
	);

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to add knowledge.
			</p>
		);
	}

	const resetForm = () => {
		setForm(emptyForm);
		setEditingId(null);
		setIsFormOpen(false);
	};

	const openEdit = (item: TAgentKnowledge) => {
		setForm({
			title: item.title,
			content: item.content,
			source_type: item.source_type ?? 'text',
			source_url: item.source_url ?? '',
		});
		setEditingId(item.id);
		setIsFormOpen(true);
	};

	const handleSubmit = async () => {
		if (!form.title.trim() || !form.content.trim()) return;
		if (createMutation.isPending || updateMutation.isPending) return;
		const body = {
			title: form.title.trim(),
			content: form.content.trim(),
			source_type: form.source_type,
			source_url: form.source_type === 'url' ? form.source_url.trim() || null : null,
		};
		if (editingId) {
			await updateMutation.mutateAsync({ id: editingId, body });
		} else {
			await createMutation.mutateAsync(body);
		}
		resetForm();
	};

	const isSaving = createMutation.isPending || updateMutation.isPending;

	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>
						Knowledge Base
					</h4>
					<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						Documents injected into context to ground replies.
					</p>
				</div>
				<button
					onClick={() => {
						resetForm();
						setIsFormOpen(true);
					}}
					className='text-primary-600 dark:border-primary-500/20 dark:text-primary-400 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Add</span>
				</button>
			</div>

			{/* Search */}
			<input
				type='text'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder='Search knowledge…'
				className='focus:border-primary-500/50 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
			/>

			{/* Form */}
			{isFormOpen && (
				<div className='space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='flex items-center justify-between'>
						<span className='text-[11px] font-black text-zinc-700 dark:text-zinc-300'>
							{editingId ? 'Edit entry' : 'New entry'}
						</span>
						<button
							aria-label='Close'
							onClick={resetForm}
							className='text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
							<X size={13} />
						</button>
					</div>
					<div className='flex gap-1.5'>
						{(['text', 'url', 'file'] as TAgentKnowledgeSourceType[]).map((t) => (
							<button
								key={t}
								type='button'
								onClick={() => setForm((f) => ({ ...f, source_type: t }))}
								className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
									form.source_type === t
										? 'bg-primary-400 text-primary-950'
										: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
								}`}>
								{t}
							</button>
						))}
					</div>
					{form.source_type === 'file' && (
						<input
							type='file'
							accept='.txt,.md,.html,.csv,.json,.xml,.yaml,.yml'
							onChange={(event) => void loadFile(event.target.files?.[0])}
							className='file:bg-primary-400 file:text-primary-950 w-full text-[11px] text-zinc-500 file:mr-2 file:rounded-lg file:border-0 file:px-2 file:py-1 file:font-bold'
							aria-label='Choose knowledge file'
						/>
					)}
					<input
						type='text'
						value={form.title}
						onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
						placeholder='Title'
						className='focus:border-primary-500/50 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					{form.source_type === 'url' && (
						<input
							type='url'
							value={form.source_url}
							onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
							placeholder='https://source-url.com'
							className='focus:border-primary-500/50 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
						/>
					)}
					<textarea
						value={form.content}
						onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
						placeholder='Content the agent should know…'
						rows={5}
						className='focus:border-primary-500/50 w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<div className='flex justify-end gap-2'>
						<button
							onClick={resetForm}
							className='rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={
								isSaving ||
								isReadingFile ||
								!form.title.trim() ||
								!form.content.trim()
							}
							className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-black disabled:opacity-50'>
							{isSaving && <Loader2 size={11} className='animate-spin' />}
							{editingId ? 'Update' : 'Save'}
						</button>
					</div>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No knowledge yet. Add documents to ground the agent.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((item) => {
						const Icon = SOURCE_ICON[item.source_type ?? 'text'] ?? FileText;
						return (
							<div
								key={item.id}
								className='flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
								<div className='bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg'>
									<Icon size={13} />
								</div>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<span className='truncate text-xs font-black text-zinc-800 dark:text-zinc-200'>
											{item.title}
										</span>
										{!item.is_active && (
											<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black text-zinc-500 uppercase dark:bg-zinc-800'>
												Off
											</span>
										)}
									</div>
									<p className='mt-0.5 line-clamp-2 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
										{item.content}
									</p>
									<span className='mt-1 inline-block text-[9px] font-bold tracking-wide text-zinc-400 uppercase dark:text-zinc-600'>
										{item.tokens} tokens
									</span>
								</div>
								<div className='flex shrink-0 items-center gap-2'>
									<button
										onClick={() => openEdit(item)}
										title='Edit'
										className='hover:text-primary-600 dark:hover:text-primary-400 text-zinc-400'>
										<Pencil size={12} />
									</button>
									<button
										onClick={() => deleteMutation.mutate(item.id)}
										title='Delete'
										className='text-zinc-400 hover:text-rose-500'>
										<Trash2 size={12} />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default AgentKnowledgePanel;
