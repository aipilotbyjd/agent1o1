import { useState } from 'react';
import {
	Plus,
	X,
	Loader2,
	Settings2,
	CheckCircle2,
	XCircle,
	Flag,
	Clock,
	Smile,
	Tag,
	Ruler,
	Database,
	RotateCw,
	Play,
} from 'lucide-react';
import {
	useAgentEvaluationSettings,
	useUpdateAgentEvaluationSettings,
	useAgentSessionEvaluations,
	useAgentSessions,
	useRunAgentSessionEvaluation,
} from '@/api/modules/agents';
import { notify } from '@/api/core';
import type {
	TAgentEvaluationSettings,
	TAgentSessionEvaluation,
	TAgentSessionEvaluationGrade,
	TEvaluationCriterion,
	TEvaluationCriterionAction,
	TEvaluationCriterionType,
	TEvaluationDataPoint,
	TEvaluationDataPointType,
	TEvaluationTag,
} from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
};

const GRADE_STYLE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
	pass: { icon: CheckCircle2, className: 'text-emerald-500' },
	fail: { icon: XCircle, className: 'text-rose-500' },
	flag: { icon: Flag, className: 'text-amber-500' },
};

const CRITERION_TYPES: TEvaluationCriterionType[] = ['boolean', 'score'];
const CRITERION_ACTIONS: TEvaluationCriterionAction[] = ['flag', 'fail', 'info'];
const DATA_POINT_TYPES: TEvaluationDataPointType[] = ['string', 'number', 'boolean'];

const fieldClass =
	'rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200';
const selectClass =
	'shrink-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-bold text-zinc-600 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';

/** Toggle row — same switch markup the Settings tab uses in Build.page. */
const ToggleRow = ({
	label,
	hint,
	value,
	onChange,
}: {
	label: string;
	hint?: string;
	value: boolean;
	onChange: (next: boolean) => void;
}) => (
	<div className='flex items-center justify-between gap-3'>
		<div className='flex min-w-0 flex-col'>
			<span className='text-[11px] font-black text-zinc-800 dark:text-zinc-200'>{label}</span>
			{hint && (
				<span className='mt-0.5 text-[10px] font-semibold leading-normal text-zinc-400 dark:text-zinc-400'>
					{hint}
				</span>
			)}
		</div>
		<button
			onClick={() => onChange(!value)}
			className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
				value ? 'bg-primary-400 dark:bg-primary-400' : 'bg-zinc-200 dark:bg-zinc-800'
			}`}>
			<span
				className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
					value ? 'translate-x-4' : 'translate-x-0'
				}`}
			/>
		</button>
	</div>
);

/** Header for one of the settings' repeatable list editors. */
const ListHeader = ({
	icon: Icon,
	label,
	onAdd,
}: {
	icon: typeof Tag;
	label: string;
	onAdd: () => void;
}) => (
	<div className='flex items-center justify-between'>
		<span className='flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-zinc-400'>
			<Icon size={10} />
			{label}
		</span>
		<button
			onClick={onAdd}
			className='flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400'>
			<Plus size={10} />
			<span>Add</span>
		</button>
	</div>
);

/** What the grader checks and records. Mounted keyed on the loaded record so
 *  its fields seed from the server without an effect. */
