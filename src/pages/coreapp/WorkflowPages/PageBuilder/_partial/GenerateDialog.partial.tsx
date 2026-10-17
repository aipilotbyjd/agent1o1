import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, TriangleAlert, Wand2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, notify } from '@/api/core';
import {
	WorkflowPageService,
	useWorkflowPageGeneration,
	workflowPageKeys,
} from '@/api/modules/workflow-pages';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import PageTemplatePreview from '@/components/workflowPage/PageTemplatePreview';
import { usePageBuilderStore } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';

const EXAMPLES = [
	'A landing page with a bold hero, three benefits and an FAQ',
	'Make it shorter and friendlier',
	'Put the form and the result side by side',
	'A dark, minimal internal tool',
	'Add a section explaining how it works',
];

const Elapsed = ({ since }: { since: number }) => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);
	return <span className='tabular-nums'>{Math.max(0, Math.round((now - since) / 1000))}s</span>;
};

/**
 * Asks AI to design the page (or the version being edited) from a
 * description, shows what it made, and applies it only if the member says
 * so. Applying saves the current draft as a version first and is one undo.
 */
const GenerateDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
	const { ws, page, fields, flush } = usePageBuilder();
	const qc = useQueryClient();
	const variant = usePageBuilderStore((store) => store.variant);
	const [prompt, setPrompt] = useState('');
	const [keepTheme, setKeepTheme] = useState(true);
	const [generationId, setGenerationId] = useState<string | null>(null);
	const [startedAt, setStartedAt] = useState(0);
	const [starting, setStarting] = useState(false);
	const [applying, setApplying] = useState(false);
	const { data: generation } = useWorkflowPageGeneration(ws, page.id, generationId);

	const start = async () => {
		const trimmed = prompt.trim();
		if (trimmed.length < 3 || starting) return;
		setStarting(true);
		try {
			const created = await WorkflowPageService.generate(ws, page.id, {
				prompt: trimmed,
				variant,
				keep_theme: keepTheme,
			});
			qc.setQueryData(workflowPageKeys.generation(ws, page.id, created.id), created);
			setStartedAt(Date.now());
			setGenerationId(created.id);
		} catch (error) {
			notify.error(ApiError.is(error) ? error.message : 'Could not start the design.');
		} finally {
			setStarting(false);
		}
	};

	const apply = async () => {
		if (!generation?.content) return;
		setApplying(true);
		try {
			if (!(await flush())) return;
			await WorkflowPageService.saveVersion(ws, page.id, {
				kind: 'before_generation',
				label: `Before AI: ${generation.prompt.slice(0, 100)}`,
			});
			void qc.invalidateQueries({ queryKey: workflowPageKeys.versions(ws, page.id) });
			const content = generation.content;
			usePageBuilderStore.getState().change(() => content);
			usePageBuilderStore.getState().select(null);
			notify.success('Applied. Undo with ⌘Z, or restore the earlier version from History.');
			reset();
			onClose();
		} finally {
			setApplying(false);
		}
	};

	const reset = () => {
		setGenerationId(null);
		setStartedAt(0);
	};

	const working =
		!!generationId &&
		(!generation || generation.status === 'pending' || generation.status === 'running');

	return (
		<Modal
			isOpen={open}
			setIsOpen={(next) => !next && onClose()}
			size={generation?.status === 'completed' ? 'xl' : 'lg'}>
			<ModalHeader setIsOpen={(next) => !next && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'>
						<Sparkles size={16} />
					</div>
					<div>
						<p className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Design with AI
						</p>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							{page.variant.exists
								? `Works on version ${variant.toUpperCase()}. `
								: ''}
							Uses your workflow’s real inputs and outputs. You review it before
							anything changes.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{!generationId ? (
					<div className='space-y-4'>
						<textarea
							autoFocus
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={(e) =>
								e.key === 'Enter' && (e.metaKey || e.ctrlKey) && void start()
							}
							rows={4}
							maxLength={4000}
							placeholder='Describe the page you want, or what to change about this one…'
							className='focus:border-primary-500 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none dark:border-white/10 dark:bg-zinc-900'
						/>
						<div className='flex flex-wrap gap-1.5'>
							{EXAMPLES.map((example) => (
								<button
									key={example}
									type='button'
									onClick={() => setPrompt(example)}
									className='rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-violet-500/10'>
									{example}
								</button>
							))}
						</div>
						<div className='flex items-center justify-between gap-3'>
							<label className='flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300'>
								<input
									type='checkbox'
									checked={keepTheme}
									onChange={(e) => setKeepTheme(e.target.checked)}
									className='accent-violet-600'
								/>
								Keep my colours and fonts
							</label>
							<button
								type='button'
								onClick={() => void start()}
								disabled={prompt.trim().length < 3 || starting}
								className='flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-xs font-bold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50'>
								{starting ? (
									<Loader2 size={14} className='animate-spin' />
								) : (
									<Wand2 size={14} />
								)}
								Design it
							</button>
						</div>
						<p className='text-[11px] text-zinc-400'>Uses AI credits. ⌘↵ to start.</p>
					</div>
				) : working ? (
					<div className='flex flex-col items-center gap-3 py-12 text-center'>
						<Loader2 size={26} className='animate-spin text-violet-600' />
						<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
							Designing your page…
						</p>
						<p className='max-w-sm text-xs text-zinc-500'>
							This usually takes 10–60 seconds. <Elapsed since={startedAt} /> so far:
							you can close this and keep working; it’ll be here when you come back.
						</p>
					</div>
				) : generation?.status === 'failed' ? (
					<div className='flex flex-col items-center gap-3 py-10 text-center'>
						<TriangleAlert size={24} className='text-amber-500' />
						<p className='max-w-sm text-sm text-zinc-700 dark:text-zinc-200'>
							{generation.error}
						</p>
						<button
							type='button'
							onClick={reset}
							className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-4 text-xs font-semibold dark:border-white/10'>
							<RefreshCw size={13} /> Try again
						</button>
					</div>
				) : generation?.content ? (
					<div className='space-y-3'>
						<div className='flex flex-wrap items-center gap-2'>
							<p className='min-w-0 flex-1 truncate text-xs text-zinc-500'>
								“
								<span className='font-semibold text-zinc-800 dark:text-zinc-100'>
									{generation.prompt}
								</span>
								”
							</p>
							<button
								type='button'
								onClick={reset}
								className='h-9 rounded-lg px-3 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-white/[0.06]'>
								Discard
							</button>
							<button
								type='button'
								onClick={() => {
									setPrompt(generation.prompt);
									reset();
								}}
								className='flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-semibold dark:border-white/10'>
								<RefreshCw size={13} /> Change the request
							</button>
							<button
								type='button'
								onClick={() => void apply()}
								disabled={applying}
								className='flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50'>
								{applying ? (
									<Loader2 size={13} className='animate-spin' />
								) : (
									<Sparkles size={13} />
								)}
								Use this design
							</button>
						</div>
						<div className='max-h-[65vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/10'>
							<PageTemplatePreview content={generation.content} fields={fields} />
						</div>
					</div>
				) : null}
			</ModalBody>
		</Modal>
	);
};

export default GenerateDialog;
