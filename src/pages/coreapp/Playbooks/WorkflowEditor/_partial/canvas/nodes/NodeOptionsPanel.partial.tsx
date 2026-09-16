import { useState } from 'react';
import { KeyRound, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useCredentials, useRefreshCredentialToken } from '@/api/modules/credentials';
import { useWorkflowRouteParams } from '../../../_hooks/useWorkflowRouteParams.hook';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
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
	const { workspaceId } = useWorkflowRouteParams();
	const [configureOpen, setConfigureOpen] = useState(false);

	const { data: credentials = [], isLoading } = useCredentials(
		workspaceId,
		credentialField?.credentialType
			? { type: credentialField.credentialType, per_page: 100 }
			: { per_page: 100 },
	);
	const refreshToken = useRefreshCredentialToken(workspaceId);

	const selected = credentials.find((credential) => credential.id === credentialId);

	return (
		<div className='pointer-events-none absolute top-0 right-[348px] z-10 flex w-[280px] flex-col'>
			{/* Transparent hover bridge so moving from node → panel keeps the reveal open */}
			<span className='pointer-events-auto absolute top-0 -right-6 h-full w-6' />
			{/* Connector nub linking the panel back to the node */}
			<span className='pointer-events-none absolute top-7 -right-[26px] h-px w-[26px] bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700' />

			<div className='pointer-events-auto flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/50'>
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
							<div className='flex items-center gap-1.5'>
								<select
									value={credentialId ?? ''}
									onPointerDown={(event) => event.stopPropagation()}
									onChange={(event) =>
										dispatch({
											type: 'UPDATE_NODE_VALUE',
											id: nodeId,
											fieldKey: credentialField.key,
											value: event.target.value || undefined,
										})
									}
									disabled={isLoading}
									className='nodrag w-full flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 outline-none transition focus:border-primary-400 focus:bg-white disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200'>
									<option value=''>Use Personal Default</option>
									{credentials.map((credential) => (
										<option key={credential.id} value={credential.id}>
											{credential.name}
										</option>
									))}
								</select>
								<button
									type='button'
									title='Refresh credential token'
									disabled={!credentialId || refreshToken.isPending}
									onPointerDown={(event) => event.stopPropagation()}
									onClick={(event) => {
										event.stopPropagation();
										if (credentialId) refreshToken.mutate(credentialId);
									}}
									className='nodrag flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800'>
									<RefreshCw
										size={12}
										className={refreshToken.isPending ? 'animate-spin' : ''}
									/>
								</button>
							</div>
							<span className='text-[10px] font-medium text-zinc-400 dark:text-zinc-500'>
								Currently {selected ? selected.name : 'none'}
							</span>
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
