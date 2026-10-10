import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
	X,
	Plus,
	Trash2,
	FileText,
	Code2,
	Pencil,
	Loader2,
	Sparkles,
	FolderGit2,
	ExternalLink,
} from 'lucide-react';
import type {
	TAgentSkill,
	TAgentSkillReference,
	TAgentSkillScript,
	TSkillDraftReference,
	TSkillDraftScript,
} from '@/types/agent-skill.type';
import { notify } from '@/api/core';
import { useModelCatalog } from '@/api/modules/catalog';
import {
	useAgentSkill,
	useCreateAgentSkill,
	useDraftAgentSkill,
	useUpdateAgentSkill,
	useSkillReferences,
	useCreateSkillReference,
	useUpdateSkillReference,
	useDeleteSkillReference,
	useSkillScripts,
	useCreateSkillScript,
	useUpdateSkillScript,
	useDeleteSkillScript,
} from '@/api/modules/agent-skills';
import {
	SKILL_CATEGORIES,
	SKILL_SCRIPT_LANGUAGES,
	SKILL_ICON_OPTIONS,
	SKILL_COLOR_OPTIONS,
} from '../_helper/skills.constants';

interface ISkillEditorDrawerProps {
	ws: string;
	isOpen: boolean;
	skillId: string | null;
	onClose: () => void;
	onCreated?: (skill: TAgentSkill) => void;
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

const emptyScript = {
	name: '',
	description: '',
	language: 'javascript' as (typeof SKILL_SCRIPT_LANGUAGES)[number],
	code: '',
};

const SkillEditorDrawer = ({
	ws,
	isOpen,
	skillId,
	onClose,
	onCreated,
}: ISkillEditorDrawerProps) => {
	const [createdSkillId, setCreatedSkillId] = useState<string | null>(null);
	const activeSkillId = skillId ?? createdSkillId;

	const { data: skillDetail } = useAgentSkill(ws, activeSkillId ?? '');
	const { data: references } = useSkillReferences(ws, activeSkillId ?? '');
	const { data: scripts } = useSkillScripts(ws, activeSkillId ?? '');
	const createMutation = useCreateAgentSkill(ws);
	const draftMutation = useDraftAgentSkill(ws);
	const { data: modelCatalog } = useModelCatalog(ws);
	const updateMutation = useUpdateAgentSkill(ws);
	const addReferenceMutation = useCreateSkillReference(ws, activeSkillId ?? '');
	const updateReferenceMutation = useUpdateSkillReference(ws, activeSkillId ?? '');
	const removeReferenceMutation = useDeleteSkillReference(ws, activeSkillId ?? '');
	const addScriptMutation = useCreateSkillScript(ws, activeSkillId ?? '');
	const updateScriptMutation = useUpdateSkillScript(ws, activeSkillId ?? '');
	const removeScriptMutation = useDeleteSkillScript(ws, activeSkillId ?? '');

	const [form, setForm] = useState(emptyForm);
	// A generated draft's extras, held until the skill is created with them.
	const [generatePrompt, setGeneratePrompt] = useState('');
	const [generateModelId, setGenerateModelId] = useState('');
	const [draftTags, setDraftTags] = useState<string[]>([]);
	const [draftReferences, setDraftReferences] = useState<TSkillDraftReference[]>([]);
	const [draftScripts, setDraftScripts] = useState<TSkillDraftScript[]>([]);

	const modelOptions = useMemo(() => modelCatalog ?? [], [modelCatalog]);
	const selectedModelId =
		generateModelId || (modelOptions.find((m) => m.is_available) ?? modelOptions[0])?.id || '';
	const [newReference, setNewReference] = useState({ title: '', content: '' });
	const [newScript, setNewScript] = useState(emptyScript);
	// The one reference / script being edited in place, if any.
	const [editingReference, setEditingReference] = useState<{
		id: string;
		title: string;
		content: string;
	} | null>(null);
	const [editingScript, setEditingScript] = useState<
		({ id: string; is_enabled: boolean } & typeof emptyScript) | null
	>(null);

	const resetKey = `${isOpen}:${skillId ?? ''}:${skillDetail?.id ?? ''}`;
	const [syncedResetKey, setSyncedResetKey] = useState<string | null>(null);
	if (syncedResetKey !== resetKey) {
		setSyncedResetKey(resetKey);
		if (!isOpen) {
			setCreatedSkillId(null);
			setForm(emptyForm);
			setGeneratePrompt('');
			setDraftTags([]);
			setDraftReferences([]);
			setDraftScripts([]);
			setNewReference({ title: '', content: '' });
			setNewScript(emptyScript);
			setEditingReference(null);
			setEditingScript(null);
		} else if (skillDetail) {
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
	}

	if (!isOpen) return null;

	const isEdit = !!activeSkillId;
	// One-way imports stay read-only; two-way skills can be edited.
	const isLinked = isEdit && !!skillDetail?.skill_source_id;
	const isSynced = isLinked && !skillDetail?.source_two_way;
	const isSaving = createMutation.isPending || updateMutation.isPending;

	// Fills the form from a generated draft; nothing is saved until Create.
	const handleGenerate = async () => {
		const prompt = generatePrompt.trim();
		if (!prompt || draftMutation.isPending) return;
		if (!selectedModelId) {
			notify.error('No model is available to generate the skill.');
			return;
		}
		try {
			const draft = await draftMutation.mutateAsync({
				prompt,
				model_catalog_id: selectedModelId,
			});
			setForm((f) => ({
				...f,
				name: draft.name,
				description: draft.description,
				category: draft.category,
				icon: draft.icon,
				color: draft.color,
				instructions: draft.instructions,
			}));
			setDraftTags(draft.tags);
			setDraftReferences(draft.references);
			setDraftScripts(draft.scripts);
			notify.success('Skill drafted. Review it, then create it.');
		} catch {
			// The mutation's own error toast has already told the user.
		}
	};

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
			const { category, icon, color, is_shared } = body;
			updateMutation.mutate(
				{ id: activeSkillId, body: isSynced ? { category, icon, color, is_shared } : body },
				{ onSuccess: () => onClose() },
			);
		} else {
			createMutation.mutate(
				{ ...body, tags: draftTags, references: draftReferences, scripts: draftScripts },
				{
					onSuccess: (created) => {
						setDraftTags([]);
						setDraftReferences([]);
						setDraftScripts([]);
						setCreatedSkillId(created.id);
						onCreated?.(created);
					},
				},
			);
		}
	};

