import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageBlockProps } from '@/types/workflow-page.type';

export const pageInputClass =
	'w-full rounded-[calc(var(--pg-radius)*0.7)] border border-[var(--pg-border)] bg-[var(--pg-surface)] px-3 py-2 text-sm text-[var(--pg-text)] outline-none transition placeholder:text-[var(--pg-muted)] focus:border-[var(--pg-accent)] focus:ring-4 focus:ring-[var(--pg-accent-soft)] disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-500';

type Props = {
	id: string;
	field: TWorkflowInterfaceField;
	props: TPageBlockProps['field'];
	value: unknown;
	error?: string;
	disabled?: boolean;
	onChange: (value: unknown) => void;
};

/** How a field is drawn: what the author picked, or what suits its type. */
const resolveVariant = (field: TWorkflowInterfaceField, variant: Props['props']['variant']) => {
	const fits: Record<string, Props['props']['variant'][]> = {
		string: ['input', 'textarea'],
		text: ['textarea', 'input'],
		number: ['input'],
		boolean: ['checkbox', 'switch'],
		select: ['dropdown', 'radio'],
		json: ['textarea'],
	};
	const allowed = fits[field.type] ?? ['input'];
	return variant !== 'auto' && allowed.includes(variant) ? variant : allowed[0];
};

const PageField = ({ id, field, props, value, error, disabled, onChange }: Props) => {
	const label = props.label || field.label || field.key;
	const help = props.help || field.help;
	const variant = resolveVariant(field, props.variant);
	const describedBy = error ? `${id}-error` : help ? `${id}-help` : undefined;

	const common = {
		id,
		disabled,
		'aria-invalid': Boolean(error),
		'aria-describedby': describedBy,
	};

	const control = (() => {
		if (field.type === 'boolean') {
			const checked = Boolean(value);
			return variant === 'switch' ? (
				<button
					type='button'
					role='switch'
					aria-checked={checked}
					aria-labelledby={`${id}-label`}
					disabled={disabled}
					onClick={() => onChange(!checked)}
					className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
						checked ? 'bg-[var(--pg-accent)]' : 'bg-[var(--pg-border)]'
					}`}>
					<span
						className={`inline-block size-5 rounded-full bg-white shadow transition ${
							checked ? 'translate-x-5' : 'translate-x-0.5'
						}`}
					/>
				</button>
			) : (
				<input
					{...common}
					type='checkbox'
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className='size-4 shrink-0 accent-[var(--pg-accent)]'
				/>
			);
		}

		if (field.type === 'select') {
			const options = field.options ?? [];
			if (variant === 'radio') {
				return (
					<div
						role='radiogroup'
						aria-labelledby={`${id}-label`}
						aria-describedby={describedBy}
						className='grid gap-2 @md:grid-cols-2'>
						{options.map((option) => {
							const selected = String(value ?? '') === option.value;
							return (
								<label
									key={option.value}
									className={`flex cursor-pointer items-center gap-2.5 rounded-[calc(var(--pg-radius)*0.7)] border px-3 py-2.5 text-sm transition ${
										selected
											? 'border-[var(--pg-accent)] bg-[var(--pg-accent-soft)] font-semibold'
											: 'border-[var(--pg-border)] bg-[var(--pg-surface)] hover:border-[var(--pg-muted)]'
									}`}>
									<input
										type='radio'
										name={id}
										value={option.value}
										checked={selected}
										disabled={disabled}
										onChange={() => onChange(option.value)}
										className='accent-[var(--pg-accent)]'
									/>
									{option.label || option.value}
								</label>
							);
						})}
					</div>
				);
			}
			return (
				<select
					{...common}
					value={String(value ?? '')}
					onChange={(e) => onChange(e.target.value)}
					className={pageInputClass}>
					<option value=''>{props.placeholder || 'Choose…'}</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label || option.value}
						</option>
					))}
				</select>
			);
		}

		if (variant === 'textarea') {
			return (
				<textarea
					{...common}
					rows={field.type === 'json' ? 6 : 4}
					value={String(value ?? '')}
					placeholder={props.placeholder ?? (field.type === 'json' ? '{ }' : undefined)}
					onChange={(e) => onChange(e.target.value)}
					className={`${pageInputClass} resize-y ${field.type === 'json' ? 'font-mono text-xs' : ''}`}
				/>
			);
		}

		return (
			<input
				{...common}
				type={field.type === 'number' ? 'number' : 'text'}
				inputMode={field.type === 'number' ? 'decimal' : undefined}
				value={String(value ?? '')}
				placeholder={props.placeholder ?? undefined}
				onChange={(e) => onChange(e.target.value)}
				className={pageInputClass}
			/>
		);
	})();

	const inline = field.type === 'boolean';

	return (
		<div className='space-y-1.5'>
			{inline ? (
				<label
					id={`${id}-label`}
					htmlFor={variant === 'switch' ? undefined : id}
					className='flex cursor-pointer items-center gap-3 text-sm font-semibold'>
					{control}
					<span>
						{label}
						{field.required && <span className='text-rose-500'> *</span>}
					</span>
				</label>
			) : (
				<>
					<label
						id={`${id}-label`}
						htmlFor={variant === 'radio' ? undefined : id}
						className='block text-sm font-semibold'>
						{label}
						{field.required && <span className='text-rose-500'> *</span>}
					</label>
					{control}
				</>
			)}
			{error ? (
				<p id={`${id}-error`} className='text-xs font-medium text-rose-500'>
					{error}
				</p>
			) : (
				help && (
					<p id={`${id}-help`} className='text-xs text-[var(--pg-muted)]'>
						{help}
					</p>
				)
			)}
		</div>
	);
};

export default PageField;