const EvaluationSettingsForm = ({
	ws,
	agentId,
	settings,
}: {
	ws: string;
	agentId: string;
	settings: TAgentEvaluationSettings;
}) => {
	const updateMutation = useUpdateAgentEvaluationSettings(ws, agentId);
	const [form, setForm] = useState({
		is_enabled: settings.is_enabled,
		model: settings.model ?? '',
		sentiment_enabled: settings.sentiment_enabled,
		sentiment_affects_grade: settings.sentiment_affects_grade,
		sentiment_guidance: settings.sentiment_guidance ?? '',
		suggest_tags_automatically: settings.suggest_tags_automatically,
		criteria: (settings.criteria ?? []) as TEvaluationCriterion[],
		tags: (settings.tags ?? []) as TEvaluationTag[],
		data_points: (settings.data_points ?? []) as TEvaluationDataPoint[],
	});

	const patch = (next: Partial<typeof form>) => {
		setForm((f) => ({ ...f, ...next }));
		return next;
	};

	return (
		<div className='space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<ToggleRow
				label='Enable grading'
				hint='Score every finished chat against the criteria below.'
				value={form.is_enabled}
				onChange={(next) => updateMutation.mutate(patch({ is_enabled: next }))}
			/>

			<div>
				<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>
					Grader model
				</span>
				<input
					type='text'
					value={form.model}
					onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
					placeholder='Leave blank to use the workspace default'
					className={`mt-1 w-full ${fieldClass}`}
				/>
			</div>

			{/* Sentiment */}
			<ToggleRow
				label='Track sentiment'
				value={form.sentiment_enabled}
				onChange={(next) => updateMutation.mutate(patch({ sentiment_enabled: next }))}
			/>
			{form.sentiment_enabled && (
				<div className='space-y-2.5 rounded-lg border border-zinc-100 p-2.5 dark:border-zinc-800'>
					<ToggleRow
						label='Sentiment affects grade'
						value={form.sentiment_affects_grade}
						onChange={(next) => updateMutation.mutate(patch({ sentiment_affects_grade: next }))}
					/>
					<textarea
						value={form.sentiment_guidance}
						onChange={(e) => setForm((f) => ({ ...f, sentiment_guidance: e.target.value }))}
						placeholder='How to read sentiment for this agent (optional)'
						rows={2}
						className={`w-full resize-none ${fieldClass}`}
					/>
				</div>
			)}

			<ToggleRow
				label='Suggest tags automatically'
				hint='Let the grader apply the tags below on its own.'
				value={form.suggest_tags_automatically}
				onChange={(next) => updateMutation.mutate(patch({ suggest_tags_automatically: next }))}
			/>

			{/* Criteria */}
			<div className='space-y-1.5'>
				<ListHeader
					icon={Ruler}
					label='Criteria'
					onAdd={() =>
						setForm((f) => ({
							...f,
							criteria: [...f.criteria, { name: '', prompt: '', type: 'boolean', priority: 'flag' }],
						}))
					}
				/>
				{form.criteria.length === 0 && (
					<p className='text-[10px] font-semibold text-zinc-400'>No criteria yet.</p>
				)}
				{form.criteria.map((criterion, index) => (
					<div
						key={index}
						className='space-y-1.5 rounded-lg border border-zinc-100 p-2 dark:border-zinc-800'>
						<div className='flex items-center gap-1.5'>
							<input
								type='text'
								value={criterion.name}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										criteria: f.criteria.map((c, i) =>
											i === index ? { ...c, name: e.target.value } : c,
										),
									}))
								}
								placeholder='Criterion name'
								className={`min-w-0 flex-1 ${fieldClass}`}
							/>
							<button
								onClick={() =>
									setForm((f) => ({ ...f, criteria: f.criteria.filter((_, i) => i !== index) }))
								}
								className='shrink-0 text-zinc-400 hover:text-rose-500'>
								<X size={12} />
							</button>
						</div>
						<textarea
							value={criterion.prompt}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									criteria: f.criteria.map((c, i) =>
										i === index ? { ...c, prompt: e.target.value } : c,
									),
								}))
							}
							placeholder='What should the grader check?'
							rows={2}
							className={`w-full resize-none ${fieldClass}`}
						/>
						<div className='flex gap-1.5'>
							<select
								value={criterion.type}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										criteria: f.criteria.map((c, i) =>
											i === index ? { ...c, type: e.target.value as TEvaluationCriterionType } : c,
										),
									}))
								}
								className={selectClass}>
								{CRITERION_TYPES.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
							<select
								value={criterion.priority}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										criteria: f.criteria.map((c, i) =>
											i === index
												? { ...c, priority: e.target.value as TEvaluationCriterionAction }
												: c,
										),
									}))
								}
								className={selectClass}>
								{CRITERION_ACTIONS.map((action) => (
									<option key={action} value={action}>
										{action}
									</option>
								))}
							</select>
						</div>
					</div>
				))}
			</div>

			{/* Tags */}
			<div className='space-y-1.5'>
				<ListHeader
					icon={Tag}
					label='Tags'
					onAdd={() => setForm((f) => ({ ...f, tags: [...f.tags, { name: '', description: '' }] }))}
				/>
				{form.tags.length === 0 && (
					<p className='text-[10px] font-semibold text-zinc-400'>No tags yet.</p>
				)}
				{form.tags.map((tag, index) => (
					<div key={index} className='flex items-center gap-1.5'>
						<input
							type='text'
							value={tag.name}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									tags: f.tags.map((t, i) => (i === index ? { ...t, name: e.target.value } : t)),
								}))
							}
							placeholder='Tag'
							className={`w-24 shrink-0 ${fieldClass}`}
						/>
						<input
							type='text'
							value={tag.description}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									tags: f.tags.map((t, i) =>
										i === index ? { ...t, description: e.target.value } : t,
									),
								}))
							}
							placeholder='When to apply it'
							className={`min-w-0 flex-1 ${fieldClass}`}
						/>
						<button
							onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((_, i) => i !== index) }))}
							className='shrink-0 text-zinc-400 hover:text-rose-500'>
							<X size={12} />
						</button>
					</div>
				))}
			</div>

			{/* Data points */}
			<div className='space-y-1.5'>
				<ListHeader
					icon={Database}
					label='Data points'
					onAdd={() =>
						setForm((f) => ({
							...f,
							data_points: [...f.data_points, { name: '', data_type: 'string', description: '' }],
						}))
					}
				/>
				{form.data_points.length === 0 && (
					<p className='text-[10px] font-semibold text-zinc-400'>No data points yet.</p>
				)}
				{form.data_points.map((point, index) => (
					<div key={index} className='flex items-center gap-1.5'>
						<input
							type='text'
							value={point.name}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									data_points: f.data_points.map((d, i) =>
										i === index ? { ...d, name: e.target.value } : d,
									),
								}))
							}
							placeholder='Field'
							className={`w-24 shrink-0 ${fieldClass}`}
						/>
						<select
							value={point.data_type}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									data_points: f.data_points.map((d, i) =>
										i === index
											? { ...d, data_type: e.target.value as TEvaluationDataPointType }
											: d,
									),
								}))
							}
							className={selectClass}>
							{DATA_POINT_TYPES.map((type) => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
						<input
							type='text'
							value={point.description}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									data_points: f.data_points.map((d, i) =>
										i === index ? { ...d, description: e.target.value } : d,
									),
								}))
							}
							placeholder='What to extract'
							className={`min-w-0 flex-1 ${fieldClass}`}
						/>
						<button
							onClick={() =>
								setForm((f) => ({
									...f,
									data_points: f.data_points.filter((_, i) => i !== index),
								}))
							}
							className='shrink-0 text-zinc-400 hover:text-rose-500'>
							<X size={12} />
						</button>
					</div>
				))}
			</div>

			<div className='flex justify-end border-t border-zinc-100 pt-2.5 dark:border-zinc-800'>
				<button
					onClick={() =>
						updateMutation.mutate({
							model: form.model.trim() || null,
							sentiment_guidance: form.sentiment_guidance.trim() || null,
							criteria: form.criteria.filter((c) => c.name.trim()),
							tags: form.tags.filter((t) => t.name.trim()),
							data_points: form.data_points.filter((d) => d.name.trim()),
						})
					}
					disabled={updateMutation.isPending}
					className='flex items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
					{updateMutation.isPending && <Loader2 size={11} className='animate-spin' />}
					Save
				</button>
			</div>
		</div>
	);
};

