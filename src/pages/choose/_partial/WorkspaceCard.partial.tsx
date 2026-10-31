import type { MouseEvent, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	ArrowRight,
	Cpu,
	Edit2,
	Layers,
	LogOut,
	MoreVertical,
	Trash2,
	UserPlus,
} from 'lucide-react';
import { getInitials } from '../_helper/workspace.helper';
import type { ITeammate, IWorkspaceCard } from '../_types/workspace.type';

const MENU_ITEM_CLASS =
	'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors';
const DANGER_ITEM_CLASS = `${MENU_ITEM_CLASS} dark:hover:bg-rose-955 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20`;

interface IWorkspaceCardProps {
	wsp: IWorkspaceCard;
	index: number;
	isMenuOpen: boolean;
	onSelect: (id: string) => void;
	onMenuChange: (isOpen: boolean) => void;
	onRename: (wsp: IWorkspaceCard) => void;
	onDelete: (id: string, name: string) => void;
	onLeave: (id: string, name: string) => void;
	onInvite: (wsp: IWorkspaceCard) => void;
}

/** Stops the click from also selecting the card it sits on. */
const withoutSelecting = (action: () => void) => (event: MouseEvent) => {
	event.stopPropagation();
	action();
};

const WorkspaceAvatar = ({ wsp }: { wsp: IWorkspaceCard }) => (
	<div className='relative shrink-0'>
		<div
			className='flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-sm ring-1 ring-white/10'
			style={{
				background: `linear-gradient(135deg, ${wsp.gradientFrom}, ${wsp.gradientTo})`,
				boxShadow: `0 6px 16px -6px ${wsp.accentColor}`,
			}}>
			{getInitials(wsp.name)}
		</div>
		{wsp.hasActiveRuns && (
			<span className='absolute -top-1 -right-1 flex h-3 w-3'>
				<span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
				<span className='relative inline-flex h-3 w-3 rounded-full border border-white bg-emerald-500 dark:border-zinc-950' />
			</span>
		)}
	</div>
);

