import { Building2, Check, HelpCircle, Link as LinkIcon } from 'lucide-react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { slugify } from '../../_helper/onboarding.helper';

interface IWorkspaceStepProps {
	workspaceError: string;
	setWorkspaceError: (v: string) => void;
	workspaceSlugTouched: boolean;
	setWorkspaceSlugTouched: (v: boolean) => void;
}

const WorkspaceStep = ({
	workspaceError,
	workspaceSlugTouched,
	setWorkspaceSlugTouched,
}: IWorkspaceStepProps) => {
	const { state, dispatch } = useOnboardingStore();
	const { workspaceName, workspaceSlug, workspaceCreated } = state;

	const handleWorkspaceNameChange = (value: string) => {
		dispatch({ type: 'SET_FIELD', payload: { workspaceName: value } });
		if (!workspaceSlugTouched) {
			dispatch({ type: 'SET_FIELD', payload: { workspaceSlug: slugify(value) } });
		}
	};

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-1.5'>
				<h1 className='text-3xl leading-tight font-black tracking-tight text-slate-955 dark:text-zinc-50'>
					Name your command center
				</h1>
				<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed'>
					This is where your agents live, your automations run, and your team collaborates — all in one place.
				</p>
			</div>

			{workspaceCreated ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-6 text-center space-y-3.5'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/5'>
						<Check className='h-6 w-6 stroke-[3]' />
					</div>
					<div className='space-y-1'>
						<p className='text-base font-bold text-slate-900 dark:text-zinc-50'>
							"{workspaceName}" is live!
						</p>
						<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed'>
							Your command center has been successfully established. Let's bring your teammates on board.
						</p>
					</div>
				</div>
			) : (
				<div className='space-y-5 pt-1'>
					{/* Workspace Name */}
					<div className='space-y-2'>
						<label
							htmlFor='ws-name'
							className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'
						>
							Workspace Name
						</label>
						<div className='relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-400/10 focus-within:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:focus-within:bg-zinc-950 transition-all duration-300 shadow-2xs'>
							<Building2 className='absolute left-4.5 h-4 w-4 text-slate-400' />
							<input
								id='ws-name'
								type='text'
								placeholder='Acme Automation'
								value={workspaceName}
								onChange={(e) => handleWorkspaceNameChange(e.target.value)}
								className='h-12 w-full bg-transparent pr-4 pl-12 text-sm font-semibold transition-all outline-none text-slate-900 dark:text-zinc-50 placeholder-slate-400 border-none focus:ring-0'
							/>
						</div>
					</div>

					{/* Workspace URL */}
					<div className='space-y-2'>
						<label
							htmlFor='ws-slug'
							className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'
						>
							Workspace URL
						</label>
						<div className='relative flex h-12 items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-400/10 focus-within:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:focus-within:bg-zinc-950 transition-all duration-300 shadow-2xs'>
							<LinkIcon className='absolute left-4.5 h-3.5 w-3.5 text-slate-400' />
							<span className='flex h-full items-center pl-12 pr-1 text-sm font-bold text-slate-400 dark:text-zinc-500 select-none'>
								agent1o1.app/
							</span>
							<input
								id='ws-slug'
								type='text'
								placeholder='acme'
								value={workspaceSlug}
								onChange={(e) => {
									dispatch({
										type: 'SET_FIELD',
										payload: { workspaceSlug: e.target.value },
									});
									setWorkspaceSlugTouched(true);
								}}
								className='min-w-0 flex-1 bg-transparent px-1 text-sm font-bold outline-none border-none focus:ring-0 text-slate-900 dark:text-zinc-50 placeholder-slate-350'
							/>
						</div>

						{/* Live URL Preview Badge */}
						<div className='flex items-center gap-1.5 px-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500 transition-all duration-200'>
							<span className='h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse' />
							<span>Live URL:</span>
							<span className='font-black text-slate-700 dark:text-zinc-300 break-all'>
								https://agent1o1.app/{workspaceSlug || 'your-slug'}
							</span>
						</div>
					</div>

					{workspaceError && (
						<div className='flex items-center gap-2 px-1 text-[11px] font-bold text-rose-500'>
							<HelpCircle className='h-4 w-4 shrink-0' />
							<span>{workspaceError}</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default WorkspaceStep;