/** One graded chat. `onRegrade` re-runs the grader on the chat behind it. */
const EvaluationCard = ({
	evaluation,
	onRegrade,
	isRegrading,
}: {
	evaluation: TAgentSessionEvaluation;
	onRegrade: (sessionId: string) => void;
	isRegrading: boolean;
}) => {
	const grade = evaluation.grade ? GRADE_STYLE[evaluation.grade] : null;
	const GradeIcon = grade?.icon ?? Clock;

	return (
		<div className='space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<div className='flex items-start gap-3'>
				<GradeIcon
					size={14}
					className={`mt-0.5 shrink-0 ${grade?.className ?? 'text-amber-500'}`}
				/>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<span className='truncate text-[11px] font-black capitalize text-zinc-800 dark:text-zinc-200'>
							{evaluation.grade ?? evaluation.status}
						</span>
						{evaluation.call_successful != null && (
							<span className='shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-500 dark:bg-zinc-800'>
								{evaluation.call_successful ? 'resolved' : 'unresolved'}
							</span>
						)}
						{evaluation.sentiment && (
							<span className='flex shrink-0 items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-500 dark:bg-zinc-800'>
								<Smile size={8} />
								{evaluation.sentiment}
							</span>
						)}
					</div>
					<span className='block text-[9px] font-semibold text-zinc-400 dark:text-zinc-600'>
						{evaluation.evaluated_at
							? new Date(evaluation.evaluated_at).toLocaleString()
							: new Date(evaluation.created_at).toLocaleString()}
					</span>
				</div>
				<button
					type='button'
					onClick={() => onRegrade(String(evaluation.agent_session_id))}
					disabled={isRegrading}
					title='Grade this chat again'
					className='shrink-0 rounded-lg border border-zinc-200 bg-white p-1 text-zinc-400 transition hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:text-zinc-200'>
					<RotateCw size={10} className={isRegrading ? 'animate-spin' : undefined} />
				</button>
			</div>

			<div className='flex items-start gap-3'>
				<div className='w-[14px] shrink-0' />
				<div className='min-w-0 flex-1'>
					{evaluation.summary && (
						<p className='mt-1 line-clamp-3 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
							{evaluation.summary}
						</p>
					)}
				</div>
			</div>

			{evaluation.error && (
				<p className='rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400'>
					{evaluation.error}
				</p>
			)}

			{(evaluation.applied_tags ?? []).length > 0 && (
				<div className='flex flex-wrap gap-1'>
					{(evaluation.applied_tags ?? []).map((tag) => (
						<span
							key={tag}
							className='rounded-full bg-primary-400/10 px-1.5 py-0.5 text-[8px] font-black uppercase text-primary-600 dark:text-primary-400'>
							{tag}
						</span>
					))}
				</div>
			)}
		</div>
	);
};

