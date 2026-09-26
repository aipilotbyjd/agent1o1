import { useState } from 'react';
import {
	Plus,
	Trash2,
	X,
	Loader2,
	ChevronLeft,
	ChevronDown,
	ChevronRight,
	Play,
	CheckCircle2,
	XCircle,
	Clock,
	FlaskConical,
	ListChecks,
} from 'lucide-react';
import {
	useAgentEvalSuites,
	useCreateAgentEvalSuite,
	useDeleteAgentEvalSuite,
	useAgentEvalCases,
	useCreateAgentEvalCase,
	useDeleteAgentEvalCase,
	useAgentEvalRuns,
	useAgentEvalRun,
	useRunAgentEvalSuite,
} from '@/api/modules/agents';
import type {
	TAgentEvalSuite,
	TAgentEvalRun,
	TAgentEvalRunStatus,
	TEvalAssertion,
	TEvalAssertionType,
} from '@/types/agent.type';

type TProps = {
	ws: string;
	agentId?: string;
};

const ASSERTION_TYPES: { id: TEvalAssertionType; label: string }[] = [
	{ id: 'contains', label: 'Contains' },
	{ id: 'not_contains', label: 'Not contains' },
	{ id: 'equals', label: 'Equals' },
	{ id: 'regex', label: 'Regex' },
	{ id: 'llm_judge', label: 'LLM judge' },
];

const RUN_STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; className: string }> = {
	completed: { icon: CheckCircle2, className: 'text-emerald-500' },
	failed: { icon: XCircle, className: 'text-rose-500' },
	running: { icon: Loader2, className: 'text-blue-500 animate-spin' },
	pending: { icon: Clock, className: 'text-amber-500' },
};

const RunStatusBadge = ({ status }: { status: TAgentEvalRunStatus }) => {
	const style = RUN_STATUS_STYLE[status] ?? RUN_STATUS_STYLE.pending;
	const Icon = style.icon;
	return <Icon size={14} className={style.className} />;
};

const emptyCaseForm = {
	name: '',
	input: '',
	assertions: [{ type: 'contains' as TEvalAssertionType, value: '' }] as TEvalAssertion[],
};

