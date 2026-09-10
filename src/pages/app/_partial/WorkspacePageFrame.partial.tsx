import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { FolderOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import MainAppBar from '@/pages/app/_partial/MainAppBar.partial';
import WorkspaceSidebar from '@/templates/asides/AgentAside.template';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import useAsideStatus from '@/hooks/useAsideStatus';

type TWorkspaceView =
	| 'dashboard'
	| 'agents'
	| 'skills'
	| 'artifacts'
	| 'apps'
	| 'history'
	| 'workflows'
	| 'automations'
	| 'integrations'
	| 'analytics'
	| 'team'
	| 'settings'
	| 'editor';

const WorkspacePageFrame = ({
	activeView,
	title,
	status,
	meta,
	primaryActionLabel,
	primaryActionIcon = FolderOpen,
	onPrimaryAction,
	children,
	toolbar,
}: {
	activeView: TWorkspaceView;
	title: string;
	status: string;
	meta: string;
	primaryActionLabel: string;
	primaryActionIcon?: LucideIcon;
	onPrimaryAction?: () => void;
	children: ReactNode;
	toolbar?: ReactNode;
}) => {
	const setActiveWorkspaceView = useWorkflowShellStore((store) => store.setActiveWorkspaceView);
	const mobileSidebarOpen = useWorkflowShellStore((store) => store.mobileSidebarOpen);
	const { closeAside } = useAsideStatus();

	useEffect(() => {
		setActiveWorkspaceView(activeView);
	}, [activeView, setActiveWorkspaceView]);

	return (
		<div className='flex min-w-0 flex-1 flex-col bg-[#f6f7f9] text-zinc-950 dark:bg-[#07080b] dark:text-zinc-100'>
			<AnimatePresence>
				{mobileSidebarOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[80] lg:hidden'>
						<button
							type='button'
							aria-label='Close sidebar'
							onClick={closeAside}
							className='absolute inset-0 bg-zinc-950/35 backdrop-blur-sm'
						/>
						<motion.div
							initial={{ x: -300 }}
							animate={{ x: 0 }}
							exit={{ x: -300 }}
							transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
							className='relative h-full w-[286px] max-w-[86vw]'>
							<WorkspaceSidebar />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
			<MainAppBar
				title={title}
				status={status}
				meta={meta}
				primaryActionLabel={primaryActionLabel}
				primaryActionIcon={primaryActionIcon}
				onPrimaryAction={onPrimaryAction}
				showWorkspaceActions={false}>
				{toolbar}
			</MainAppBar>
			<div className='min-h-0 flex-1 overflow-y-auto'>{children}</div>
		</div>
	);
};

export default WorkspacePageFrame;
