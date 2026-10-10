import { useState } from 'react';
import { Link2 } from 'lucide-react';
import Modal from './Modal.partial';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { canExposeInput } from '../../_helper/dynamicInputs.helper';
import type { TNodeField } from '../../_types/node.type';

type Props = { nodeId: string; fields: TNodeField[]; onClose: () => void };

const ConfigureInputsDialog = ({ nodeId, fields, onClose }: Props) => {
	const { state, dispatch } = useWorkflowEditor();
	const node = state.nodes.find((item) => item.id === nodeId);
	const [keys, setKeys] = useState<string[]>(node?.data.dynamicInputKeys ?? []);
	const parameters = fields.filter(canExposeInput);
	return (
		<Modal title='Configure Inputs' onClose={onClose} size='md'>
			<div className='flex flex-col gap-4 text-sm text-zinc-800 dark:text-zinc-200'>
				<p className='text-sm text-zinc-500 dark:text-zinc-400'>
					Choose which parameters can receive values from previous nodes. Enable a
					parameter, then connect an output to its input or insert an upstream variable.
				</p>
				<div className='flex max-h-[350px] flex-col gap-2 overflow-y-auto'>
					{parameters.map((field) => {
						const enabled = keys.includes(field.key);
						return (
							<label
								key={field.key}
								className='flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800'>
								<Link2
									size={16}
									className={enabled ? 'text-primary-500' : 'text-zinc-400'}
								/>
								<span className='min-w-0 flex-1'>
									<span className='block font-semibold'>
										{field.label}
										{field.required && (
											<span className='ml-1 text-rose-500'>*</span>
										)}
									</span>
									{field.help && (
										<span className='block text-xs text-zinc-500'>
											{field.help}
										</span>
									)}
									<span className='mt-1 block text-xs text-zinc-400'>
										{enabled ? 'Dynamic input' : 'Use configured value'}
									</span>
								</span>
								<input
									type='checkbox'
									role='switch'
									aria-label={`Use ${field.label} as dynamic input`}
									checked={enabled}
									onChange={() =>
										setKeys((previous) =>
											enabled
												? previous.filter((key) => key !== field.key)
												: [...previous, field.key],
										)
									}
									className='text-primary-500 focus:ring-primary-500 size-4 rounded border-zinc-300'
								/>
							</label>
						);
					})}
					{parameters.length === 0 && (
						<p className='py-6 text-center text-zinc-500'>
							This node has no parameters to expose as dynamic inputs.
						</p>
					)}
				</div>
				<div className='flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold dark:bg-zinc-800'>
						Cancel
					</button>
					<button
						type='button'
						onClick={() => {
							dispatch({ type: 'CONFIGURE_NODE_INPUTS', id: nodeId, keys });
							onClose();
						}}
						className='bg-primary-400 text-primary-950 rounded-lg px-5 py-2 text-xs font-bold'>
						Save Inputs
					</button>
				</div>
			</div>
		</Modal>
	);
};
export default ConfigureInputsDialog;
