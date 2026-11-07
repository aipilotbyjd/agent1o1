import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { useWorkflowEditor } from '../../_hooks/useWorkflowEditor.hook';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import AccountSelect from '../canvas/nodes/AccountSelect.partial';
import Modal from './Modal.partial';
import { useCredentialResolver } from '../../_hooks/useCredentialResolver.hook';

const CredentialFlow = () => {
	const { state, dispatch } = useWorkflowEditor();
	const [selectedNodeId, setSelectedNodeId] = useState(state.ui.linkCredentialsNodeId);
	const { isMissing: isCredentialMissing } = useCredentialResolver();
	const close = () => dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: false });
	const candidates = state.nodes.flatMap((node) => {
		const def = getNodeDefinition(node.data.defKey, node.data.definition);
		const field = def?.fields.find((item) => item.kind === 'credential');
		return field ? [{ node, field }] : [];
	});
	const target = candidates.find(({ node }) => node.id === selectedNodeId);
	const missing = candidates.filter(({ node }) =>
		isCredentialMissing(
			getNodeDefinition(node.data.defKey, node.data.definition),
			node.data.values,
		),
	);
	const returnToOverview = () => {
		if (state.ui.linkCredentialsNodeId) close();
		else setSelectedNodeId(null);
	};
	if (target)
		return (
			<AccountSelect
				key={target.node.id}
				popupOnly
				connectorKey={target.field.credentialType}
				value={target.node.data.values[target.field.key] as string | undefined}
				onChange={(credentialId) =>
					dispatch({
						type: 'UPDATE_NODE_VALUE',
						id: target.node.id,
						fieldKey: target.field.key,
						value: credentialId,
					})
				}
				onClose={returnToOverview}
			/>
		);
	return (
		<Modal title='Please link your accounts' onClose={close} size='sm'>
			<p className='text-xs leading-normal text-zinc-500 dark:text-zinc-400'>
				The following credentials need to be authenticated to run the flow:
			</p>
			<div className='mt-5 max-h-[350px] space-y-3 overflow-y-auto'>
				{missing.map(({ node, field }) => (
					<div
						key={node.id}
						className='flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40'>
						<Link2 size={20} className='shrink-0 text-zinc-400' />
						<div className='min-w-0 flex-1'>
							<div className='text-sm font-semibold'>{node.data.label}</div>
							<div className='mt-1 text-xs text-zinc-500'>
								{field.credentialType} · No account selected
							</div>
						</div>
						<button
							type='button'
							aria-label={`Link account for ${node.data.label}`}
							onClick={() => setSelectedNodeId(node.id)}
							className='rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-800'>
							Link
						</button>
					</div>
				))}
				{missing.length === 0 && (
					<div className='py-6 text-center'>
						<Check size={28} className='mx-auto mb-3 text-emerald-500' />
						<p className='text-sm font-semibold'>All accounts linked</p>
						<p className='mt-1 text-xs text-zinc-500'>
							Close this popup and click Run to execute the workflow.
						</p>
					</div>
				)}
			</div>
			<div className='mt-5 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800'>
				<button
					type='button'
					onClick={close}
					className='rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold dark:bg-zinc-800'>
					Close
				</button>
			</div>
		</Modal>
	);
};

const LinkCredentialsDialog = () => {
	const { state } = useWorkflowEditor();
	return state.ui.linkCredentialsOpen ? <CredentialFlow /> : null;
};
export default LinkCredentialsDialog;
