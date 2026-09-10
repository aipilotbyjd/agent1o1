import { KeyRound } from 'lucide-react';
import { useCredential } from '@/api/modules/credentials/credentials.hooks';
import { useWorkflowRouteParams } from '../../../_hooks/useWorkflowRouteParams.hook';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';

type Props = { credentialId: string };

/** Shows which account/credential this node is currently connected through — Gumloop-style. Click to switch. */
const NodeCredentialBadge = ({ credentialId }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const { workspaceId } = useWorkflowRouteParams();
	const { data: credential, isLoading } = useCredential(workspaceId, credentialId);

	if (isLoading || !credential) return null;

	const expired = credential.expires_at ? new Date(credential.expires_at) < new Date() : false;

	return (
		<button
			type='button'
			title={`Connected via ${credential.name}${expired ? ' — expired, click to switch' : ' — click to switch'}`}
			onPointerDown={(event) => event.stopPropagation()}
			onClick={(event) => {
				event.stopPropagation();
				dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: true });
			}}
			className={[
				'nodrag flex max-w-full shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition',
				expired
					? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400'
					: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400',
			].join(' ')}>
			<KeyRound size={10} className='shrink-0' />
			<span className='truncate'>{credential.name}</span>
		</button>
	);
};

export default NodeCredentialBadge;