	const handleAddReference = () => {
		if (!newReference.title.trim() || !newReference.content.trim()) return;
		if (!activeSkillId || addReferenceMutation.isPending) return;
		addReferenceMutation.mutate(
			{ title: newReference.title.trim(), content: newReference.content, sort_order: 0 },
			{ onSuccess: () => setNewReference({ title: '', content: '' }) },
		);
	};

	const startEditReference = (ref: TAgentSkillReference) =>
		setEditingReference({ id: ref.id, title: ref.title, content: ref.content });

	const handleSaveReference = () => {
		if (!editingReference || updateReferenceMutation.isPending) return;
		if (!editingReference.title.trim() || !editingReference.content.trim()) return;
		updateReferenceMutation.mutate(
			{
				id: editingReference.id,
				body: { title: editingReference.title.trim(), content: editingReference.content },
			},
			{ onSuccess: () => setEditingReference(null) },
		);
	};

	const startEditScript = (script: TAgentSkillScript) =>
		setEditingScript({
			id: script.id,
			name: script.name,
			description: script.description ?? '',
			language: (SKILL_SCRIPT_LANGUAGES as readonly string[]).includes(script.language)
				? (script.language as (typeof SKILL_SCRIPT_LANGUAGES)[number])
				: 'javascript',
			code: script.code,
			is_enabled: script.is_enabled,
		});