/** Expandable row: eval run summary + on-demand per-case results. */
const EvalRunRow = ({
	ws,
	agentId,
	suiteId,
	run,
}: {
	ws: string;
	agentId: string;
	suiteId: string;
	run: TAgentEvalRun;
}) => {
	const [open, setOpen] = useState(false);
	const { data: detail, isLoading } = useAgentEvalRun(ws, agentId, suiteId, open ? run.id : '');
	const total = run.passed + run.failed;

	return (
		<div className='rounded-xl border border-zinc-100 bg-zinc-50/20 dark:border-zinc-800 dark:bg-zinc-950/20'>
			<button
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center gap-3 p-3 text-left'>
				{open ? (
					<ChevronDown size={13} className='shrink-0 text-zinc-400' />
				) : (
					<ChevronRight size={13} className='shrink-0 text-zinc-400' />
				)}
				<RunStatusBadge status={run.status} />
				<div className='min-w-0 flex-1'>
					<span className='truncate text-[11px] font-black capitalize text-zinc-800 dark:text-zinc-200'>
						{run.status}
					</span>
					<span className='block text-[9px] font-semibold text-zinc-400 dark:text-zinc-600'>
						{new Date(run.created_at).toLocaleString()}
					</span>
				</div>
				<div className='flex shrink-0 flex-col items-end'>
					<span className='text-[10px] font-black text-emerald-500'>
						{run.passed} / {total || 0}
					</span>
					{run.failed > 0 && (
						<span className='text-[9px] font-bold text-rose-500'>{run.failed} failed</span>
					)}
				</div>
			</button>

			{open && (
				<div className='border-t border-zinc-100 p-3 dark:border-zinc-800'>
					{isLoading ? (
						<p className='text-center text-[10px] font-semibold text-zinc-400'>Loading results…</p>
					) : (
						<div className='space-y-2'>
							{run.error && (
								<p className='rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400'>
									{run.error}
								</p>
							)}
							{(detail?.results ?? []).length === 0 ? (
								<p className='text-[10px] font-semibold text-zinc-400'>No case results recorded.</p>
							) : (
								(detail?.results ?? []).map((result) => (
									<div
										key={result.id}
										className='flex items-start gap-2 rounded-lg bg-white p-2 dark:bg-zinc-900/40'>
										{result.passed ? (
											<CheckCircle2 size={12} className='mt-0.5 shrink-0 text-emerald-500' />
										) : (
											<XCircle size={12} className='mt-0.5 shrink-0 text-rose-500' />
										)}
										<div className='min-w-0 flex-1'>
											<span className='truncate text-[10px] font-black text-zinc-700 dark:text-zinc-300'>
												{result.case?.name ?? 'case'}
											</span>
											{result.error ? (
												<p className='mt-0.5 line-clamp-2 text-[9px] font-semibold text-rose-400'>
													{result.error}
												</p>
											) : (
												typeof result.output === 'string' && (
													<p className='mt-0.5 line-clamp-2 text-[9px] font-semibold text-zinc-400'>
														{result.output}
													</p>
												)
											)}
										</div>
									</div>
								))
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

/** Cases + run history for one suite, behind a back arrow. */
const SuiteDetail = ({
	ws,
	agentId,
	suite,
	onBack,
}: {
	ws: string;
	agentId: string;
	suite: TAgentEvalSuite;
	onBack: () => void;
}) => {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [form, setForm] = useState(emptyCaseForm);

	const { data: cases, isLoading } = useAgentEvalCases(ws, agentId, suite.id);
	const { data: runs, isLoading: isRunsLoading } = useAgentEvalRuns(ws, agentId, suite.id);
	const createMutation = useCreateAgentEvalCase(ws, agentId, suite.id);
	const deleteMutation = useDeleteAgentEvalCase(ws, agentId, suite.id);
	const runMutation = useRunAgentEvalSuite(ws, agentId, suite.id);

	const items = cases ?? [];

	const resetForm = () => {
		setForm(emptyCaseForm);
		setIsFormOpen(false);
	};

	const handleSubmit = async () => {
		const assertions = form.assertions.filter((a) => a.value.trim());
		if (!form.name.trim() || !form.input.trim() || assertions.length === 0) return;
		await createMutation.mutateAsync({
			name: form.name.trim(),
			input: form.input.trim(),
			assertions: assertions.map((a) => ({ type: a.type, value: a.value.trim() })),
		});
		resetForm();
	};

	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='flex items-center justify-between gap-2'>
				<div className='flex min-w-0 items-center gap-2'>
					<button aria-label='Previous' onClick={onBack} className='shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
						<ChevronLeft size={14} />
					</button>
					<div className='min-w-0'>
						<h4 className='truncate text-xs font-black text-zinc-900 dark:text-white'>{suite.name}</h4>
						<p className='truncate text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
							{suite.description || 'No description.'}
						</p>
					</div>
				</div>
				<button
					onClick={() => runMutation.mutate()}
					disabled={runMutation.isPending || items.length === 0}
					className='flex shrink-0 items-center gap-1 rounded-lg bg-primary-400 px-2.5 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
					{runMutation.isPending ? (
						<Loader2 size={10} className='animate-spin' />
					) : (
						<Play size={10} />
					)}
					<span>Run</span>
				</button>
			</div>

			{/* Cases */}
			<div className='flex items-center justify-between'>
				<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>
					Cases ({items.length})
				</span>
				<button
					onClick={() => {
						resetForm();
						setIsFormOpen(true);
					}}
					className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Add</span>
				</button>
			</div>

			{/* Case form */}
			{isFormOpen && (
				<div className='space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='flex items-center justify-between'>
						<span className='text-[11px] font-black text-zinc-700 dark:text-zinc-300'>New case</span>
						<button aria-label='Close' onClick={resetForm} className='text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
							<X size={13} />
						</button>
					</div>
					<input
						type='text'
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						placeholder='Case name (e.g. greets by name)'
						className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<textarea
						value={form.input}
						onChange={(e) => setForm((f) => ({ ...f, input: e.target.value }))}
						placeholder='Input message sent to the agent'
						rows={3}
						className='w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>

					{/* Assertions */}
					<div className='space-y-1.5'>
						<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>
							Assertions
						</span>
						{form.assertions.map((assertion, index) => (
							<div key={index} className='flex items-center gap-1.5'>
								<select
									value={assertion.type}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											assertions: f.assertions.map((a, i) =>
												i === index ? { ...a, type: e.target.value as TEvalAssertionType } : a,
											),
										}))
									}
									className='shrink-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[10px] font-bold text-zinc-600 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'>
									{ASSERTION_TYPES.map(({ id, label }) => (
										<option key={id} value={id}>
											{label}
										</option>
									))}
								</select>
								<input
									type='text'
									value={assertion.value}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											assertions: f.assertions.map((a, i) =>
												i === index ? { ...a, value: e.target.value } : a,
											),
										}))
									}
									placeholder='Expected value'
									className='min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
								/>
								{form.assertions.length > 1 && (
									<button
										aria-label='Close'
										onClick={() =>
											setForm((f) => ({
												...f,
												assertions: f.assertions.filter((_, i) => i !== index),
											}))
										}
										className='shrink-0 text-zinc-400 hover:text-rose-500'>
										<X size={12} />
									</button>
								)}
							</div>
						))}
						<button
							onClick={() =>
								setForm((f) => ({
									...f,
									assertions: [...f.assertions, { type: 'contains', value: '' }],
								}))
							}
							className='flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400'>
							<Plus size={10} />
							<span>Add assertion</span>
						</button>
					</div>

					<div className='flex justify-end gap-2'>
						<button
							onClick={resetForm}
							className='rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={
								createMutation.isPending ||
								!form.name.trim() ||
								!form.input.trim() ||
								form.assertions.every((a) => !a.value.trim())
							}
							className='flex items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
							{createMutation.isPending && <Loader2 size={11} className='animate-spin' />}
							Save
						</button>
					</div>
				</div>
			)}

			{/* Case list */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No cases yet.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((evalCase) => (
						<div
							key={evalCase.id}
							className='flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
							<div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
								<ListChecks size={13} />
							</div>
							<div className='min-w-0 flex-1'>
								<span className='truncate text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
									{evalCase.name}
								</span>
								<p className='mt-0.5 line-clamp-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
									{evalCase.input}
								</p>
								<div className='mt-1 flex flex-wrap gap-1'>
									{(evalCase.assertions ?? []).map((assertion, index) => (
										<span
											key={index}
											className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-500 dark:bg-zinc-800'>
											{assertion.type.replace('_', ' ')}
										</span>
									))}
								</div>
							</div>
							<button
								onClick={() => deleteMutation.mutate(evalCase.id)}
								title='Delete'
								className='shrink-0 text-zinc-400 hover:text-rose-500'>
								<Trash2 size={12} />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Run history */}
			<div className='pt-1'>
				<span className='text-[9px] font-black uppercase tracking-wide text-zinc-400'>
					Eval runs
				</span>
			</div>
			{isRunsLoading ? (
				<p className='py-4 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : (runs ?? []).length === 0 ? (
				<p className='py-4 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					This suite has not been run yet.
				</p>
			) : (
				<div className='space-y-2'>
					{(runs ?? []).map((run) => (
						<EvalRunRow key={run.id} ws={ws} agentId={agentId} suiteId={suite.id} run={run} />
					))}
				</div>
			)}
		</div>
	);
};

