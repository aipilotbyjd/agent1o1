import { useState } from 'react';
import { KeyRound, SlidersHorizontal } from 'lucide-react';
import { useWorkflowEditor } from '../../../_hooks/useWorkflowEditor.hook';
import AccountSelect from './AccountSelect.partial';
import ConfigureInputsDialog from '../../dialogs/ConfigureInputsDialog.partial';
import type { TNodeField } from '../../../_types/node.type';

type Props = {
	nodeId: string;
	fields: TNodeField[];
	credentialField?: TNodeField;
	credentialId?: string;
};

/**
 * Floating "More Options" rail mirroring Gumloop — mounted on the left of the
 * node (mirrors NodeIOPanel on the right). Lets a node's credential be swapped
 * without opening the full link-credentials dialog, and surfaces Configure Inputs.
 */
const NodeOptionsPanel = ({ nodeId, fields, credentialField, credentialId }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const [configureOpen, setConfigureOpen] = useState(false);

	return (
		<div className='pointer-events-none absolute top-0 right-[348px] z-10 flex w-[280px] flex-col'>
			{/* Transparent hover bridge so moving from node → panel keeps the reveal open */}
			<span className='pointer-events-auto absolute top-0 -right-6 h-full w-6' />
			{/* Connector nub linking the panel back to the node */}
			<span className='pointer-events-none absolute top-7 -right-[26px] h-px w-[26px] bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700' />

			<div className='pointer-events-auto flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/50'>
				<section className='flex flex-col gap-3 p-3.5'>
					<div className='flex items-center gap-2'>
						<span className='flex size-6 items-center justify-center rounded-lg bg-zinc-500/12 text-zinc-500 dark:text-zinc-400'>
							<SlidersHorizontal size={13} />
						</span>
						<span className='text-[12px] font-bold text-zinc-800 dark:text-zinc-100'>
							More Options
						</span>
					</div>

					{credentialField && (
						<div className='flex flex-col gap-1.5'>
							<span className='flex items-center gap-1 text-[10px] font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400'>
								<KeyRound size={10} />
								Credentials to use
							</span>
							<AccountSelect
								connectorKey={credentialField.credentialType}
								value={credentialId}
								onChange={(value) =>
									dispatch({
										type: 'UPDATE_NODE_VALUE',
										id: nodeId,
										fieldKey: credentialField.key,
										value,
									})
								}
							/>
						</div>
					)}

					<button
						type='button'
						onPointerDown={(event) => event.stopPropagation()}
						onClick={(event) => {
							event.stopPropagation();
							setConfigureOpen(true);
						}}
						className='nodrag flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						<SlidersHorizontal size={12} />
						Configure Inputs
					</button>
				</section>
			</div>

			{configureOpen && (
				<ConfigureInputsDialog
					nodeId={nodeId}
					fields={fields}
					onClose={() => setConfigureOpen(false)}
				/>
			)}
		</div>
	);
};

export default NodeOptionsPanel;
