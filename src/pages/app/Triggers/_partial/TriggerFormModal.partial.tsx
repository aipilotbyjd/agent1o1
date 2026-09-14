import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useWorkflows } from '@/api/modules/workflows';
import { useAgents } from '@/api/modules/agents';
import { useTriggerPresets } from '@/api/modules/catalog';
import type { TTriggerMechanism } from '@/types/catalog.type';
import type { TCreateTriggerDto, TTrigger, TTriggerTargetType } from '@/types/trigger.type';
import { MECHANISM_META, TRIGGER_MECHANISMS } from '../_helper/triggers.constants';

// ============================================================
// Trigger form
// ------------------------------------------------------------
// Create takes target_type + target_id + type (plus an optional
// preset and free-form config). Update only accepts `config` and
// `is_active` — see UpdateTriggerRequest — so in edit mode the
// target and mechanism are shown but locked.
// ============================================================

const inputClass =
	'h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300';

export interface ITriggerFormValues extends TCreateTriggerDto {
	configText: string;
}

interface ITriggerFormModalProps {
	ws: string;
	open: boolean;
	target: TTrigger | null;
	isPending: boolean;
	onClose: () => void;
	onSubmit: (values: ITriggerFormValues) => void;
}

const TriggerFormModal = ({
	ws,
	open,
	target,
	isPending,
	onClose,
	onSubmit,
}: ITriggerFormModalProps) => {
	const isEdit = !!target;

	const { data: workflows } = useWorkflows(ws);
	const { data: agents } = useAgents(ws);
	const { data: presets } = useTriggerPresets();

	const [targetType, setTargetType] = useState<TTriggerTargetType>('workflow');
	const [targetId, setTargetId] = useState('');
	const [type, setType] = useState<TTriggerMechanism>('schedule');
	const [presetId, setPresetId] = useState('');
	const [isActive, setIsActive] = useState(true);
	const [configText, setConfigText] = useState('');
	const [configError, setConfigError] = useState('');

	useEffect(() => {
		if (!open) return;
		setTargetType(target?.target_type ?? 'workflow');
		setTargetId(target?.target_id ?? '');
		setType(target?.type ?? 'schedule');
		setPresetId(target?.preset_id ?? '');
		setIsActive(target?.is_active ?? true);
		setConfigText(target?.config ? JSON.stringify(target.config, null, 2) : '');
		setConfigError('');
	}, [open, target]);

	const targets = targetType === 'workflow' ? (workflows ?? []) : (agents ?? []);
	// The catalog groups presets by category; flatten, then keep only the ones
	// that match the chosen mechanism.
	const usablePresets = Object.values(presets ?? {})
		.flat()
		.filter((preset) => preset.type === type && preset.is_active);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		let config: Record<string, unknown> | null = null;
		if (configText.trim()) {
			try {
				config = JSON.parse(configText);
			} catch {
				setConfigError('Config must be valid JSON');
				return;
			}
		}
		if (!isEdit && !targetId) return;

		onSubmit({
			target_type: targetType,
			target_id: targetId,
			type,
			preset_id: presetId || null,
			config,
			is_active: isActive,
			configText,
		});
	};

	return (
		<Modal isOpen={open} setIsOpen={onClose} size='sm' isScrollable>
			<ModalHeader setIsOpen={onClose}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<Zap size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							{isEdit ? 'Edit trigger' : 'New trigger'}
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{isEdit
								? 'Only the configuration and active state can change.'
								: 'Pick what runs, and what starts it.'}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<form onSubmit={handleSubmit} className='grid gap-4 pt-2'>
					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<label className={labelClass} htmlFor='trigger-target-type'>
								Runs
							</label>
							<select
								id='trigger-target-type'
								className={inputClass}
								disabled={isEdit}
								value={targetType}
								onChange={(e) => {
									setTargetType(e.target.value as TTriggerTargetType);
									setTargetId('');
								}}>
								<option value='workflow'>Workflow</option>
								<option value='agent'>Agent</option>
							</select>
						</div>
						<div>
							<label className={labelClass} htmlFor='trigger-target-id'>
								{targetType === 'workflow' ? 'Workflow' : 'Agent'}
							</label>
							<select
								id='trigger-target-id'
								className={inputClass}
								disabled={isEdit}
								value={targetId}
								onChange={(e) => setTargetId(e.target.value)}>
								<option value=''>Select…</option>
								{targets.map((item) => (
									<option key={item.id} value={item.id}>
										{item.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className={labelClass} htmlFor='trigger-type'>
							Started by
						</label>
						<select
							id='trigger-type'
							className={inputClass}
							disabled={isEdit}
							value={type}
							onChange={(e) => {
								setType(e.target.value as TTriggerMechanism);
								setPresetId('');
							}}>
							{TRIGGER_MECHANISMS.map((mechanism) => (
								<option key={mechanism} value={mechanism}>
									{MECHANISM_META[mechanism].label}
								</option>
							))}
						</select>
						<p className='mt-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
							{MECHANISM_META[type].description}
						</p>
					</div>

					{usablePresets.length > 0 && (
						<div>
							<label className={labelClass} htmlFor='trigger-preset'>
								Preset <span className='font-normal text-zinc-400'>(optional)</span>
							</label>
							<select
								id='trigger-preset'
								className={inputClass}
								disabled={isEdit}
								value={presetId}
								onChange={(e) => setPresetId(e.target.value)}>
								<option value=''>None</option>
								{usablePresets.map((preset) => (
									<option key={preset.id} value={preset.id}>
										{preset.name}
									</option>
								))}
							</select>
						</div>
					)}

					<div>
						<label className={labelClass} htmlFor='trigger-config'>
							Config{' '}
							<span className='font-normal text-zinc-400'>
								(JSON — e.g. {`{ "cron": "0 9 * * *" }`})
							</span>
						</label>
						<textarea
							id='trigger-config'
							rows={5}
							placeholder='{}'
							className={`${inputClass} h-auto py-3 font-mono text-xs`}
							value={configText}
							onChange={(e) => {
								setConfigText(e.target.value);
								setConfigError('');
							}}
						/>
						{configError && (
							<p className='mt-1.5 text-xs font-semibold text-red-500'>
								{configError}
							</p>
						)}
					</div>

					<label className='flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40'>
						<input
							type='checkbox'
							checked={isActive}
							onChange={(e) => setIsActive(e.target.checked)}
							className='h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/20'
						/>
						<span className='text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
							Active
						</span>
					</label>

					<div className='flex justify-end gap-2.5 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isPending || (!isEdit && !targetId)}
							className='inline-flex h-11 items-center justify-center rounded-xl bg-primary-400 px-5 text-sm font-bold text-primary-950 shadow-sm transition hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60'>
							{isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create trigger'}
						</button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
};

export default TriggerFormModal;