	const handleSaveScript = () => {
		if (!editingScript || updateScriptMutation.isPending) return;
		if (!editingScript.name.trim() || !editingScript.code.trim()) return;
		const { id, ...body } = editingScript;
		updateScriptMutation.mutate(
			{ id, body: { ...body, name: body.name.trim() } },
			{ onSuccess: () => setEditingScript(null) },
		);
	};

	const handleAddScript = () => {
		if (!newScript.name.trim() || !newScript.code.trim() || !activeSkillId) return;
		if (addScriptMutation.isPending) return;
		addScriptMutation.mutate(
			{ ...newScript, is_enabled: true },
			{ onSuccess: () => setNewScript(emptyScript) },
		);
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className='fixed inset-0 z-60 bg-black/40 backdrop-blur-sm'
			/>
			<motion.div
				initial={{ x: '100%' }}
				animate={{ x: 0 }}
				exit={{ x: '100%' }}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
				className='fixed top-0 right-0 z-65 flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950'>
				<div className='flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800'>
					<div>
						<h2 className='text-lg font-black tracking-tight text-zinc-900 dark:text-white'>
							{isEdit ? 'Edit Skill' : 'Create Skill'}
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							{isSynced
								? 'Synced from GitHub. Edit it in the repository.'
								: isEdit
									? 'Update instructions, references, and scripts.'
									: 'Generate it from a description, or write it yourself.'}
						</p>
					</div>
					<button
						aria-label='Close'
						onClick={onClose}
						className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-900'>
						<X size={16} />
					</button>
				</div>

				<div className='flex-1 space-y-5 px-6 py-5'>
					{isLinked && (
						<div className='flex items-start gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
							<FolderGit2 size={15} className='text-primary-500 mt-0.5 shrink-0' />
							<div className='min-w-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400'>
								{!isSynced ? (
									<p>
										Two-way sync is enabled. Saved instructions, references and
										scripts will be pushed to GitHub on the next sync. Conflicts
										pause syncing for review.
									</p>
								) : (
									<p>
										Its name, description, instructions, references and scripts
										come from{' '}
										<code className='font-mono'>
											{skillDetail?.source_path || 'the repository root'}
										</code>{' '}
										and update on every sync. You can still change its category,
										look and visibility. Use “Make editable copy” from the skill
										menu to customize its content.
									</p>
								)}
								{skillDetail?.source_url && (
									<a
										href={skillDetail.source_url}
										target='_blank'
										rel='noreferrer'
										className='text-primary-600 dark:text-primary-400 mt-1.5 inline-flex items-center gap-1 font-bold hover:underline'>
										Open in GitHub <ExternalLink size={11} />
									</a>
								)}
							</div>
						</div>
					)}

					{!isLinked && skillDetail?.origin_url && (
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>
							Independent skill.{' '}
							<a
								href={skillDetail.origin_url}
								target='_blank'
								rel='noreferrer'
								className='text-primary-600 dark:text-primary-400 font-semibold'>
								View source on GitHub
							</a>
						</p>
					)}
					{!isEdit && (
						<div className='border-primary-500/20 bg-primary-400/5 space-y-2.5 rounded-2xl border p-4'>
							<div className='flex items-center gap-1.5'>
								<Sparkles size={13} className='text-primary-500' />
								<h3 className='text-xs font-black text-zinc-700 dark:text-zinc-300'>
									Generate with AI
								</h3>
							</div>
							<textarea
								aria-label='Describe the skill'
								value={generatePrompt}
								onChange={(e) => setGeneratePrompt(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
										e.preventDefault();
										void handleGenerate();
									}
								}}
								rows={3}
								maxLength={4000}
								placeholder='Describe the process, e.g. "How we triage support tickets: severity rules, escalation, and the reply template"'
								className='focus:border-primary-500/80 block w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
							/>
							<div className='flex gap-2'>
								<select
									aria-label='Model'
									value={selectedModelId}
									onChange={(e) => setGenerateModelId(e.target.value)}
									className='focus:border-primary-500/80 block h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'>
									{modelOptions.map((model) => (
										<option
											key={model.id}
											value={model.id}
											disabled={!model.is_available}>
											{model.display_name}
										</option>
									))}
								</select>
								<button
									type='button'
									onClick={() => void handleGenerate()}
									disabled={!generatePrompt.trim() || draftMutation.isPending}
									className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 text-[11px] font-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
									{draftMutation.isPending ? (
										<Loader2 size={12} className='animate-spin' />
									) : (
										<Sparkles size={12} />
									)}
									{draftMutation.isPending ? 'Generating…' : 'Generate'}
								</button>
							</div>
						</div>
					)}

