import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Description from '@/components/form/Description';
import { useModelCatalog } from '@/api/modules/catalog';
import type { TAgent, TCreateAgentDto } from '@/types/agent.type';

// ============================================================
// Agent Form Modal
// ------------------------------------------------------------
// Create and edit share one form: the fields are identical, and
// two near-copies would drift the moment one gains a field.
//
// `instructions` is the system prompt and the only required field
// besides the name — it is what the agent actually *is*, so it
// gets the room rather than being a one-line input.
//
// The model comes from the catalog by `model_catalog_id`; the raw
// `provider`/`model` strings are left alone so an agent pinned to
// something outside the catalog isn't silently rewritten by
// opening this form.
// ============================================================

const DEFAULT_TEMPERATURE = 0.7;

interface IAgentFormModalProps {
	/** Null means create. */
	agent: TAgent | null;
	isOpen: boolean;
	onClose: () => void;
	isPending: boolean;
	onSubmit: (payload: TCreateAgentDto) => void;
}

const AgentFormModalPart: FC<IAgentFormModalProps> = ({
	agent,
	isOpen,
	onClose,
	isPending,
	onSubmit,
}) => {
	const { data: models } = useModelCatalog();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [instructions, setInstructions] = useState('');
	const [modelCatalogId, setModelCatalogId] = useState('');
	const [temperature, setTemperature] = useState(String(DEFAULT_TEMPERATURE));

	// Re-seed whenever the modal opens on a different agent — the component
	// stays mounted between openings, so state would otherwise leak from the
	// last agent edited into the next one.
	useEffect(() => {
		if (!isOpen) return;
		setName(agent?.name ?? '');
		setDescription(agent?.description ?? '');
		setInstructions(agent?.instructions ?? '');
		setModelCatalogId(agent?.model_catalog_id ?? '');
		setTemperature(String(agent?.temperature ?? DEFAULT_TEMPERATURE));
	}, [isOpen, agent]);

	const setIsOpen: Dispatch<SetStateAction<boolean>> = (next) => {
		const open = typeof next === 'function' ? next(isOpen) : next;
		if (!open) onClose();
	};

	const parsedTemperature = Number(temperature);
	const isTemperatureValid =
		temperature === '' || (!Number.isNaN(parsedTemperature) && parsedTemperature >= 0 && parsedTemperature <= 2);
	const canSubmit = !!name.trim() && !!instructions.trim() && isTemperatureValid;

	const submit = () => {
		if (!canSubmit) return;
		onSubmit({
			name: name.trim(),
			description: description.trim() || null,
			instructions: instructions.trim(),
			model_catalog_id: modelCatalogId || null,
			temperature: temperature === '' ? null : parsedTemperature,
		});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} rounded='rounded-2xl' isScrollable>
			<ModalHeader>{agent ? `Edit ${agent.name}` : 'New agent'}</ModalHeader>
			<ModalBody className='flex flex-col gap-4'>
				<div>
					<Label htmlFor='agent-name'>Name</Label>
					<Input
						id='agent-name'
						name='agent-name'
						value={name}
						placeholder='Support triage'
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor='agent-description'>Description</Label>
					<Input
						id='agent-description'
						name='agent-description'
						value={description}
						placeholder='What this agent is for'
						onChange={(event) => setDescription(event.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor='agent-instructions'>Instructions</Label>
					<Textarea
						id='agent-instructions'
						name='agent-instructions'
						rows={8}
						value={instructions}
						placeholder='You are a support triage agent. Read the incoming ticket and…'
						onChange={(event) => setInstructions(event.target.value)}
					/>
					<Description id='agent-instructions-help'>
						The system prompt. This is what the agent is told before every
						conversation.
					</Description>
				</div>

				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
					<div>
						<Label htmlFor='agent-model'>Model</Label>
						<Select
							id='agent-model'
							name='agent-model'
							value={modelCatalogId}
							onChange={(event) => setModelCatalogId(event.target.value)}>
							<option value=''>Workspace default</option>
							{(models ?? []).map((model) => (
								<option key={model.id} value={model.id}>
									{model.display_name} · {model.brand}
								</option>
							))}
						</Select>
					</div>

					<div>
						<Label htmlFor='agent-temperature'>Temperature</Label>
						<Input
							id='agent-temperature'
							name='agent-temperature'
							type='number'
							step='0.1'
							min='0'
							max='2'
							value={temperature}
							onChange={(event) => setTemperature(event.target.value)}
						/>
						{!isTemperatureValid && (
							<Description id='agent-temperature-error' className='text-red-500'>
								Must be between 0 and 2.
							</Description>
						)}
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='zinc' isDisable={isPending} onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant='solid'
						isLoading={isPending}
						isDisable={!canSubmit || isPending}
						onClick={submit}>
						{agent ? 'Save' : 'Create agent'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default AgentFormModalPart;
