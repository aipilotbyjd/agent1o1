import { useId } from 'react';
import type { ReactNode } from 'react';

// The builder panels' form controls, so every panel reads the same.

export const panelInputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

export const PanelSection = ({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) => (
	<section className='space-y-3 border-b border-zinc-100 px-4 py-4 last:border-b-0 dark:border-white/[0.06]'>
		{(title || action) && (
			<div className='flex items-center justify-between gap-2'>
				{title && (
					<h3 className='text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
						{title}
					</h3>
				)}
				{action}
			</div>
		)}
		{children}
	</section>
);

export const PanelField = ({
	label,
	hint,
	children,
	htmlFor,
}: {
	label: string;
	hint?: ReactNode;
	children: ReactNode;
	htmlFor?: string;
}) => (
	<div className='space-y-1.5'>
		<label htmlFor={htmlFor} className='block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
			{label}
		</label>
		{children}
		{hint && <p className='text-[10px] leading-snug text-zinc-400 dark:text-zinc-500'>{hint}</p>}
	</div>
);

export const PanelText = ({
	label,
	value,
	onChange,
	placeholder,
	hint,
	multiline,
	rows = 4,
	mono,
	type = 'text',
}: {
	label: string;
	value: string | null | undefined;
	onChange: (value: string) => void;
	placeholder?: string;
	hint?: ReactNode;
	multiline?: boolean;
	rows?: number;
	mono?: boolean;
	type?: 'text' | 'url' | 'number' | 'password';
}) => {
	const id = useId();
	return (
		<PanelField label={label} hint={hint} htmlFor={id}>
			{multiline ? (
				<textarea
					id={id}
					rows={rows}
					value={value ?? ''}
					placeholder={placeholder}
					onChange={(e) => onChange(e.target.value)}
					className={`${panelInputClass} resize-y leading-relaxed ${mono ? 'font-mono' : ''}`}
				/>
			) : (
				<input
					id={id}
					type={type}
					value={value ?? ''}
					placeholder={placeholder}
					onChange={(e) => onChange(e.target.value)}
					className={`${panelInputClass} ${mono ? 'font-mono' : ''}`}
				/>
			)}
		</PanelField>
	);
};

export const Segmented = <T extends string | number>({
	label,
	value,
	options,
	onChange,
}: {
	label?: string;
	value: T;
	options: { value: T; label: ReactNode; title?: string }[];
	onChange: (value: T) => void;
}) => {
	const control = (
		<div
			role='radiogroup'
			aria-label={label}
			className='flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-white/10 dark:bg-zinc-900'>
			{options.map((option) => {
				const active = option.value === value;
				return (
					<button
						key={String(option.value)}
						type='button'
						role='radio'
						aria-checked={active}
						title={option.title}
						onClick={() => onChange(option.value)}
						className={`flex h-7 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1.5 text-[11px] font-semibold transition ${
							active
								? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-white/10'
								: 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
						}`}>
						{option.label}
					</button>
				);
			})}
		</div>
	);
	return label ? <PanelField label={label}>{control}</PanelField> : control;
};

export const Toggle = ({
	label,
	checked,
	onChange,
	hint,
}: {
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
	hint?: ReactNode;
}) => (
	<div className='flex items-start justify-between gap-3'>
		<div className='min-w-0'>
			<p className='text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>{label}</p>
			{hint && <p className='mt-0.5 text-[10px] leading-snug text-zinc-400 dark:text-zinc-500'>{hint}</p>}
		</div>
		<button
			type='button'
			role='switch'
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange(!checked)}
			className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
				checked ? 'bg-primary-500' : 'bg-zinc-200 dark:bg-zinc-700'
			}`}>
			<span
				className={`inline-block size-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
			/>
		</button>
	</div>
);

export const PanelSelect = ({
	label,
	value,
	onChange,
	options,
	hint,
	placeholder,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: { value: string; label: string; disabled?: boolean }[];
	hint?: ReactNode;
	placeholder?: string;
}) => {
	const id = useId();
	return (
		<PanelField label={label} hint={hint} htmlFor={id}>
			<select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={panelInputClass}>
				{placeholder !== undefined && <option value=''>{placeholder}</option>}
				{options.map((option) => (
					<option key={option.value} value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		</PanelField>
	);
};
