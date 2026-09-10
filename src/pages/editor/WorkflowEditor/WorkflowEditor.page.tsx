import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import { WorkflowService } from '@/api/modules/workflows/workflows.service';
import pages from '@/Routes/pages';
import WorkflowEditorLayout from './_layouts/WorkflowEditorLayout.layout';
import BuildPage from './Build/Build.page';
import { Loader2 } from 'lucide-react';

const WorkflowEditorPage = () => {
	const isAddWorkflow = window.location.pathname.endsWith('/add-workflow');
	const { activeWorkspaceId } = useWorkspaceContext();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const createStarted = useRef(false);

	useEffect(() => {
		if (!isAddWorkflow || !activeWorkspaceId || createStarted.current) return;

		createStarted.current = true;
		setError(null);

		WorkflowService.create(activeWorkspaceId, {
			name: 'Untitled Workflow',
			nodes: [],
			connections: [],
		})
			.then((res) => {
				navigate(`${pages.editor.subPages.editWorkflow.to}/${activeWorkspaceId}/${res.id}`, {
					replace: true,
				});
			})
			.catch((err) => {
				console.error('Failed to auto-create workflow:', err);
				setError('Failed to create a new workflow. Please try again.');
				createStarted.current = false;
			});
	}, [isAddWorkflow, activeWorkspaceId, navigate]);

	if (isAddWorkflow) {
		if (error) {
			return (
				<div className='flex h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-center'>
					<p className='text-sm font-semibold text-rose-500 mb-4'>{error}</p>
					<button
						onClick={() => {
							createStarted.current = false;
							setError(null);
						}}
						className='flex h-10 items-center justify-center rounded-xl bg-primary-400 px-5 text-xs font-black text-primary-950 shadow-md transition hover:brightness-110 active:scale-[0.98]'
					>
						Retry
					</button>
				</div>
			);
		}

		return (
			<div className='flex h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950'>
				<div className='flex flex-col items-center gap-3'>
					<Loader2 className='h-8 w-8 animate-spin text-primary-600' />
					<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Creating blank workflow...
					</p>
				</div>
			</div>
		);
	}

	return (
		<WorkflowEditorLayout>
			<BuildPage />
		</WorkflowEditorLayout>
	);
};

export default WorkflowEditorPage;

