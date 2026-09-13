import { Dispatch, FC, SetStateAction, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import type { TConnector, TConnectorCredentialScope } from '@/types/connector.type';

// ============================================================
// Connect Credential Modal
// ------------------------------------------------------------
// The manual (non-OAuth) half of connecting an integration.
//
// `Connector.fields` is meant to describe the inputs a provider
// needs, but every connector seeded so far declares `[]` and the
// backend validates `data` as nothing more than `required|array`.
// So this renders the declared fields when there are any and falls
// back to a free-form key/value editor when there aren't — which
// keeps the screen usable today without inventing a schema the
// backend has not committed to yet.
// ============================================================

/** A field entry, parsed defensively — `fields` is `unknown` on the type
 *  because nothing has pinned its shape down yet. */
type TParsedField = {
	key: string;
	label: string;
	type: string;
	required: boolean;
};

const parseFields = (fields: unknown): TParsedField[] => {
	if (!Array.isArray(fields)) return [];
	return fields.flatMap((field) => {
		if (typeof field !== 'object' || field === null) return [];
		const record = field as Record<string, unknown>;
		const key = typeof record.key === 'string' ? record.key : null;
		if (!key) return [];
		return [
			{
				key,
				label: typeof record.label === 'string' ? record.label : key,
				type: typeof record.type === 'string' ? record.type : 'text',
				required: record.required !== false,
			},
		];
	});
};

type TPair = { key: string; value: string };

interface IConnectCredentialModalProps {
	connector: TConnector | null;
	isOpen: boolean;
	onClose: () => void;
	isPending: boolean;
	onSubmit: (payload: {
		name: string;
		data: Record<string, unknown>;
		scope: TConnectorCredentialScope;
	}) => void;
}

const ConnectCredentialModalPart: FC<IConnectCredentialModalProps> = ({
	connector,
	isOpen,
	onClose,
	isPending,
	onSubmit,
}) => {
	const [name, setName] = useState('');
	const [scope, setScope] = useState<TConnectorCredentialScope>('team');
	const [values, setValues] = useState<Record<string, string>>({});
	const [pairs, setPairs] = useState<TPair[]>([{ key: '', value: '' }]);

	const declaredFields = parseFields(connector?.fields);
	const usesPairs = declaredFields.length === 0;

	const data: Record<string, unknown> = usesPairs
		? Object.fromEntries(
				pairs.filter((pair) => pair.key.trim()).map((pair) => [pair.key.trim(), pair.value]),
			)
		: values;

	const isComplete =
		!!name.trim() &&
		Object.keys(data).length > 0 &&
		declaredFields.every((field) => !field.required || !!values[field.key]?.trim());

	const close = () => {
		onClose();
		setName('');
		setValues({});
		setPairs([{ key: '', value: '' }]);
		setScope('team');
	};

	// Modal expects a state setter; the only transition this owns is "closed".
	const setIsOpen: Dispatch<SetStateAction<boolean>> = (next) => {
		const open = typeof next === 'function' ? next(isOpen) : next;
		if (!open) close();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} rounded='rounded-2xl' isScrollable>
			<ModalHeader>Connect {connector?.name ?? 'integration'}</ModalHeader>
			<ModalBody className='flex flex-col gap-4'>
				<div>
					<Label htmlFor='credential-name'>Name</Label>
					<Input
						id='credential-name'
						name='credential-name'
						value={name}
						placeholder={`e.g. ${connector?.name ?? 'Production'} — production`}
						onChange={(event) => setName(event.target.value)}
					/>
				</div>

				<div>
					<Label htmlFor='credential-scope'>Scope</Label>
					<Select
						id='credential-scope'
						name='credential-scope'
						value={scope}
						onChange={(event) =>
							setScope(event.target.value as TConnectorCredentialScope)
						}>
						<option value='team'>Team — everyone in this workspace can use it</option>
						<option value='personal'>Personal — only you can use it</option>
					</Select>
				</div>

				{declaredFields.map((field) => (
					<div key={field.key}>
						<Label htmlFor={`field-${field.key}`}>{field.label}</Label>
						<Input
							id={`field-${field.key}`}
							name={field.key}
							type={field.type === 'password' ? 'password' : 'text'}
							value={values[field.key] ?? ''}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									[field.key]: event.target.value,
								}))
							}
						/>
					</div>
				))}

				{usesPairs && (
					<div className='flex flex-col gap-2'>
						<Label htmlFor='credential-pairs'>Credential values</Label>
						<Alert color='zinc' variant='soft' className='text-sm'>
							This connector doesn&apos;t publish a field list, so enter the keys its
							nodes expect — commonly <code>api_key</code> or <code>token</code>.
						</Alert>
						{pairs.map((pair, index) => (
							// eslint-disable-next-line react/no-array-index-key
							<div key={index} className='flex items-start gap-2'>
								<Input
									name={`pair-key-${index}`}
									className='w-1/3'
									placeholder='key'
									value={pair.key}
									onChange={(event) =>
										setPairs((current) =>
											current.map((item, itemIndex) =>
												itemIndex === index
													? { ...item, key: event.target.value }
													: item,
											),
										)
									}
								/>
								<Input
									name={`pair-value-${index}`}
									type='password'
									placeholder='value'
									value={pair.value}
									onChange={(event) =>
										setPairs((current) =>
											current.map((item, itemIndex) =>
												itemIndex === index
													? { ...item, value: event.target.value }
													: item,
											),
										)
									}
								/>
								<Button
									variant='outline'
									color='zinc'
									icon='Delete02'
									aria-label='Remove field'
									isDisable={pairs.length === 1}
									onClick={() =>
										setPairs((current) =>
											current.filter((_, itemIndex) => itemIndex !== index),
										)
									}
								/>
							</div>
						))}
						<Button
							variant='link'
							color='zinc'
							className='self-start !p-0'
							onClick={() => setPairs((current) => [...current, { key: '', value: '' }])}>
							<span className='flex items-center gap-1'>
								<Icon icon='PlusSignCircle' />
								Add field
							</span>
						</Button>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='zinc' isDisable={isPending} onClick={close}>
						Cancel
					</Button>
					<Button
						variant='solid'
						isLoading={isPending}
						isDisable={!isComplete || isPending}
						onClick={() => onSubmit({ name: name.trim(), data, scope })}>
						Connect
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConnectCredentialModalPart;
