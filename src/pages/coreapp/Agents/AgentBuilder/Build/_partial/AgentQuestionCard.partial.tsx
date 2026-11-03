import { useState, type FormEvent } from 'react';
import { Check, Clock, MessageCircleQuestionMark, SkipForward } from 'lucide-react';
import type {
	TAgentAction,
	TAgentActionDecision,
	TUserQuestion,
	TUserQuestionAnswer,
	TUserQuestionField,
} from '@/types/agent-action.type';

/** A question action's arguments, defensively: older or odd payloads still render. */
const questionOf = (action: TAgentAction): TUserQuestion => {
	const args = (action.arguments ?? {}) as Partial<TUserQuestion>;
	return {
		question: typeof args.question === 'string' ? args.question : 'The agent has a question.',
		options: Array.isArray(args.options) ? args.options : [],
		multiple: Boolean(args.multiple),
		allow_other: args.allow_other ?? true,
		fields: Array.isArray(args.fields) ? args.fields : [],
	};
};

const expiresLabel = (expiresAt: string | null) => {
	if (!expiresAt) return null;
	const minutes = Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000);
	if (minutes <= 0) return 'Expiring';
	if (minutes < 60) return `${minutes}m left`;
	const hours = Math.round(minutes / 60);
	return hours < 48 ? `${hours}h left` : `${Math.round(hours / 24)}d left`;
};

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] font-semibold text-zinc-800 outline-none focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200';

