import { useAssistantContext } from '@/api/modules/assistant';

const PART_LABELS = {
	instructions: 'Instructions & memory',
	tools: 'Tools',
	summary: 'Summary',
	conversation: 'Conversation',
} as const;

interface IContextMeterProps {
	workspaceId: string;
	sessionId: string;
}

/**
 * How full this conversation's context window is. Hover shows what fills it;
 * long conversations are summarized automatically before it runs out.
 */
const ContextMeterPartial = ({ workspaceId, sessionId }: IContextMeterProps) => {
	const { data: context } = useAssistantContext(workspaceId, sessionId);

	if (!context) return null;

	const breakdown = (Object.keys(PART_LABELS) as (keyof typeof PART_LABELS)[])
		.map((part) => `${PART_LABELS[part]}: ${context.parts[part].toLocaleString()}`)
		.join('\n');

	return (
		<div
			className='flex items-center gap-2 self-end text-[11px] text-zinc-500'
			title={`${breakdown}\n${context.used_tokens.toLocaleString()} of ${context.window_tokens.toLocaleString()} tokens (estimate). Older messages are summarized automatically.`}>
			<span>Context {context.percent}%</span>
			<span className='h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10'>
				<span
					className={
						context.percent >= 80
							? 'block h-full bg-amber-500'
							: 'bg-assistant block h-full'
					}
					style={{ width: `${Math.max(2, context.percent)}%` }}
				/>
			</span>
		</div>
	);
};

export default ContextMeterPartial;
