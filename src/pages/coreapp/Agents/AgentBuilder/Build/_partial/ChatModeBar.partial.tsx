import { useEffect, useState } from 'react';
import {
	Check,
	ChevronDown,
	Eye,
	FlaskConical,
	Hand,
	ListChecks,
	Loader2,
	Sparkles,
	Zap,
	type LucideIcon,
} from 'lucide-react';
import { useUpdateAgentSession } from '@/api/modules/agents';
import { AUTONOMY_MODES, AUTONOMY_MODE_META, type TAutonomyMode } from '@/types/agent-action.type';
import type { TAgent, TAgentSession } from '@/types/agent.type';

const MODE_STYLE: Record<TAutonomyMode, { icon: LucideIcon; tile: string }> = {
	read_only: {
		icon: Eye,
		tile: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	},
	ask: {
		icon: Hand,
		tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
	},
	plan: {
		icon: ListChecks,
		tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
	},
	smart: {
		icon: Sparkles,
		tile: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
	},
	autopilot: {
		icon: Zap,
		tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
	},
};

const ModeTile = ({ mode, size = 'md' }: { mode: TAutonomyMode; size?: 'sm' | 'md' }) => {
	const { icon: Icon, tile } = MODE_STYLE[mode];
	return (
		<span
			className={`flex shrink-0 items-center justify-center rounded-lg ${tile} ${
				size === 'md' ? 'h-9 w-9' : 'h-7 w-7'
			}`}>
			<Icon size={size === 'md' ? 16 : 13} />
		</span>
	);
};

const MenuOption = ({
	mode,
	label,
	description,
	selected,
	onSelect,
}: {
	mode: TAutonomyMode;
	label: string;
	description: string;
	selected: boolean;
	onSelect: () => void;
}) => (
	<button
		type='button'
		role='menuitemradio'
		aria-checked={selected}
		onClick={onSelect}
		className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
			selected
				? 'bg-primary-50 dark:bg-primary-950/30'
				: 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
		}`}>
		<ModeTile mode={mode} size='sm' />
		<span className='min-w-0 flex-1'>
			<span className='block text-xs font-bold text-zinc-800 dark:text-zinc-100'>
				{label}
			</span>
			<span className='block text-[11px] leading-snug font-medium text-zinc-500 dark:text-zinc-400'>
				{description}
			</span>
		</span>
		{selected && (
			<Check size={14} className='text-primary-600 dark:text-primary-400 mt-1 shrink-0' />
		)}
	</button>
);

/**
 * How the open conversation may act, above the transcript: its mode (the
 * agent's, or this chat's own override) and whether Test run is on. Anyone who
 * can chat may make a conversation stricter; loosening it past the agent is
 * refused by the backend unless you may manage the agent.
 */
const ChatModeBar = ({
	ws,
	agent,
	session,
	disabled,
}: {
	ws: string;
	agent: TAgent;
	session: TAgentSession;
	disabled?: boolean;
}) => {
	const updateSession = useUpdateAgentSession(ws, agent.id);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const override = session.autonomy_mode ?? null;
	// `ask` is the backend's default for an agent that predates modes.
	const agentMode: TAutonomyMode = agent.autonomy_mode ?? 'ask';
	const mode: TAutonomyMode = override ?? agentMode;
	const testRun = session.test_mode ?? agent.test_mode;
	const isLocked = disabled || updateSession.isPending;

	useEffect(() => {
		if (!isMenuOpen) return;
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsMenuOpen(false);
		};
		window.addEventListener('keydown', closeOnEscape);
		return () => window.removeEventListener('keydown', closeOnEscape);
	}, [isMenuOpen]);

	const choose = (next: TAutonomyMode | null) => {
		setIsMenuOpen(false);
		if (next === override) return;
		updateSession.mutate({ id: session.id, body: { autonomy_mode: next } });
	};

	return (
		<div className='relative flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900'>
			<ModeTile mode={mode} />

			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-1.5'>
					<span className='text-[13px] font-extrabold text-zinc-900 dark:text-white'>
						{AUTONOMY_MODE_META[mode].label} mode
					</span>
					<span className='rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-zinc-500 uppercase dark:bg-zinc-800 dark:text-zinc-400'>
						{override ? 'This chat only' : 'Agent default'}
					</span>
					{testRun && (
						<span
							title='Test run is on. Turn it off in Settings to approve actions for real.'
							className='flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-violet-700 uppercase dark:bg-violet-950/60 dark:text-violet-300'>
							<FlaskConical size={10} /> Test run
						</span>
					)}
				</div>
				<p className='mt-0.5 truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400'>
					{testRun
						? 'Actions are simulated, so nothing really runs or waits for approval.'
						: AUTONOMY_MODE_META[mode].description}
				</p>
			</div>

			<button
				type='button'
				aria-haspopup='menu'
				aria-expanded={isMenuOpen}
				disabled={isLocked}
				onClick={() => setIsMenuOpen((open) => !open)}
				className='flex h-8 shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900'>
				{updateSession.isPending ? (
					<Loader2 size={12} className='animate-spin' />
				) : (
					<>
						Change
						<ChevronDown
							size={12}
							className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
						/>
					</>
				)}
			</button>

			{isMenuOpen && (
				<>
					<div
						aria-hidden='true'
						className='fixed inset-0 z-30'
						onClick={() => setIsMenuOpen(false)}
					/>
					<div
						role='menu'
						aria-label='Mode for this chat'
						className='absolute top-full right-0 left-0 z-40 mt-2 space-y-0.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg sm:left-auto sm:w-80 dark:border-zinc-700 dark:bg-zinc-900'>
						<MenuOption
							mode={agentMode}
							label={`Agent's mode (${AUTONOMY_MODE_META[agentMode].label})`}
							description='Follow the agent settings, including later changes.'
							selected={override === null}
							onSelect={() => choose(null)}
						/>
						<div className='my-1 border-t border-zinc-100 dark:border-white/5' />
						<p className='px-2.5 pt-0.5 pb-1 text-[9px] font-black tracking-wider text-zinc-400 uppercase'>
							Only for this chat
						</p>
						{AUTONOMY_MODES.map((option) => (
							<MenuOption
								key={option}
								mode={option}
								label={AUTONOMY_MODE_META[option].label}
								description={AUTONOMY_MODE_META[option].description}
								selected={override === option}
								onSelect={() => choose(option)}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
};

export default ChatModeBar;