const FormField = ({
	field,
	value,
	onChange,
	idPrefix,
}: {
	field: TUserQuestionField;
	value: string | boolean;
	onChange: (value: string | boolean) => void;
	idPrefix: string;
}) => {
	const id = `${idPrefix}-${field.name}`;

	if (field.type === 'checkbox') {
		return (
			<label
				htmlFor={id}
				className='flex min-h-9 items-center gap-2 text-[12.5px] font-semibold text-zinc-700 dark:text-zinc-200'>
				<input
					id={id}
					type='checkbox'
					checked={value === true}
					onChange={(event) => onChange(event.target.checked)}
				/>
				{field.label}
			</label>
		);
	}

	return (
		<div className='min-w-0'>
			<label
				htmlFor={id}
				className='mb-1 block text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400'>
				{field.label}
				{field.required && <span className='text-rose-500'> *</span>}
			</label>
			{field.type === 'textarea' ? (
				<textarea
					id={id}
					rows={3}
					value={String(value)}
					required={field.required}
					placeholder={field.placeholder ?? undefined}
					onChange={(event) => onChange(event.target.value)}
					className={inputClass}
				/>
			) : field.type === 'select' ? (
				<select
					id={id}
					value={String(value)}
					required={field.required}
					onChange={(event) => onChange(event.target.value)}
					className={inputClass}>
					<option value=''>Choose…</option>
					{field.options.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			) : (
				<input
					id={id}
					type={
						field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'
					}
					step={field.type === 'number' ? 'any' : undefined}
					value={String(value)}
					required={field.required}
					placeholder={field.placeholder ?? undefined}
					onChange={(event) => onChange(event.target.value)}
					className={inputClass}
				/>
			)}
		</div>
	);
};

/**
 * A question the agent stopped to ask (`ask_user`): buttons for its options,
 * a text box, or a small form. Answering resumes the agent's turn with the
 * answer; skipping lets it carry on with its best guess. Writing a new
 * message in the chat instead also works: the agent reads it as the reply.
 */
const AgentQuestionCard = ({
	action,
	busy,
	onDecide,
}: {
	action: TAgentAction;
	busy: boolean;
	onDecide: (decision: TAgentActionDecision) => void;
}) => {
	const question = questionOf(action);
	const isForm = question.fields.length > 0;
	const hasOptions = question.options.length > 0;
	const [picked, setPicked] = useState<string[]>([]);
	const [text, setText] = useState('');
	const [values, setValues] = useState<Record<string, string | boolean>>(() =>
		Object.fromEntries(
			question.fields.map((field) => [field.name, field.type === 'checkbox' ? false : '']),
		),
	);
	const expires = expiresLabel(action.expires_at);

	const answer = (value: TUserQuestionAnswer) =>
		onDecide({ action_id: action.id, decision: 'answer', answer: value });

	const submit = (event: FormEvent) => {
		event.preventDefault();
		if (isForm) {
			answer(
				Object.fromEntries(
					question.fields.map((field) => {
						const value = values[field.name];
						return [
							field.name,
							typeof value === 'string' ? value.trim() || null : value,
						];
					}),
				),
			);
			return;
		}
		if (question.multiple) {
			const extra = text.trim();
			answer(extra ? [...picked, extra] : picked);
			return;
		}
		if (text.trim()) answer(text.trim());
	};

	const canSubmit = isForm
		? question.fields.every(
				(field) =>
					!field.required ||
					field.type === 'checkbox' ||
					String(values[field.name] ?? '').trim() !== '',
			)
		: question.multiple
			? picked.length > 0 || text.trim() !== ''
			: text.trim() !== '';

	const showTextBox = !isForm && (!hasOptions || question.allow_other);

	return (
		<form
			onSubmit={submit}
			className='border-primary-200 bg-primary-50/40 dark:border-primary-900/60 dark:bg-primary-950/20 rounded-2xl border p-3.5'>
			<div className='flex items-start gap-2'>
				<MessageCircleQuestionMark
					size={15}
					className='text-primary-600 dark:text-primary-400 mt-0.5 shrink-0'
				/>
				<p className='min-w-0 flex-1 text-[13.5px] leading-relaxed font-bold [overflow-wrap:anywhere] whitespace-pre-line text-zinc-800 dark:text-zinc-100'>
					{question.question}
				</p>
				{expires && (
					<span className='flex shrink-0 items-center gap-1 text-[11px] font-semibold text-zinc-400'>
						<Clock size={11} /> {expires}
					</span>
				)}
			</div>

			{hasOptions && !isForm && (
				<div className='mt-3 flex flex-wrap gap-2' role='group' aria-label='Answers'>
					{question.options.map((option) => {
						const selected = picked.includes(option);
						return (
							<button
								key={option}
								type='button'
								disabled={busy}
								aria-pressed={question.multiple ? selected : undefined}
								onClick={() =>
									question.multiple
										? setPicked((current) =>
												current.includes(option)
													? current.filter((value) => value !== option)
													: [...current, option],
											)
										: answer(option)
								}
								className={`min-h-9 rounded-lg border px-3 text-[12.5px] font-bold transition-colors disabled:opacity-50 ${
									selected
										? 'border-primary-500 bg-primary-500 text-white'
										: 'hover:border-primary-400 border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
								}`}>
								{question.multiple && selected && (
									<Check size={12} className='mr-1 inline' />
								)}
								{option}
							</button>
						);
					})}
				</div>
			)}

			{isForm && (
				<div className='mt-3 grid gap-2.5 sm:grid-cols-2'>
					{question.fields.map((field) => (
						<div
							key={field.name}
							className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
							<FormField
								field={field}
								idPrefix={`question-${action.id}`}
								value={values[field.name] ?? ''}
								onChange={(value) =>
									setValues((current) => ({ ...current, [field.name]: value }))
								}
							/>
						</div>
					))}
				</div>
			)}

			{showTextBox && (
				<input
					aria-label={hasOptions ? 'Or type your own answer' : 'Your answer'}
					value={text}
					onChange={(event) => setText(event.target.value)}
					maxLength={5000}
					placeholder={hasOptions ? 'Or type your own answer…' : 'Type your answer…'}
					className={`mt-3 ${inputClass}`}
				/>
			)}

			<div className='mt-3 flex flex-wrap items-center gap-2'>
				{(isForm || showTextBox || question.multiple) && (
					<button
						type='submit'
						disabled={busy || !canSubmit}
						className='bg-primary-600 hover:bg-primary-700 flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-white disabled:opacity-50'>
						<Check size={13} /> Send answer
					</button>
				)}
				<button
					type='button'
					disabled={busy}
					onClick={() => onDecide({ action_id: action.id, decision: 'reject' })}
					className='flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800'>
					<SkipForward size={13} /> Skip
				</button>
			</div>
		</form>
	);
};

export default AgentQuestionCard;
