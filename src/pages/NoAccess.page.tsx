import { useNavigate } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';
import usePermission from '@/hooks/usePermission';
import { formatWorkspaceRole } from '@/constants/workspaceRole.constant';

/** Shown in place of a page the viewer's workspace role does not grant. */
const NoAccessPage = () => {
	const navigate = useNavigate();
	const { resolvePath } = useResolvePath();
	const { role } = usePermission();

	return (
		<div className='flex h-full min-h-80 flex-col items-center justify-center gap-4 p-8 text-center'>
			<div className='flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
				<ShieldAlert size={28} />
			</div>
			<div className='text-2xl font-bold'>You don't have access to this page</div>
			<div className='max-w-md text-zinc-500'>
				{role
					? `Your role in this workspace is ${formatWorkspaceRole(role)}. Ask a workspace admin if you need access.`
					: 'Ask a workspace admin if you need access.'}
			</div>
			<Button
				variant='solid'
				color='primary'
				icon='ArrowLeft01'
				onClick={() => navigate(resolvePath(pages.workspace.subPages!.dashboard.to))}>
				Back to dashboard
			</Button>
		</div>
	);
};

export default NoAccessPage;
