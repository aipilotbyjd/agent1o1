import { useAgentActionInbox } from '@/api/modules/agent-actions';
import { useWorkspacePendingPublishRequests } from '@/api/modules/workflows';
import { useWorkspaceId } from '@/hooks/useResolvePath';

/** What the Approvals page lists as waiting: agent actions plus workflow changes to review. */
const ApprovalsBadgePart = () => {
	const ws = useWorkspaceId();
	const { data: inbox } = useAgentActionInbox(ws, { status: 'pending' });
	const { data: publishRequests } = useWorkspacePendingPublishRequests(ws);

	const pending = (inbox?.meta.total ?? 0) + (publishRequests?.length ?? 0);
	if (!pending) return null;

	return (
		<span className='bg-primary-400 text-primary-950 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold'>
			{pending > 99 ? '99+' : pending}
		</span>
	);
};

export default ApprovalsBadgePart;
