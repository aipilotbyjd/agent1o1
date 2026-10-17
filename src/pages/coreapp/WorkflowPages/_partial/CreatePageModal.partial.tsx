import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AppWindow, ArrowLeft, Check, Eye, GitMerge, Loader2, Search } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import PageThumbnail from '@/components/workflowPage/PageThumbnail';
import PageTemplatePreview from '@/components/workflowPage/PageTemplatePreview';
import { useWorkflows } from '@/api/modules/workflows';
import { useCreateWorkflowPage } from '@/api/modules/workflow-pages';
import { usePageTemplates } from '@/api/modules/templates';
import type { TPageBlock, TPageContent } from '@/types/workflow-page.type';
import paths from '@/Routes/paths';

type Props = {
	ws: string;
	isOpen: boolean;
	onClose: () => void;
	/** Opened from a workflow: that workflow is picked already. */
	workflowId?: string;
	/** Opened from a template: that layout is picked already. */
	templateId?: string;
};

const sketchBlock = (id: string, type: TPageBlock['type'], props: object = {}) =>
	({ id, type, width: 'full', props }) as TPageBlock;

/** Only for the thumbnail of the default layout, which the server builds
 *  from the workflow when no template is picked. */
const DEFAULT_SKETCH: TPageContent = {
	theme: {
		accent: '#4f46e5',
		appearance: 'light',
		background: 'soft',
		radius: 'lg',
		font: 'sans',
		width: 'medium',
		logo_url: null,
		cover_url: null,
		show_branding: true,
	},
	blocks: [
		sketchBlock('h', 'heading', { level: 1, align: 'left' }),
		sketchBlock('f1', 'field'),
		sketchBlock('f2', 'field'),
		sketchBlock('s', 'submit', { align: 'left' }),
		sketchBlock('d', 'divider'),
		sketchBlock('st', 'status'),
		sketchBlock('o', 'output'),
	],
};

const ALL = 'all';
const OWN = 'own';

const LayoutCard = ({
	name,
	tag,
	content,
	active,
	onSelect,
	onPreview,
}: {
	name: string;
	tag: string;
	content: TPageContent;
	active: boolean;
	onSelect: () => void;
	onPreview?: () => void;
}) => (
	<div className='group relative'>
		<button
			type='button'
			role='option'
			aria-selected={active}
			onClick={onSelect}
			className={`relative w-full overflow-hidden rounded-xl border text-left transition ${
				active
					? 'border-primary-500 ring-primary-400/40 ring-2'
					: 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20'
			}`}>
			<PageThumbnail content={content} className='h-28' />
			<div className='flex items-center gap-2 border-t border-zinc-200 bg-white px-2.5 py-2 dark:border-white/10 dark:bg-zinc-900'>
				<div className='min-w-0 flex-1'>
					<p className='truncate text-xs font-bold text-zinc-900 dark:text-white'>
						{name}
					</p>
					<p className='truncate text-[10px] text-zinc-500 dark:text-zinc-400'>{tag}</p>
				</div>
				{active && (
					<span className='bg-primary-400 text-primary-950 flex size-4 shrink-0 items-center justify-center rounded-full'>
						<Check size={10} strokeWidth={3} />
					</span>
				)}
			</div>
		</button>
		{onPreview && (
			<button
				type='button'
				onClick={onPreview}
				aria-label={`Preview ${name}`}
				className='absolute top-2 right-2 flex h-7 items-center gap-1 rounded-lg bg-zinc-950/75 px-2 text-[10px] font-bold text-white opacity-0 shadow-sm backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100'>
				<Eye size={12} />
				Preview
			</button>
		)}
	</div>
);

/**
 * Picks the workflow a new page runs and the layout it starts from. The
 * server lays the page out from the workflow's inputs and outputs (into the
 * template when one is picked) then the builder opens on it.
 */
