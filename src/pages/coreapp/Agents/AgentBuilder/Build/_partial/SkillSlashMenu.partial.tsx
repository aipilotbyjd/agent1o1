import { useEffect, useRef, type RefObject } from 'react';
import type { TChosenSkill } from '@/types/agent.type';
import type { TSkillPicker } from '../_hooks/useSkillPicker.hook';

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