/**
 * Automatic QA grading of finished chats — what the grader checks, and how
 * every chat scored.
 * Backed by {agent}/evaluation-settings and {agent}/session-evaluations —
 * see AgentEvaluationController.
 */
const AgentEvaluationsPanel = ({ ws, agentId }: TProps) => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [gradeFilter, setGradeFilter] = useState<TAgentSessionEvaluationGrade | undefined>(
		undefined,
	);
	// Chat picked in the "grade a chat" row. '' means nothing chosen yet.
	const [sessionToGrade, setSessionToGrade] = useState('');

	const { data: settings } = useAgentEvaluationSettings(ws, agentId ?? '');
	const { data: sessions } = useAgentSessions(ws, agentId ?? '');
	const runEvaluation = useRunAgentSessionEvaluation(ws, agentId ?? '');

	/** Grades one chat on demand, instead of waiting for the automatic pass. */
	const gradeSession = (sessionId: string) => {
		if (!sessionId) return;
		runEvaluation.mutate(sessionId, {
			onSuccess: () => notify.success('Chat graded.'),
		});
	};
	const { data, isLoading } = useAgentSessionEvaluations(
		ws,
		agentId ?? '',
		gradeFilter ? { grade: gradeFilter } : undefined,
	);

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to grade chats.
			</p>
		);
	}

	// The list endpoint is paginated, so it comes back as { evaluations, meta }.
	const items = data?.evaluations ?? [];

	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='flex items-center justify-between gap-2'>
				<div className='min-w-0'>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Grading</h4>
					<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						Automatic QA scoring of finished chats.
					</p>
				</div>
				<button
					onClick={() => setIsSettingsOpen((v) => !v)}
					title='Grading settings'
					className={`shrink-0 rounded-lg border px-2 py-1 transition ${
						isSettingsOpen
							? 'border-primary-500/20 bg-primary-400/10 text-primary-600 dark:text-primary-400'
							: 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900'
					}`}>
					<Settings2 size={12} />
				</button>
			</div>

			{/* Settings */}
			{isSettingsOpen &&
				(settings ? (
					<EvaluationSettingsForm key={settings.id} ws={ws} agentId={agentId} settings={settings} />
				) : (
					<p className='py-4 text-center text-[11px] font-semibold text-zinc-400'>
						Loading settings…
					</p>
				))}

			{/* Grade a chat on demand — the settings above only schedule the
			    automatic pass, so without this the panel can just read results. */}
			<div className='flex items-center gap-1.5'>
				<select
					value={sessionToGrade}
					onChange={(e) => setSessionToGrade(e.target.value)}
					className={`${selectClass} min-w-0 flex-1`}>
					<option value=''>Grade a chat…</option>
					{(sessions ?? []).map((session) => (
						<option key={session.id} value={String(session.id)}>
							{session.title?.trim() || 'Untitled chat'}
						</option>
					))}
				</select>
				<button
					type='button'
					onClick={() => gradeSession(sessionToGrade)}
					disabled={!sessionToGrade || runEvaluation.isPending}
					className='flex shrink-0 items-center gap-1 rounded-lg bg-primary-400 px-2.5 py-1.5 text-[10px] font-black text-primary-950 transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-40'>
					{runEvaluation.isPending ? (
						<Loader2 size={10} className='animate-spin' />
					) : (
						<Play size={10} />
					)}
					<span>Grade</span>
				</button>
			</div>

			{/* Grade filter */}
			<div className='flex gap-1.5'>
				{(
					[undefined, 'pass', 'fail', 'flag'] as (TAgentSessionEvaluationGrade | undefined)[]
				).map((g) => (
					<button
						key={g ?? 'all'}
						type='button'
						onClick={() => setGradeFilter(g)}
						className={`rounded-lg px-2.5 py-1 text-[10px] font-black capitalize transition ${
							gradeFilter === g
								? 'bg-primary-400 text-primary-950'
								: 'border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
						}`}>
						{g ?? 'All'}
					</button>
				))}
			</div>

			{/* Evaluations */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No chats graded yet.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((evaluation) => (
						<EvaluationCard
							key={evaluation.id}
							evaluation={evaluation}
							onRegrade={gradeSession}
							isRegrading={
								runEvaluation.isPending &&
								String(runEvaluation.variables) === String(evaluation.agent_session_id)
							}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default AgentEvaluationsPanel;