/**
 * Eval suites for an agent — graded test cases replayed against the agent
 * and scored by assertions.
 * Backed by {agent}/eval-suites — see AgentEvalSuiteController.
 */
const AgentEvalsPanel = ({ ws, agentId }: TProps) => {
	const [openSuiteId, setOpenSuiteId] = useState<string | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [form, setForm] = useState({ name: '', description: '' });

	const { data: suites, isLoading } = useAgentEvalSuites(ws, agentId ?? '');
	const createMutation = useCreateAgentEvalSuite(ws, agentId ?? '');
	const deleteMutation = useDeleteAgentEvalSuite(ws, agentId ?? '');

	if (!agentId) {
		return (
			<p className='px-1 py-8 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
				Save the agent first to add evals.
			</p>
		);
	}

	const items = suites ?? [];
	const openSuite = items.find((suite) => String(suite.id) === String(openSuiteId));

	if (openSuite) {
		return (
			<SuiteDetail
				ws={ws}
				agentId={agentId}
				suite={openSuite}
				onBack={() => setOpenSuiteId(null)}
			/>
		);
	}

	const resetForm = () => {
		setForm({ name: '', description: '' });
		setIsFormOpen(false);
	};

	const handleSubmit = async () => {
		if (!form.name.trim()) return;
		await createMutation.mutateAsync({
			name: form.name.trim(),
			description: form.description.trim() || null,
		});
		resetForm();
	};

	return (
		<div className='space-y-3'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h4 className='text-xs font-black text-zinc-900 dark:text-white'>Evals</h4>
					<p className='text-[10px] font-semibold text-zinc-400 dark:text-zinc-500'>
						Test suites that grade the agent's replies.
					</p>
				</div>
				<button
					onClick={() => {
						resetForm();
						setIsFormOpen(true);
					}}
					className='flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-black text-primary-600 hover:bg-zinc-50 dark:border-primary-500/20 dark:bg-zinc-900 dark:text-primary-400 dark:hover:bg-zinc-800'>
					<Plus size={10} />
					<span>Add</span>
				</button>
			</div>

			{/* Form */}
			{isFormOpen && (
				<div className='space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
					<div className='flex items-center justify-between'>
						<span className='text-[11px] font-black text-zinc-700 dark:text-zinc-300'>New suite</span>
						<button aria-label='Close' onClick={resetForm} className='text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
							<X size={13} />
						</button>
					</div>
					<input
						type='text'
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
						placeholder='Suite name (e.g. tone regression)'
						className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<textarea
						value={form.description}
						onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
						placeholder='Description (optional)'
						rows={2}
						className='w-full resize-none rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
					/>
					<div className='flex justify-end gap-2'>
						<button
							onClick={resetForm}
							className='rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
							Cancel
						</button>
						<button
							onClick={handleSubmit}
							disabled={createMutation.isPending || !form.name.trim()}
							className='flex items-center gap-1 rounded-lg bg-primary-400 px-3 py-1 text-[10px] font-black text-primary-950 hover:bg-primary-500 disabled:opacity-50'>
							{createMutation.isPending && <Loader2 size={11} className='animate-spin' />}
							Save
						</button>
					</div>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400'>Loading…</p>
			) : items.length === 0 ? (
				<p className='py-6 text-center text-[11px] font-semibold text-zinc-400 dark:text-zinc-500'>
					No eval suites yet.
				</p>
			) : (
				<div className='space-y-2'>
					{items.map((suite) => (
						<div
							key={suite.id}
							className='flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/20 p-3 dark:border-zinc-800 dark:bg-zinc-950/20'>
							<button
								onClick={() => setOpenSuiteId(String(suite.id))}
								className='flex min-w-0 flex-1 items-start gap-3 text-left'>
								<div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-400/10 text-primary-600 dark:bg-primary-400/5 dark:text-primary-400'>
									<FlaskConical size={13} />
								</div>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<span className='truncate text-[11px] font-black text-zinc-800 dark:text-zinc-200'>
											{suite.name}
										</span>
										<span className='shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-zinc-500 dark:bg-zinc-800'>
											{suite.case_count ?? suite.cases?.length ?? 0} cases
										</span>
									</div>
									<p className='mt-0.5 line-clamp-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400'>
										{suite.description || 'No description.'}
									</p>
								</div>
							</button>
							<button
								onClick={() => deleteMutation.mutate(suite.id)}
								title='Delete'
								className='shrink-0 text-zinc-400 hover:text-rose-500'>
								<Trash2 size={12} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AgentEvalsPanel;