const WorkspaceMenu = ({
	wsp,
	isOpen,
	onToggle,
	onRename,
	onDelete,
	onLeave,
}: Pick<IWorkspaceCardProps, 'wsp' | 'onRename' | 'onDelete' | 'onLeave'> & {
	isOpen: boolean;
	onToggle: (isOpen: boolean) => void;
}) => {
	const choose = (action: () => void) =>
		withoutSelecting(() => {
			onToggle(false);
			action();
		});

	return (
		<div className='relative'>
			<button
				aria-label='Workspace options'
				onClick={withoutSelecting(() => onToggle(!isOpen))}
				className='flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:hover:border-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'>
				<MoreVertical size={14} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 5 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 5 }}
						className='absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900'>
						<button
							onClick={choose(() => onRename(wsp))}
							className={`${MENU_ITEM_CLASS} text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800`}>
							<Edit2 size={12} className='text-primary-500' /> Rename
						</button>
						{wsp.role === 'Owner' ? (
							<button
								onClick={choose(() => onDelete(wsp.id, wsp.name))}
								className={DANGER_ITEM_CLASS}>
								<Trash2 size={12} /> Delete
							</button>
						) : (
							<button
								onClick={choose(() => onLeave(wsp.id, wsp.name))}
								className={DANGER_ITEM_CLASS}>
								<LogOut size={12} /> Leave
							</button>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

const CardMetric = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
	<div className='flex items-center gap-2.5 text-left'>
		<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs'>
			{icon}
		</div>
		<div className='min-w-0'>
			<span className='block text-[9px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
				{label}
			</span>
			<span className='dark:text-zinc-350 block truncate text-xs font-extrabold text-slate-700'>
				{value}
			</span>
		</div>
	</div>
);

const MemberAvatars = ({
	members,
	workspaceName,
	onInvite,
}: {
	members: ITeammate[];
	workspaceName: string;
	onInvite: () => void;
}) => (
	<div className='flex items-center -space-x-1.5'>
		{members.map((member, idx) => (
			<div
				key={idx}
				title={member.name}
				className={`text-primary-950 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-white text-[9px] font-black shadow-2xs ${member.color} dark:border-zinc-950`}>
				{member.initials}
			</div>
		))}
		<button
			type='button'
			aria-label={`Invite a member to ${workspaceName}`}
			title={`Invite a member to ${workspaceName}`}
			onClick={withoutSelecting(onInvite)}
			className='text-slate-555 hover:bg-primary-500 hover:text-primary-950 flex h-7.5 w-7.5 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 transition-all hover:scale-105 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
			<UserPlus size={10} />
		</button>
	</div>
);

/** The whole card selects the workspace; the arrow is only its affordance. */
const EnterArrow = () => (
	<button
		type='button'
		tabIndex={-1}
		aria-hidden
		className='text-primary-600 dark:text-primary-400 group-hover:from-primary-400 group-hover:to-primary-400 group-hover:text-primary-950 group-hover:shadow-primary-500/10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:shadow-md active:scale-95 dark:border-zinc-800 dark:bg-zinc-900'>
		<ArrowRight
			size={16}
			strokeWidth={2.5}
			className='transition-transform duration-300 group-hover:translate-x-0.5'
		/>
	</button>
);

const WorkspaceCard = ({
	wsp,
	index,
	isMenuOpen,
	onSelect,
	onMenuChange,
	onRename,
	onDelete,
	onLeave,
	onInvite,
}: IWorkspaceCardProps) => (
	<motion.div
		layout
		initial={{ opacity: 0, y: 16 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, scale: 0.95 }}
		transition={{ duration: 0.3, delay: index * 0.05 }}
		whileHover={{ y: -5 }}
		onClick={() => onSelect(wsp.id)}
		className='group hover:border-primary-500/30 hover:shadow-primary-500/20/[0.02] relative cursor-pointer overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-[#10131e]/50'>
		<div
			className='pointer-events-none absolute inset-[-30%] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.08]'
			style={{
				background: `radial-gradient(circle, ${wsp.accentColor}, transparent 60%)`,
				filter: 'blur(50px)',
			}}
		/>
		<div
			className='absolute top-0 right-0 left-0 h-[3px]'
			style={{
				background: `linear-gradient(to right, ${wsp.gradientFrom}, ${wsp.gradientTo})`,
			}}
		/>

		<div className='mt-1 flex items-start justify-between'>
			<WorkspaceAvatar wsp={wsp} />
			<div className='flex items-center gap-2'>
				<span className='border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/20 dark:text-primary-400 rounded-full border px-2.5 py-0.5 text-[9px] font-black tracking-wide uppercase shadow-2xs'>
					{wsp.tier}
				</span>
				<WorkspaceMenu
					wsp={wsp}
					isOpen={isMenuOpen}
					onToggle={onMenuChange}
					onRename={onRename}
					onDelete={onDelete}
					onLeave={onLeave}
				/>
			</div>
		</div>

		<div className='text-left'>
			<h3 className='group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-5 text-lg font-black tracking-tight text-slate-900 transition-colors dark:text-white'>
				{wsp.name}
			</h3>
			<p className='mt-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
				Role:{' '}
				<span className='text-slate-650 dark:text-zinc-350 font-bold'>{wsp.role}</span> •{' '}
				{wsp.lastActive}
			</p>
		</div>

		<div className='border-slate-150/60 dark:border-zinc-850 my-5 grid grid-cols-2 gap-3.5 rounded-2xl border bg-slate-50/50 p-3.5 dark:bg-zinc-950/20'>
			<CardMetric
				icon={<Layers size={15} />}
				label='Active Flows'
				value={`${wsp.activeFlowsCount} flows`}
			/>
			<CardMetric
				icon={<Cpu size={15} />}
				label='Deployments'
				value={`${wsp.activeAgentsCount} agent${wsp.activeAgentsCount !== 1 ? 's' : ''}`}
			/>
		</div>

		<div className='flex items-center justify-between'>
			<MemberAvatars
				members={wsp.members}
				workspaceName={wsp.name}
				onInvite={() => onInvite(wsp)}
			/>
			<EnterArrow />
		</div>
	</motion.div>
);

export default WorkspaceCard;
