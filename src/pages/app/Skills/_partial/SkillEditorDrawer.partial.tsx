import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Trash2, FileText, Code2, Sparkles } from 'lucide-react';
import {
	useAgentSkill,
	useCreateAgentSkill,
	useUpdateAgentSkill,
	useAddAgentSkillReference,
	useRemoveAgentSkillReference,
	useAddAgentSkillScript,
	useRemoveAgentSkillScript,
	useGenerateSkill,
} from '@/api/modules/agents';
import { SKILL_CATEGORIES, SKILL_ICON_OPTIONS, SKILL_COLOR_OPTIONS } from '../_helper/skills.constants';

interface SkillEditorDrawerProps {
	ws: string;
	isOpen: boolean;
	skillId: string | null;
	onClose: () => void;
}

const emptyForm = {
	name: '',
	description: '',
	category: 'General',
	icon: 'Puzzle',
	color: SKILL_COLOR_OPTIONS[0],
	is_shared: false,
	instructions: '',
};

const SkillEditorDrawer = ({ ws, isOpen, skillId, onClose }: SkillEditorDrawerProps) => {
	const [createdSkillId, setCreatedSkillId] = useState<string | null>(null);
	const activeSkillId = skillId ?? createdSkillId;

	const { data: skillDetail } = useAgentSkill(ws, activeSkillId ?? '');
	const createMutation = useCreateAgentSkill(ws);
	const updateMutation = useUpdateAgentSkill(ws);
	const addReferenceMutation = useAddAgentSkillReference(ws, activeSkillId ?? '');
	const removeReferenceMutation = useRemoveAgentSkillReference(ws, activeSkillId ?? '');
	const addScriptMutation = useAddAgentSkillScript(ws, activeSkillId ?? '');
	const removeScriptMutation = useRemoveAgentSkillScript(ws, activeSkillId ?? '');
	const generateMutation = useGenerateSkill(ws);

	const [form, setForm] = useState(emptyForm);
	const [generatePrompt, setGeneratePrompt] = useState('');
	const [newReference, setNewReference] = useState({ title: '', content: '' });
	const [newScript, setNewScript] = useState({
		name: '',
		description: '',
		language: 'javascript' as 'php' | 'javascript',
		code: '',
	});

	useEffect(() => {
		if (!isOpen) {
			setCreatedSkillId(null);
			setForm(emptyForm);
			setNewReference({ title: '', content: '' });
			setGeneratePrompt('');
			return;
		}
		if (skillDetail) {
			setForm({
				name: skillDetail.name,
				description: skillDetail.description ?? '',
				category: skillDetail.category ?? 'General',
				icon: skillDetail.icon ?? 'Puzzle',
				color: skillDetail.color ?? SKILL_COLOR_OPTIONS[0],
				is_shared: skillDetail.is_shared,
				instructions: skillDetail.instructions,
			});
		} else if (!skillId) {
			setForm(emptyForm);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, skillId, skillDetail?.id]);

	if (!isOpen) return null;

	const isEdit = !!activeSkillId;
	const isSaving = createMutation.isPending || updateMutation.isPending;

	const handleSave = () => {
		if (!form.name.trim() || !form.instructions.trim()) return;

		const body = {
			name: form.name.trim(),
			description: form.description.trim() || null,
			category: form.category,
			icon: form.icon,
			color: form.color,
			is_shared: form.is_shared,
			instructions: form.instructions,
		};

		if (activeSkillId) {
			updateMutation.mutate({ skillId: activeSkillId, body }, { onSuccess: () => onClose() });
		} else {
			createMutation.mutate(body, {
				onSuccess: (created) => setCreatedSkillId(created.id),
			});
		}
	};

	const handleGenerate = () => {
		if (!generatePrompt.trim()) return;
		generateMutation.mutate(
			{ prompt: generatePrompt.trim() },
			{
				onSuccess: (draft) =>
					setForm((f) => ({
						...f,
						name: draft.name,
						description: draft.description ?? '',
						category: draft.category,
						instructions: draft.instructions,
					})),
			},
		);
	};

	const handleAddReference = () => {
		if (!newReference.title.trim() || !activeSkillId) return;
		addReferenceMutation.mutate(
			{ title: newReference.title.trim(), content: newReference.content, sort_order: 0 },
			{ onSuccess: () => setNewReference({ title: '', content: '' }) },
		);
	};

	const handleAddScript = () => {
		if (!newScript.name.trim() || !newScript.code.trim() || !activeSkillId) return;
		addScriptMutation.mutate(
			{ ...newScript, is_enabled: true },
			{
				onSuccess: () =>
					setNewScript({ name: '', description: '', language: 'javascript', code: '' }),
			},
		);
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
			/>
			<motion.div
				initial={{ x: '100%' }}
				animate={{ x: 0 }}
				exit={{ x: '100%' }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='fixed top-0 right-0 z-50 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border-main bg-bg-card shadow-2xl dark:border-border-main dark:bg-bg-card'>
				<div className='flex items-center justify-between border-b border-border-main px-6 py-5 dark:border-border-main'>
					<div>
						<h2 className='text-lg font-black tracking-tight text-slate-900 dark:text-white'>
							{isEdit ? 'Edit Skill' : 'Create Skill'}
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							{isEdit
								? 'Update instructions, references, and scripts.'
								: 'Save the base skill first, then add references and scripts.'}
						</p>
					</div>
					<button
						onClick={onClose}
						className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-900'>
						<X size={16} />
					</button>
				</div>

				<div className='flex-1 space-y-5 px-6 py-5'>
					{!isEdit && (
						<div className='rounded-xl border border-dashed border-primary-500/30 bg-primary-400/5 p-3'>
							<div className='mb-2 flex items-center gap-1.5'>
								<Sparkles size={13} className='text-primary-500' />
								<h3 className='text-xs font-black text-slate-700 dark:text-zinc-300'>
									Generate with AI
								</h3>
							</div>
							<textarea
								value={generatePrompt}
								onChange={(e) => setGeneratePrompt(e.target.value)}
								rows={2}
								placeholder='e.g. Summarize weekly sales data and post a recap to Slack'
								className='block w-full resize-none rounded-lg border border-border-main bg-bg-card px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
							/>
							<button
								onClick={handleGenerate}
								disabled={generateMutation.isPending || !generatePrompt.trim()}
								className='mt-2 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary-400 text-[11px] font-black text-primary-950 transition-all hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
								<Sparkles size={12} />
								{generateMutation.isPending ? 'Generating…' : 'Generate'}
							</button>
						</div>
					)}

					<div>
						<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
							Name
						</label>
						<input
							type='text'
							value={form.name}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							placeholder='e.g. Competitor Research'
							className='block h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-100'
						/>
					</div>

					<div>
						<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
							Description
						</label>
						<textarea
							value={form.description}
							onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
							rows={2}
							placeholder='Short summary shown on the skill card'
							className='block w-full resize-none rounded-xl border border-border-main bg-bg-main px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-100'
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
								Category
							</label>
							<select
								value={form.category}
								onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
								className='block h-10 w-full rounded-xl border border-border-main bg-bg-main px-3 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-100'>
								{SKILL_CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
								Visibility
							</label>
							<button
								type='button'
								onClick={() => setForm((f) => ({ ...f, is_shared: !f.is_shared }))}
								className={`flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-colors ${
									form.is_shared
										? 'border-primary-500/30 bg-primary-400/10 text-primary-600 dark:text-primary-400'
										: 'border-border-main bg-bg-main text-slate-500 dark:bg-zinc-950/40 dark:text-zinc-400'
								}`}>
								{form.is_shared ? 'Shared workspace-wide' : 'Personal'}
							</button>
						</div>
					</div>

					<div>
						<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
							Icon
						</label>
						<div className='flex flex-wrap gap-2'>
							{SKILL_ICON_OPTIONS.map(({ name, Icon }) => (
								<button
									key={name}
									type='button'
									onClick={() => setForm((f) => ({ ...f, icon: name }))}
									className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
										form.icon === name
											? 'border-primary-500 bg-primary-400/10 text-primary-600 dark:text-primary-400'
											: 'border-border-main text-slate-400 dark:border-border-main dark:text-zinc-500'
									}`}>
									<Icon size={15} />
								</button>
							))}
						</div>
					</div>

					<div>
						<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
							Color
						</label>
						<div className='flex flex-wrap gap-2'>
							{SKILL_COLOR_OPTIONS.map((color) => (
								<button
									key={color}
									type='button'
									onClick={() => setForm((f) => ({ ...f, color }))}
									style={{ backgroundColor: color }}
									className={`h-8 w-8 cursor-pointer rounded-xl transition-all ${
										form.color === color
											? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950'
											: ''
									}`}
								/>
							))}
						</div>
					</div>

					<div>
						<label className='mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300'>
							Instructions
						</label>
						<textarea
							value={form.instructions}
							onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
							rows={6}
							placeholder='What should an agent do when this skill is attached?'
							className='block w-full resize-none rounded-xl border border-border-main bg-bg-main px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-zinc-950/40 dark:text-zinc-100'
						/>
					</div>

					<button
						onClick={handleSave}
						disabled={isSaving || !form.name.trim() || !form.instructions.trim()}
						className='flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-400 text-xs font-black text-primary-950 shadow-md shadow-primary-500/10 transition-all hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
						{isEdit ? 'Save Changes' : 'Create Skill'}
					</button>

					{activeSkillId && (
						<>
							{/* References */}
							<div className='border-t border-border-main pt-5 dark:border-border-main'>
								<div className='mb-2.5 flex items-center gap-1.5'>
									<FileText size={13} className='text-primary-500' />
									<h3 className='text-xs font-black text-slate-700 dark:text-zinc-300'>
										References
									</h3>
								</div>

								<div className='mb-3 space-y-2'>
									{(skillDetail?.references ?? []).map((ref) => (
										<div
											key={ref.id}
											className='flex items-start justify-between gap-2 rounded-xl border border-border-main bg-bg-main px-3 py-2 dark:border-border-main dark:bg-zinc-950/40'>
											<div>
												<p className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
													{ref.title}
												</p>
												<p className='mt-0.5 line-clamp-2 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
													{ref.content}
												</p>
											</div>
											<button
												onClick={() => removeReferenceMutation.mutate(ref.id)}
												className='shrink-0 cursor-pointer text-slate-300 hover:text-rose-500 dark:text-zinc-600'>
												<Trash2 size={13} />
											</button>
										</div>
									))}
								</div>

								<div className='space-y-2 rounded-xl border border-dashed border-border-main p-3 dark:border-border-main'>
									<input
										type='text'
										placeholder='Reference title'
										value={newReference.title}
										onChange={(e) =>
											setNewReference((r) => ({ ...r, title: e.target.value }))
										}
										className='block h-8 w-full rounded-lg border border-border-main bg-bg-card px-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
									/>
									<textarea
										placeholder='Reference content'
										rows={2}
										value={newReference.content}
										onChange={(e) =>
											setNewReference((r) => ({ ...r, content: e.target.value }))
										}
										className='block w-full resize-none rounded-lg border border-border-main bg-bg-card px-2.5 py-1.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
									/>
									<button
										onClick={handleAddReference}
										disabled={!newReference.title.trim()}
										className='flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-main text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-main dark:text-zinc-300 dark:hover:bg-zinc-900'>
										<Plus size={12} /> Add reference
									</button>
								</div>
							</div>

							{/* Scripts */}
							<div className='border-t border-border-main pt-5 dark:border-border-main'>
								<div className='mb-2.5 flex items-center gap-1.5'>
									<Code2 size={13} className='text-primary-500' />
									<h3 className='text-xs font-black text-slate-700 dark:text-zinc-300'>
										Scripts
									</h3>
								</div>

								<div className='mb-3 space-y-2'>
									{(skillDetail?.scripts ?? []).map((script) => (
										<div
											key={script.id}
											className='flex items-start justify-between gap-2 rounded-xl border border-border-main bg-bg-main px-3 py-2 dark:border-border-main dark:bg-zinc-950/40'>
											<div>
												<p className='text-xs font-bold text-slate-800 dark:text-zinc-200'>
													{script.name}{' '}
													<span className='ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
														{script.language}
													</span>
												</p>
												<p className='mt-0.5 line-clamp-2 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
													{script.description}
												</p>
											</div>
											<button
												onClick={() => removeScriptMutation.mutate(script.id)}
												className='shrink-0 cursor-pointer text-slate-300 hover:text-rose-500 dark:text-zinc-600'>
												<Trash2 size={13} />
											</button>
										</div>
									))}
								</div>

								<div className='space-y-2 rounded-xl border border-dashed border-border-main p-3 dark:border-border-main'>
									<div className='flex gap-2'>
										<input
											type='text'
											placeholder='Script name'
											value={newScript.name}
											onChange={(e) =>
												setNewScript((s) => ({ ...s, name: e.target.value }))
											}
											className='block h-8 w-full rounded-lg border border-border-main bg-bg-card px-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
										/>
										<select
											value={newScript.language}
											onChange={(e) =>
												setNewScript((s) => ({
													...s,
													language: e.target.value as 'php' | 'javascript',
												}))
											}
											className='block h-8 shrink-0 rounded-lg border border-border-main bg-bg-card px-2 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'>
											<option value='javascript'>JS</option>
											<option value='php'>PHP</option>
										</select>
									</div>
									<input
										type='text'
										placeholder='Short description'
										value={newScript.description}
										onChange={(e) =>
											setNewScript((s) => ({ ...s, description: e.target.value }))
										}
										className='block h-8 w-full rounded-lg border border-border-main bg-bg-card px-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
									/>
									<textarea
										placeholder='Code'
										rows={3}
										value={newScript.code}
										onChange={(e) =>
											setNewScript((s) => ({ ...s, code: e.target.value }))
										}
										className='block w-full resize-none rounded-lg border border-border-main bg-bg-card px-2.5 py-1.5 font-mono text-[11px] font-semibold text-slate-900 outline-none focus:border-primary-500/80 dark:border-border-main dark:bg-bg-card dark:text-zinc-100'
									/>
									<button
										onClick={handleAddScript}
										disabled={!newScript.name.trim() || !newScript.code.trim()}
										className='flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-border-main text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-main dark:text-zinc-300 dark:hover:bg-zinc-900'>
										<Plus size={12} /> Add script
									</button>
								</div>
							</div>
						</>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default SkillEditorDrawer;
