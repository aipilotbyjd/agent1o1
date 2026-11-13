import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TRunFormValues } from '@/utils/runForm.util';

const inputClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';

type Props = {
	fields: TWorkflowInterfaceField[];
	values: TRunFormValues;
	errors?: Record<string, string>;
	idPrefix: string;
	onChange: (key: string, value: unknown) => void;
};

const RunFormFields = ({ fields, values, errors = {}, idPrefix, onChange }: Props) => (
	<>
		{fields.map((field) => {
			const id = `${idPrefix}-${field.key}`;
			const value = values[field.key];
			const error = errors[field.key];
			const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;
			const setValue = (next: unknown) => onChange(field.key, next);
			return (
				<div key={field.key} className='space-y-1'>
					{field.type === 'boolean' ? (
						<label
							htmlFor={id}
							className='flex items-center gap-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
							<input
								id={id}
								type='checkbox'
								checked={Boolean(value)}
								aria-describedby={describedBy}
								onChange={(e) => setValue(e.target.checked)}
							/>
							{field.label || field.key}
						</label>
					) : (
						<label
							htmlFor={id}
							className='block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
							{field.label || field.key}
							{field.required && <span className='text-rose-500'> *</span>}
						</label>
					)}
					{field.type === 'boolean' ? null : field.type === 'select' ? (
						<select
							id={id}
							value={String(value ?? '')}
							required={field.required}
							aria-invalid={Boolean(error)}
							aria-describedby={describedBy}
							onChange={(e) => setValue(e.target.value)}
							className={inputClass}>
							<option value=''>Select…</option>
							{(field.options ?? []).map((option) => (
								<option key={option.value} value={option.value}>
									{option.label || option.value}
								</option>
							))}
						</select>
					) : field.type === 'text' || field.type === 'json' ? (
						<textarea
							id={id}
							rows={field.type === 'json' ? 4 : 3}
							value={String(value ?? '')}
							required={field.required}
							aria-invalid={Boolean(error)}
							aria-describedby={describedBy}
							onChange={(e) => setValue(e.target.value)}
							className={`${inputClass} ${field.type === 'json' ? 'font-mono' : ''}`}
						/>
					) : (
						<input
							id={id}
							type={field.type === 'number' ? 'number' : 'text'}
							value={String(value ?? '')}
							required={field.required}
							aria-invalid={Boolean(error)}
							aria-describedby={describedBy}
							onChange={(e) => setValue(e.target.value)}
							className={inputClass}
						/>
					)}
					{error ? (
						<p id={`${id}-error`} className='text-[10px] text-rose-500'>
							{error}
						</p>
					) : (
						field.help && (
							<p id={`${id}-help`} className='text-[10px] text-zinc-400'>
								{field.help}
							</p>
						)
					)}
				</div>
			);
		})}
	</>
);

export default RunFormFields;