const CreatePageModal = ({
	ws,
	isOpen,
	onClose,
	workflowId,
	templateId: initialTemplateId,
}: Props) => {
	const navigate = useNavigate();
	const { data: workflows, isLoading } = useWorkflows(ws);
	const { data: templates, isLoading: templatesLoading } = usePageTemplates(isOpen ? ws : '');
	const create = useCreateWorkflowPage(ws);
	const [query, setQuery] = useState('');
	const [selected, setSelected] = useState<string | null>(workflowId ?? null);
	const [templateId, setTemplateId] = useState<string | null>(initialTemplateId ?? null);
	const [name, setName] = useState('');
	const [category, setCategory] = useState(ALL);
	const [previewId, setPreviewId] = useState<string | null>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return (workflows ?? []).filter(
			(workflow) => !q || workflow.name.toLowerCase().includes(q),
		);
	}, [workflows, query]);

	// The workspace's own layouts first, then the built-in ones.
	const sortedTemplates = useMemo(
		() =>
			[...(templates ?? [])].sort(
				(a, b) => Number(a.workspace_id === null) - Number(b.workspace_id === null),
			),
		[templates],
	);

	const categories = useMemo(
		() =>
			Array.from(
				new Set(
					sortedTemplates
						.filter((template) => template.workspace_id === null && template.category)
						.map((template) => template.category as string),
				),
			).sort(),
		[sortedTemplates],
	);
	const hasOwn = sortedTemplates.some((template) => template.workspace_id !== null);

	const shownTemplates = sortedTemplates.filter((template) =>
		category === ALL
			? true
			: category === OWN
				? template.workspace_id !== null
				: template.workspace_id === null && template.category === category,
	);

	const previewed = sortedTemplates.find((template) => template.id === previewId);

	const submit = () => {
		if (!selected) return;
		create.mutate(
			{
				workflow_id: selected,
				name: name.trim() || undefined,
				template_id: templateId ?? undefined,
			},
			{ onSuccess: (page) => navigate(paths.editPage(ws, page.id)) },
		);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-400/10 text-primary-600 dark:text-primary-400 flex size-9 items-center justify-center rounded-xl'>
						<AppWindow size={16} />
					</div>
					<div>
						<p className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							New page
						</p>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							A form and a result, so anyone can use a workflow without opening it.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]'>
					<div className='space-y-4'>
						<div>
							<p className='mb-2 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Which workflow does it run?
							</p>
							<div className='relative mb-2'>
								<Search
									size={14}
									className='absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400'
								/>
								<input
									type='search'
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder='Search workflows…'
									aria-label='Search workflows'
									className='focus:border-primary-500 h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-xs outline-none dark:border-white/10 dark:bg-zinc-900'
								/>
							</div>
							<div
								role='listbox'
								aria-label='Workflows'
								className='h-72 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-1.5 dark:border-white/10'>
								{isLoading ? (
									<p className='p-3 text-xs text-zinc-400'>Loading workflows…</p>
								) : filtered.length === 0 ? (
									<p className='p-3 text-xs text-zinc-400'>No workflows match.</p>
								) : (
									filtered.map((workflow) => {
										const active = workflow.id === selected;
										return (
											<button
												key={workflow.id}
												type='button'
												role='option'
												aria-selected={active}
												onClick={() => setSelected(workflow.id)}
												className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
													active
														? 'bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-100'
														: 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
												}`}>
												<GitMerge
													size={14}
													className='shrink-0 opacity-60'
												/>
												<span className='min-w-0 flex-1 truncate text-xs font-semibold'>
													{workflow.name}
												</span>
												{workflow.status !== 'published' && (
													<span className='shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'>
														Not published
													</span>
												)}
											</button>
										);
									})
								)}
							</div>
						</div>
						<label className='block'>
							<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Page name
							</span>
							<input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='Defaults to the workflow’s name'
								maxLength={120}
								className='focus:border-primary-500 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs outline-none dark:border-white/10 dark:bg-zinc-900'
							/>
						</label>
					</div>

					<div>
						{previewed ? (
							<div>
								<div className='mb-2 flex items-center gap-2'>
									<button
										type='button'
										onClick={() => setPreviewId(null)}
										className='flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/[0.06]'>
										<ArrowLeft size={13} />
										Layouts
									</button>
									<p className='min-w-0 flex-1 truncate text-xs font-bold text-zinc-900 dark:text-white'>
										{previewed.name}
									</p>
									<button
										type='button'
										onClick={() => {
											setTemplateId(previewed.id);
											setPreviewId(null);
										}}
										className='bg-primary-400 text-primary-950 flex h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold'>
										<Check size={12} strokeWidth={3} />
										{templateId === previewed.id
											? 'Selected'
											: 'Use this layout'}
									</button>
								</div>
								{previewed.description && (
									<p className='mb-2 text-[11px] text-zinc-500 dark:text-zinc-400'>
										{previewed.description}
									</p>
								)}
								<div className='h-[372px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/10'>
									<PageTemplatePreview content={previewed.content} />
								</div>
							</div>
						) : (
							<>
								<p className='mb-2 text-xs font-bold text-zinc-700 dark:text-zinc-300'>
									Start from a layout
								</p>
								<div
									role='tablist'
									aria-label='Layout categories'
									className='no-scrollbar mb-2 flex gap-1 overflow-x-auto pb-0.5'>
									{[
										{ id: ALL, label: 'All' },
										...(hasOwn ? [{ id: OWN, label: 'Your templates' }] : []),
										...categories.map((c) => ({ id: c, label: c })),
									].map((chip) => (
										<button
											key={chip.id}
											type='button'
											role='tab'
											aria-selected={category === chip.id}
											onClick={() => setCategory(chip.id)}
											className={`h-6 shrink-0 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap transition ${
												category === chip.id
													? 'bg-primary-400 text-primary-950'
													: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:bg-white/10'
											}`}>
											{chip.label}
										</button>
									))}
								</div>
								<div
									role='listbox'
									aria-label='Layouts'
									className='grid max-h-[340px] grid-cols-2 gap-2.5 overflow-y-auto p-0.5 sm:grid-cols-3'>
									{category === ALL && (
										<LayoutCard
											name='Standard'
											tag='Built from the workflow'
											content={DEFAULT_SKETCH}
											active={templateId === null}
											onSelect={() => setTemplateId(null)}
										/>
									)}
									{shownTemplates.map((template) => (
										<LayoutCard
											key={template.id}
											name={template.name}
											tag={
												template.workspace_id === null
													? 'Built-in'
													: (template.category ?? 'Your template')
											}
											content={template.content}
											active={templateId === template.id}
											onSelect={() => setTemplateId(template.id)}
											onPreview={() => setPreviewId(template.id)}
										/>
									))}
									{templatesLoading &&
										Array.from({ length: 2 }, (_, i) => (
											<div
												key={i}
												className='h-[154px] animate-pulse rounded-xl bg-zinc-100 dark:bg-white/[0.04]'
											/>
										))}
								</div>
								<p className='mt-2 text-[11px] text-zinc-500 dark:text-zinc-400'>
									A layout’s fields and results are matched to the workflow’s
									inputs and outputs.
								</p>
							</>
						)}
					</div>
				</div>
				<div className='mt-5 flex justify-end gap-2'>
					<button
						type='button'
						onClick={onClose}
						className='h-10 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
						Cancel
					</button>
					<button
						type='button'
						onClick={submit}
						disabled={!selected || create.isPending}
						className='bg-primary-400 text-primary-950 flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'>
						{create.isPending && <Loader2 size={14} className='animate-spin' />}
						Create and open builder
					</button>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default CreatePageModal;
