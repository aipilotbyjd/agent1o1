import { Link } from 'react-router';
import { FileCheck2 } from 'lucide-react';
import paths from '@/Routes/paths';
import { useWorkspacePendingPublishRequests } from '@/api/modules/workflows';
import relativeTime from '@/utils/relativeTime.util';

/**
 * Workflow changes waiting for someone to review them before they go live,
 * oldest first. Reviewing happens in the editor, where the changes are drawn.
 * Hidden when nothing is waiting.
 */
const WorkflowChangesWaiting = ({ ws }: { ws: string }) => {
	const { data: requests } = useWorkspacePendingPublishRequests(ws);

	if (!requests?.length) return null;

	return (
		<section aria-labelledby='workflow-changes-heading' className='mb-8'>
			<h2
				id='workflow-changes-heading'
				className='mb-2.5 px-1 text-[11px] font-black tracking-wider text-zinc-400 uppercase'>
				Workflow changes waiting for review ({requests.length})
			</h2>
			<ul className='space-y-2.5'>
				{requests.map((request) => (
					<li
						key={request.id}
						className='flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900'>
						<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300'>
							<FileCheck2 size={15} />
						</span>
						<div className='min-w-0 flex-1'>
							<p className='text-[13px] font-bold text-zinc-800 dark:text-zinc-100'>
								{request.workflow?.name ?? 'Workflow'}
							</p>
							<p className='text-[11px] font-semibold text-zinc-400'>
								Sent by {request.requester?.name ?? 'someone'}{' '}
								{relativeTime(request.created_at)}
								{request.base_version
									? ` · would replace v${request.base_version.version}`
									: ' · first version'}
							</p>
							{request.notes && (
								<p className='mt-1 text-[12px] font-medium text-zinc-600 dark:text-zinc-300'>
									{request.notes}
								</p>
							)}
						</div>
						<Link
							to={`${paths.editPlaybook(ws, request.workflow_id)}?publish_request=${request.id}`}
							className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex min-h-9 shrink-0 items-center rounded-lg px-3 text-[12.5px] font-bold'>
							{request.can_review ? 'Review' : 'View'}
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
};

export default WorkflowChangesWaiting;
