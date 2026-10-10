import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { TAgentSkill } from '@/types/agent-skill.type';
import type { TChosenSkill } from '@/types/agent.type';

/** `/` then the start of a skill name, on a single line. */
const SLASH_QUERY = /^\/([^\n]*)$/;

const toChosenSkill = (skill: TAgentSkill): TChosenSkill => ({
	id: skill.id,
	name: skill.name,
	slug: skill.slug,
	icon: skill.icon,
	color: skill.color,
	category: skill.category,
});

/**
 * The skill named by a leading `/Skill name`, and the message without it.
 * Names can hold spaces, so the longest name that matches wins ("/Cold email
 * follow-up" over "/Cold email"), and it must be followed by a space or the
 * end. Text that names no attached skill is left as it is.
 */
export const parseSkillCommand = (
	input: string,
	skills: TAgentSkill[],
): { skill: TChosenSkill | null; token: string | null; message: string } => {
	const lowered = input.toLowerCase();
	const skill = input.startsWith('/')
		? [...skills]
				.sort((a, b) => b.name.length - a.name.length)
				.find((candidate) => {
					const end = candidate.name.length + 1;
					return (
						lowered.startsWith(`/${candidate.name.toLowerCase()}`) &&
						(input.length === end || /\s/.test(input[end]))
					);
				})
		: undefined;
	if (!skill) return { skill: null, token: null, message: input };
	const token = input.slice(0, skill.name.length + 1);
	return { skill: toChosenSkill(skill), token, message: input.slice(token.length).trim() };
};

/** A built-in action offered in the `/` menu alongside skills. */
export type TSlashCommand = {
	id: string;
	name: string;
	description: string;
	/** Why it can't run right now; the command is shown greyed out with this instead. */
	unavailable?: string;
	run: () => void;
};

type TSlashItem =
	| { kind: 'command'; key: string; name: string; description: string; command: TSlashCommand }
	| { kind: 'skill'; key: string; name: string; description: string; skill: TAgentSkill };

/**
 * The composer's `/` menu, as in Claude: typing `/` at the start of the
 * message lists built-in commands (new chat, settings…) and the agent's
 * skills, narrowed by what follows the slash. A command runs straight away
 * and clears the box. A skill writes `/Skill name ` into the message, where it
 * stays as ordinary, deletable text — it is read back when the message is sent.
 */
export const useSkillPicker = ({
	skills,
	commands,
	input,
	setInput,
}: {
	skills: TAgentSkill[];
	commands: TSlashCommand[];
	input: string;
	setInput: (value: string) => void;
}) => {
	const [activeIndex, setActiveIndex] = useState(0);
	// Esc hides the menu for the `/query` it was pressed on; typing reopens it.
	const [dismissedFor, setDismissedFor] = useState<string | null>(null);

	const query = SLASH_QUERY.exec(input)?.[1]?.toLowerCase() ?? null;
	const command = parseSkillCommand(input, skills);
	const matches: TSlashItem[] =
		query === null || command.skill
			? []
			: [
					...commands
						.filter((c) => c.name.toLowerCase().includes(query))
						.map((c) => ({
							kind: 'command' as const,
							key: `command:${c.id}`,
							name: c.name,
							description: c.description,
							command: c,
						})),
					...skills
						.filter((skill) => skill.name.toLowerCase().includes(query))
						.map((skill) => ({
							kind: 'skill' as const,
							key: `skill:${skill.id}`,
							name: skill.name,
							description: skill.description ?? '',
							skill,
						})),
				];
	const isOpen = query !== null && dismissedFor !== input && matches.length > 0;
	const canPick = (item: TSlashItem) => item.kind === 'skill' || !item.command.unavailable;
	const firstPickable = Math.max(0, matches.findIndex(canPick));

	// Once the text moves on from where the menu was closed, a fresh `/` opens it again.
	if (dismissedFor !== null && input !== dismissedFor) setDismissedFor(null);

	// Only a new query resets the highlight; availability is read at that moment.
	const [highlightedFor, setHighlightedFor] = useState<typeof query | undefined>(undefined);
	if (highlightedFor !== query) {
		setHighlightedFor(query);
		setActiveIndex(firstPickable);
	}

	const pick = (item: TSlashItem) => {
		if (item.kind === 'command') {
			if (item.command.unavailable) return;
			setInput('');
			item.command.run();
			return;
		}
		setInput(`/${item.skill.name} `);
	};

	/** Runs before the composer's own key handling; true means the key was used here. */
	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
		if (!isOpen) return false;
		if (event.key === 'Escape') {
			event.preventDefault();
			setDismissedFor(input);
			return true;
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			const step = event.key === 'ArrowDown' ? 1 : -1;
			setActiveIndex((index) => {
				// Skip greyed-out commands; stay put if nothing else can be picked.
				for (let i = 1; i <= matches.length; i++) {
					const next = (index + step * i + matches.length * i) % matches.length;
					if (canPick(matches[next])) return next;
				}
				return index;
			});
			return true;
		}
		if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
			event.preventDefault();
			pick(matches[Math.min(activeIndex, matches.length - 1)]);
			return true;
		}
		return false;
	};

	return {
		isOpen,
		matches,
		activeIndex,
		setActiveIndex,
		pick,
		handleKeyDown,
		close: () => setDismissedFor(input),
		...command,
	};
};

