import { Building2, Check, HelpCircle, Link as LinkIcon } from 'lucide-react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { slugify } from '../../_helper/onboarding.helper';

interface IWorkspaceStepProps {
	workspaceError: string;
	setWorkspaceError: (v: string) => void;
}

const WorkspaceStep = ({ workspaceError }: IWorkspaceStepProps) => {
	const { state, dispatch } = useOnboardingStore();
	const { workspaceName, workspaceSlug, workspaceCreated } = state;

	/**
	 * The API derives the slug from the name (`Str::slug`, de-duplicated with a
	 * numeric suffix) and rejects one sent from here, so this mirrors that rule
	 * locally to preview the URL rather than letting the user pick it.
	 */
	const handleWorkspaceNameChange = (value: string) => {
		dispatch({
			type: 'SET_FIELD',
			payload: { workspaceName: value, workspaceSlug: slugify(value) },
		});
	};

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-1.5'>
				<h1 className='text-slate-955 text-3xl leading-tight font-black tracking-tight dark:text-zinc-50'>
					Name your command center
				</h1>
				<p className='text-xs leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
					This is where your agents live, your automations run, and your team collaborates
					- all in one place.
				</p>
			</div>

			{workspaceCreated ? (
				<div className='flex flex-col items-center justify-center space-y-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center dark:bg-emerald-950/10'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-4 ring-emerald-500/5 dark:text-emerald-400'>
						<Check className='h-6 w-6 stroke-[3]' />
					</div>
					<div className='space-y-1'>
						<p className='text-base font-bold text-slate-900 dark:text-zinc-50'>
							"{workspaceName}" is live!
						</p>
						<p className='max-w-sm text-xs leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
							Your command center has been successfully established. Let's bring your
							teammates on board.
						</p>
					</div>
				</div>
			) : (
				<div className='space-y-5 pt-1'>
					{/* Workspace Name */}
					<div className='space-y-2'>
						<label
							htmlFor='ws-name'
							className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Workspace Name
						</label>
						<div className='focus-within:border-primary-500 focus-within:ring-primary-400/10 relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-2xs transition-all duration-300 focus-within:bg-white focus-within:ring-4 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:focus-within:bg-zinc-950'>
							<Building2 className='absolute left-4.5 h-4 w-4 text-slate-400' />
							<input
								id='ws-name'
								type='text'
								placeholder='Acme Automation'
								value={workspaceName}
								onChange={(e) => handleWorkspaceNameChange(e.target.value)}
								className='h-12 w-full border-none bg-transparent pr-4 pl-12 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all outline-none focus:ring-0 dark:text-zinc-50'
							/>
						</div>
					</div>

					{/* Workspace URL */}
					<div className='space-y-2'>
						<label
							htmlFor='ws-slug'
							className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Workspace URL
							<span className='ml-1.5 font-bold tracking-normal text-slate-400 normal-case dark:text-zinc-500'>
								- generated from the name
							</span>
						</label>
						<div className='focus-within:border-primary-500 focus-within:ring-primary-400/10 relative flex h-12 items-center rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-2xs transition-all duration-300 focus-within:bg-white focus-within:ring-4 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:focus-within:bg-zinc-950'>
							<LinkIcon className='absolute left-4.5 h-3.5 w-3.5 text-slate-400' />
							<span className='flex h-full items-center pr-1 pl-12 text-sm font-bold text-slate-400 select-none dark:text-zinc-500'>
								agent1o1.app/
							</span>
							<span
								id='ws-slug'
								className='min-w-0 flex-1 truncate px-1 text-sm font-bold text-slate-900 dark:text-zinc-50'>
								{workspaceSlug || (
									<span className='text-slate-350 dark:text-zinc-600'>acme</span>
								)}
							</span>
						</div>

						{/* Live URL Preview Badge */}
						<div className='flex items-center gap-1.5 px-1.5 text-[10px] font-bold text-slate-400 transition-all duration-200 dark:text-zinc-500'>
							<span className='bg-primary-400 h-1.5 w-1.5 animate-pulse rounded-full' />
							<span>Live URL:</span>
							<span className='font-black break-all text-slate-700 dark:text-zinc-300'>
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