					<div>
						<label
							htmlFor='skilleditordrawer-name'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Name
						</label>
						<input
							id='skilleditordrawer-name'
							aria-label='e.g. Competitor Research'
							type='text'
							value={form.name}
							readOnly={isSynced}
							onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
							placeholder='e.g. Competitor Research'
							className='focus:border-primary-500/80 block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
						/>
					</div>

					<div>
						<label
							htmlFor='skilleditordrawer-description'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Description
						</label>
						<textarea
							id='skilleditordrawer-description'
							aria-label='Short summary shown on the skill card'
							value={form.description}
							readOnly={isSynced}
							onChange={(e) =>
								setForm((f) => ({ ...f, description: e.target.value }))
							}
							rows={2}
							placeholder='Short summary shown on the skill card'
							className='focus:border-primary-500/80 block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div>
							<label
								htmlFor='skilleditordrawer-category'
								className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Category
							</label>
							<select
								id='skilleditordrawer-category'
								value={form.category}
								onChange={(e) =>
									setForm((f) => ({ ...f, category: e.target.value }))
								}
								className='focus:border-primary-500/80 block h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'>
								{SKILL_CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div>
							<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
								Visibility
							</span>
							<button
								type='button'
								onClick={() => setForm((f) => ({ ...f, is_shared: !f.is_shared }))}
								className={`flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-colors ${
									form.is_shared
										? 'border-primary-500/30 bg-primary-400/10 text-primary-600 dark:text-primary-400'
										: 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400'
								}`}>
								{form.is_shared ? 'Shared workspace-wide' : 'Personal'}
							</button>
						</div>
					</div>

					<div>
						<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Icon
						</span>
						<div className='flex flex-wrap gap-2'>
							{SKILL_ICON_OPTIONS.map(({ name, Icon }) => (
								<button
									aria-label={name}
									aria-pressed={form.icon === name}
									key={name}
									type='button'
									onClick={() => setForm((f) => ({ ...f, icon: name }))}
									className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
										form.icon === name
											? 'border-primary-500 bg-primary-400/10 text-primary-600 dark:text-primary-400'
											: 'border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500'
									}`}>
									<Icon size={15} />
								</button>
							))}
						</div>
					</div>

					<div>
						<span className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Color
						</span>
						<div className='flex flex-wrap gap-2'>
							{SKILL_COLOR_OPTIONS.map((color) => (
								<button
									key={color}
									type='button'
									aria-label={`Color ${color}`}
									aria-pressed={form.color === color}
									onClick={() => setForm((f) => ({ ...f, color }))}
									style={{ backgroundColor: color }}
									className={`h-8 w-8 cursor-pointer rounded-xl transition-all ${
										form.color === color
											? 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-zinc-950'
											: ''
									}`}
								/>
							))}
						</div>
					</div>

					<div>
						<label
							htmlFor='skilleditordrawer-instructions'
							className='mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300'>
							Instructions
						</label>
						<textarea
							id='skilleditordrawer-instructions'
							aria-label='What should an agent do when this skill is attached?'
							value={form.instructions}
							readOnly={isSynced}
							onChange={(e) =>
								setForm((f) => ({ ...f, instructions: e.target.value }))
							}
							rows={6}
							placeholder='What should an agent do when this skill is attached?'
							className='focus:border-primary-500/80 block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
						/>
					</div>

					{!isEdit && draftReferences.length > 0 && (
						<DraftItemList
							icon={<FileText size={13} className='text-primary-500' />}
							title='References'
							items={draftReferences.map((r) => ({
								label: r.title,
								detail: r.content,
							}))}
							onRemove={(index) =>
								setDraftReferences((list) => list.filter((_, i) => i !== index))
							}
						/>
					)}

					{!isEdit && draftScripts.length > 0 && (
						<DraftItemList
							icon={<Code2 size={13} className='text-primary-500' />}
							title='Scripts'
							items={draftScripts.map((x) => ({
								label: x.name,
								badge: x.language,
								detail: x.description || x.code,
							}))}
							onRemove={(index) =>
								setDraftScripts((list) => list.filter((_, i) => i !== index))
							}
						/>
					)}

					<button
						onClick={handleSave}
						disabled={isSaving || !form.name.trim() || !form.instructions.trim()}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'>
						{isEdit ? 'Save Changes' : 'Create Skill'}
					</button>

					{activeSkillId && (
						<>
							{/* References */}
							<div className='border-t border-zinc-200 pt-5 dark:border-zinc-800'>
								<div className='mb-2.5 flex items-center gap-1.5'>
									<FileText size={13} className='text-primary-500' />
									<h3 className='text-xs font-black text-zinc-700 dark:text-zinc-300'>
										References
									</h3>
								</div>

								<div className='mb-3 space-y-2'>
									{(references ?? []).map((ref) =>
										editingReference?.id === ref.id ? (
											<div
												key={ref.id}
												className='border-primary-500/40 space-y-2 rounded-xl border bg-white p-3 dark:bg-zinc-900'>
												<input
													type='text'
													aria-label='Reference title'
													value={editingReference.title}
													onChange={(e) =>
														setEditingReference(
															(r) =>
																r && {
																	...r,
																	title: e.target.value,
																},
														)
													}
													className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
												/>
												<textarea
													aria-label='Reference content'
													rows={6}
													value={editingReference.content}
													onChange={(e) =>
														setEditingReference(
															(r) =>
																r && {
																	...r,
																	content: e.target.value,
																},
														)
													}
													className='focus:border-primary-500/80 block w-full resize-y rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
												/>
												<div className='flex justify-end gap-2'>
													<button
														onClick={() => setEditingReference(null)}
														className='h-7 cursor-pointer rounded-lg border border-zinc-200 px-3 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'>
														Cancel
													</button>
													<button
														onClick={handleSaveReference}
														disabled={
															updateReferenceMutation.isPending ||
															!editingReference.title.trim() ||
															!editingReference.content.trim()
														}
														className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-7 cursor-pointer items-center gap-1 rounded-lg px-3 text-[11px] font-black disabled:cursor-not-allowed disabled:opacity-50'>
														{updateReferenceMutation.isPending && (
															<Loader2
																size={11}
																className='animate-spin'
															/>
														)}
														Save
													</button>
												</div>
											</div>
										) : (
											<div
												key={ref.id}
												className='flex items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40'>
												<div>
													<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
														{ref.title}
													</p>
													<p className='mt-0.5 line-clamp-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
														{ref.content}
													</p>
												</div>
												<div
													className={`flex shrink-0 items-center gap-2 ${isSynced ? 'hidden' : ''}`}>
													<button
														aria-label={`Edit ${ref.title}`}
														onClick={() => startEditReference(ref)}
														className='hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer text-zinc-300 dark:text-zinc-600'>
														<Pencil size={12} />
													</button>
													<button
														aria-label='Delete'
														onClick={() =>
															removeReferenceMutation.mutate(ref.id)
														}
														className='cursor-pointer text-zinc-300 hover:text-rose-500 dark:text-zinc-600'>
														<Trash2 size={13} />
													</button>
												</div>
											</div>
										),
									)}
								</div>

								<div
									className={`space-y-2 rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-800 ${isSynced ? 'hidden' : ''}`}>
									<input
										aria-label='Reference title'
										type='text'
										placeholder='Reference title'
										value={newReference.title}
										onChange={(e) =>
											setNewReference((r) => ({
												...r,
												title: e.target.value,
											}))
										}
										className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
									/>
									<textarea
										aria-label='Reference content'
										placeholder='Reference content'
										rows={2}
										value={newReference.content}
										onChange={(e) =>
											setNewReference((r) => ({
												...r,
												content: e.target.value,
											}))
										}
										className='focus:border-primary-500/80 block w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
									/>
									<button
										onClick={handleAddReference}
										disabled={
											!newReference.title.trim() ||
											!newReference.content.trim()
										}
										className='flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'>
										<Plus size={12} /> Add reference
									</button>
								</div>
							</div>

							{/* Scripts */}
							<div className='border-t border-zinc-200 pt-5 dark:border-zinc-800'>
								<div className='mb-2.5 flex items-center gap-1.5'>
									<Code2 size={13} className='text-primary-500' />
									<h3 className='text-xs font-black text-zinc-700 dark:text-zinc-300'>
										Scripts
									</h3>
								</div>

								<div className='mb-3 space-y-2'>
									{(scripts ?? []).map((script) =>
										editingScript?.id === script.id ? (
											<div
												key={script.id}
												className='border-primary-500/40 space-y-2 rounded-xl border bg-white p-3 dark:bg-zinc-900'>
												<div className='flex gap-2'>
													<input
														type='text'
														aria-label='Script name'
														value={editingScript.name}
														onChange={(e) =>
															setEditingScript(
																(x) =>
																	x && {
																		...x,
																		name: e.target.value,
																	},
															)
														}
														className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
													/>
													<select
														aria-label='Script language'
														value={editingScript.language}
														onChange={(e) =>
															setEditingScript(
																(x) =>
																	x && {
																		...x,
																		language: e.target
																			.value as (typeof SKILL_SCRIPT_LANGUAGES)[number],
																	},
															)
														}
														className='focus:border-primary-500/80 block h-8 shrink-0 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'>
														{SKILL_SCRIPT_LANGUAGES.map((lang) => (
															<option key={lang} value={lang}>
																{lang}
															</option>
														))}
													</select>
												</div>
												<input
													type='text'
													aria-label='Script description'
													placeholder='Short description'
													value={editingScript.description}
													onChange={(e) =>
														setEditingScript(
															(x) =>
																x && {
																	...x,
																	description: e.target.value,
																},
														)
													}
													className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
												/>
												<textarea
													aria-label='Script code'
													rows={8}
													value={editingScript.code}
													onChange={(e) =>
														setEditingScript(
															(x) =>
																x && { ...x, code: e.target.value },
														)
													}
													className='focus:border-primary-500/80 block w-full resize-y rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
												/>
												<div className='flex items-center justify-between gap-2'>
													<label className='flex cursor-pointer items-center gap-1.5 text-[11px] font-bold text-zinc-600 dark:text-zinc-300'>
														<input
															type='checkbox'
															aria-label='Script enabled'
															checked={editingScript.is_enabled}
															onChange={(e) =>
																setEditingScript(
																	(x) =>
																		x && {
																			...x,
																			is_enabled:
																				e.target.checked,
																		},
																)
															}
															className='accent-primary-500'
														/>
														Enabled
													</label>
													<div className='flex gap-2'>
														<button
															onClick={() => setEditingScript(null)}
															className='h-7 cursor-pointer rounded-lg border border-zinc-200 px-3 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'>
															Cancel
														</button>
														<button
															onClick={handleSaveScript}
															disabled={
																updateScriptMutation.isPending ||
																!editingScript.name.trim() ||
																!editingScript.code.trim()
															}
															className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex h-7 cursor-pointer items-center gap-1 rounded-lg px-3 text-[11px] font-black disabled:cursor-not-allowed disabled:opacity-50'>
															{updateScriptMutation.isPending && (
																<Loader2
																	size={11}
																	className='animate-spin'
																/>
															)}
															Save
														</button>
													</div>
												</div>
											</div>
										) : (
											<div
												key={script.id}
												className='flex items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40'>
												<div>
													<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
														{script.name}{' '}
														<span className='ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
															{script.language}
														</span>
														{!script.is_enabled && (
															<span className='ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-600 uppercase dark:bg-amber-950/40 dark:text-amber-400'>
																off
															</span>
														)}
													</p>
													<p className='mt-0.5 line-clamp-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
														{script.description}
													</p>
												</div>
												<div
													className={`flex shrink-0 items-center gap-2 ${isSynced ? 'hidden' : ''}`}>
													<button
														aria-label={`Edit ${script.name}`}
														onClick={() => startEditScript(script)}
														className='hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer text-zinc-300 dark:text-zinc-600'>
														<Pencil size={12} />
													</button>
													<button
														aria-label='Delete'
														onClick={() =>
															removeScriptMutation.mutate(script.id)
														}
														className='cursor-pointer text-zinc-300 hover:text-rose-500 dark:text-zinc-600'>
														<Trash2 size={13} />
													</button>
												</div>
											</div>
										),
									)}
								</div>

								<div
									className={`space-y-2 rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-800 ${isSynced ? 'hidden' : ''}`}>
									<div className='flex gap-2'>
										<input
											aria-label='Script name'
											type='text'
											placeholder='Script name'
											value={newScript.name}
											onChange={(e) =>
												setNewScript((s) => ({
													...s,
													name: e.target.value,
												}))
											}
											className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
										/>
										<select
											value={newScript.language}
											onChange={(e) =>
												setNewScript((s) => ({
													...s,
													language: e.target
														.value as (typeof SKILL_SCRIPT_LANGUAGES)[number],
												}))
											}
											className='focus:border-primary-500/80 block h-8 shrink-0 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'>
											{SKILL_SCRIPT_LANGUAGES.map((lang) => (
												<option key={lang} value={lang}>
													{lang}
												</option>
											))}
										</select>
									</div>
									<input
										aria-label='Short description'
										type='text'
										placeholder='Short description'
										value={newScript.description}
										onChange={(e) =>
											setNewScript((s) => ({
												...s,
												description: e.target.value,
											}))
										}
										className='focus:border-primary-500/80 block h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
									/>
									<textarea
										aria-label='Code'
										placeholder='Code'
										rows={3}
										value={newScript.code}
										onChange={(e) =>
											setNewScript((s) => ({ ...s, code: e.target.value }))
										}
										className='focus:border-primary-500/80 block w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 font-mono text-[11px] font-semibold text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
									/>
									<button
										onClick={handleAddScript}
										disabled={!newScript.name.trim() || !newScript.code.trim()}
										className='flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'>
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

/** A generated draft's references or scripts, saved along with the skill. */
const DraftItemList = ({
	icon,
	title,
	items,
	onRemove,
}: {
	icon: React.ReactNode;
	title: string;
	items: { label: string; badge?: string; detail: string }[];
	onRemove: (index: number) => void;
}) => (
	<div>
		<div className='mb-2.5 flex items-center gap-1.5'>
			{icon}
			<h3 className='text-xs font-black text-zinc-700 dark:text-zinc-300'>{title}</h3>
			<span className='text-[10px] font-bold text-zinc-400 dark:text-zinc-500'>
				· saved with the skill
			</span>
		</div>
		<div className='space-y-2'>
			{items.map((item, index) => (
				<div
					key={`${item.label}-${index}`}
					className='flex items-start justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40'>
					<div className='min-w-0'>
						<p className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
							{item.label}
							{item.badge && (
								<span className='ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
									{item.badge}
								</span>
							)}
						</p>
						<p className='mt-0.5 line-clamp-2 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
							{item.detail}
						</p>
					</div>
					<button
						aria-label={`Remove ${item.label}`}
						onClick={() => onRemove(index)}
						className='shrink-0 cursor-pointer text-zinc-300 hover:text-rose-500 dark:text-zinc-600'>
						<Trash2 size={13} />
					</button>
				</div>
			))}
		</div>
	</div>
);

export default SkillEditorDrawer;