export type TSkillPicker = ReturnType<typeof useSkillPicker>;

/** The command and skill list, floating above the composer it belongs to. */
export const SkillSlashMenu = ({ picker }: { picker: TSkillPicker }) => {
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		listRef.current
			?.querySelector<HTMLElement>(`[data-index="${picker.activeIndex}"]`)
			?.scrollIntoView({ block: 'nearest' });
	}, [picker.activeIndex]);

	if (!picker.isOpen) return null;

	return (
		<div
			ref={listRef}
			role='listbox'
			aria-label='Commands and skills'
			className='no-scrollbar absolute right-0 bottom-full left-0 z-30 mb-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
			{picker.matches.map((item, index) => {
				const unavailable = item.kind === 'command' ? item.command.unavailable : undefined;
				const startsGroup = index === 0 || picker.matches[index - 1].kind !== item.kind;
				return (
					<div key={item.key}>
						{startsGroup && (
							<p
								className={`px-3 pb-1 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase ${
									index === 0
										? 'pt-1.5'
										: 'mt-1 border-t border-zinc-100 pt-2 dark:border-white/5'
								}`}>
								{item.kind === 'command' ? 'Commands' : 'Skills'}
							</p>
						)}
						<button
							type='button'
							role='option'
							aria-selected={index === picker.activeIndex}
							aria-disabled={!!unavailable}
							data-index={index}
							onMouseEnter={() => !unavailable && picker.setActiveIndex(index)}
							// Keeps focus in the composer, so typing carries on after a click.
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => picker.pick(item)}
							className={`flex w-full items-baseline gap-3 rounded-lg px-3 py-1.5 text-left text-[13px] ${
								index === picker.activeIndex
									? 'bg-zinc-100 dark:bg-white/[0.07]'
									: ''
							} ${unavailable ? 'cursor-default opacity-45' : ''}`}>
							<span className='shrink-0 font-semibold text-zinc-900 dark:text-zinc-100'>
								/{item.name}
							</span>
							{(unavailable || item.description) && (
								<span className='min-w-0 truncate text-zinc-500 dark:text-zinc-400'>
									{unavailable ?? item.description}
								</span>
							)}
						</button>
					</div>
				);
			})}
		</div>
	);
};

/**
 * Highlights a leading `/Skill name` in a textarea, which can't style part of its
 * own text: a copy of the text sits behind the (transparent) textarea with
 * the same typography, invisible except for the highlight behind the command.
 * `className` must carry the textarea's padding and font classes.
 */
export const SkillCommandHighlight = ({
	text,
	token,
	className,
	textareaRef,
}: {
	text: string;
	token: string | null;
	className: string;
	textareaRef: RefObject<HTMLTextAreaElement | null>;
}) => {
	const backdropRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		const sync = () => {
			if (backdropRef.current) backdropRef.current.scrollTop = textarea.scrollTop;
		};
		sync();
		textarea.addEventListener('scroll', sync);
		return () => textarea.removeEventListener('scroll', sync);
	}, [textareaRef, text]);

	if (!token) return null;

	return (
		<div
			ref={backdropRef}
			aria-hidden
			className={`pointer-events-none absolute inset-0 overflow-hidden [overflow-wrap:break-word] whitespace-pre-wrap text-transparent ${className}`}>
			<mark className='bg-primary-400/25 dark:bg-primary-400/30 rounded-[4px] text-transparent'>
				{token}
			</mark>
			{text.slice(token.length)}
		</div>
	);
};

/** A sent message's `/Skill name`, styled like it was in the composer. */
export const SkillCommandTag = ({ skill }: { skill: TChosenSkill }) => (
	<span className='bg-primary-400/25 dark:bg-primary-400/30 mr-1.5 rounded-[4px] px-0.5'>
		/{skill.name}
	</span>
);
