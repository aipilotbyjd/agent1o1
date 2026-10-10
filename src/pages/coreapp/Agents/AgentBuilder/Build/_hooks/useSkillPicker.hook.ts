import { useState, type KeyboardEvent } from 'react';
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
