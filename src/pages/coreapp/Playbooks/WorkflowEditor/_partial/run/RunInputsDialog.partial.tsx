import { useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import Modal from '../dialogs/Modal.partial';
import RunFormFields from './RunFormFields.partial';
import type { TRunFormValues } from '../../_helper/runForm.helper';

type Props = {
	fields: TWorkflowInterfaceField[];
	initialValues: TRunFormValues;
	submitting: boolean;
	errors: Record<string, string>;
	onSubmit: (values: TRunFormValues) => void;
	onCancel: () => void;
};

const RunInputsDialog = ({
	fields,
	initialValues,
	submitting,
	errors,
	onSubmit,
	onCancel,
}: Props) => {
	const [values, setValues] = useState(initialValues);

	return (
		<Modal title='Run workflow' size='sm' onClose={onCancel}>
			<form
				noValidate
				onSubmit={(event) => {
					event.preventDefault();
					onSubmit(values);
				}}
				className='space-y-4'>
				<p className='text-xs text-zinc-500 dark:text-zinc-400'>
					This workflow asks for {fields.length === 1 ? 'a value' : 'a few values'} before
					it starts.
				</p>
				<RunFormFields
					fields={fields}
					values={values}
					errors={errors}
					idPrefix='run-input'
					onChange={(key, value) =>
						setValues((current) => ({ ...current, [key]: value }))
					}
				/>
				<div className='flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-white/[0.06]'>
					<button
						type='button'
						onClick={onCancel}
						className='rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/[0.05]'>
						Cancel
					</button>
					<button
						type='submit'
						disabled={submitting}
						className='dark:bg-primary-400 dark:text-primary-950 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:brightness-110'>
						{submitting ? (
							<Loader2 size={13} className='animate-spin' />
						) : (
							<Play size={13} />
						)}
						Run
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default RunInputsDialog;
