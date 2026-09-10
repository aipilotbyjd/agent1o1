import { Send } from 'lucide-react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { ROLE_OPTIONS } from '../../_helper/onboarding.constants';
import { parseEmails, isValidEmail } from '../../_helper/onboarding.helper';
import type { TWorkspaceRole } from '@/types/workspace.type';

const InviteTeamStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { inviteEmails, inviteRole, inviteMessage, invitesSent } = state;

	const parsedInviteEmails = parseEmails(inviteEmails);
	const validInviteEmails = parsedInviteEmails.filter(isValidEmail);
	const hasValidEmails = validInviteEmails.length > 0;

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-1.5'>
				<h1 className='text-3xl leading-tight font-black tracking-tight text-slate-950 dark:text-zinc-50'>
					Who's building with you?
				</h1>
				<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed'>
					Automation is a team sport — invite the people who'll run and manage workflows alongside you.
				</p>
			</div>

			{invitesSent ? (
				<div className='flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 p-6 text-center space-y-3.5'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/5'>
						<Send className='h-5 w-5 stroke-[2.5]' />
					</div>
					<div className='space-y-1'>
						<p className='text-base font-bold text-slate-900 dark:text-zinc-50'>
							Invites sent! Your team is on its way.
						</p>
						<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed'>
							They'll get a link to join your workspace straight in their inbox.
						</p>
					</div>
				</div>
			) : (
				<div className='space-y-5 pt-1'>
					{/* Email textarea */}
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<label
								htmlFor='invite-emails'
								className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'
							>
								Work emails
							</label>
							{hasValidEmails && (
								<span className='rounded-full bg-primary-100 px-2.5 py-0.5 text-[9px] font-black text-primary-700 uppercase dark:bg-primary-950/50 dark:text-primary-400'>
									{validInviteEmails.length} added
								</span>
							)}
						</div>
						<textarea
							id='invite-emails'
							rows={3}
							placeholder='maria@acme.com, jordan@acme.com'
							value={inviteEmails}
							onChange={(e) =>
								dispatch({
									type: 'SET_FIELD',
									payload: { inviteEmails: e.target.value },
								})
							}
							className='block w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-400/10 focus:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-100 dark:focus:bg-zinc-950'
						/>
						<p className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
							Separate addresses with commas or new lines
						</p>
					</div>

					{/* Role selector */}
					<div className='space-y-2'>
						<label className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Default access level
						</label>
						<div className='grid grid-cols-2 gap-2.5'>
							{ROLE_OPTIONS.map((r) => {
								const isSelected = inviteRole === r.value;
								return (
									<button
										key={r.value}
										type='button'
										onClick={() =>
											dispatch({
												type: 'SET_FIELD',
												payload: { inviteRole: r.value as TWorkspaceRole },
											})
										}
										className={`flex flex-col rounded-2xl border p-3.5 px-4 text-left transition-all duration-300 ${
											isSelected
												? 'border-primary-500 bg-primary-400/5 ring-2 ring-primary-500/20'
												: 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50 dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:hover:bg-zinc-800/30'
										}`}
									>
										<span
											className={`text-xs font-bold ${
												isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-zinc-150'
											}`}
										>
											{r.label}
										</span>
										<span className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 leading-normal'>
											{r.description}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Invite message */}
					<div className='space-y-2'>
						<label
							htmlFor='invite-message'
							className='block text-[11px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'
						>
							Personal note · shown in the invite email
							<span className='ml-1 font-bold text-slate-400 dark:text-zinc-600'>(optional)</span>
						</label>
						<textarea
							id='invite-message'
							rows={2}
							value={inviteMessage}
							onChange={(e) =>
								dispatch({
									type: 'SET_FIELD',
									payload: { inviteMessage: e.target.value },
								})
							}
							className='block w-full resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-400/10 focus:bg-white dark:border-zinc-800/80 dark:bg-zinc-950/30 dark:text-zinc-100 dark:focus:bg-zinc-950'
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default InviteTeamStep;
