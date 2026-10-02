import { useTranslation } from 'react-i18next';
import { useAssistantContext } from '@/api/modules/assistant';

interface IContextMeterProps {
	workspaceId: string;
	sessionId: string;
}

/**
 * How full this conversation's context window is. Hover shows what fills it;
 * long conversations are summarized automatically before it runs out.
 */
const ContextMeterPartial = ({ workspaceId, sessionId }: IContextMeterProps) => {
	const { t } = useTranslation();
	const { data: context } = useAssistantContext(workspaceId, sessionId);

	if (!context) return null;

	const breakdown = (['instructions', 'tools', 'summary', 'conversation'] as const)
		.map(
			(part) =>
				`${t(`assistant.contextParts.${part}`)}: ${context.parts[part].toLocaleString()}`,
		)
		.join('\n');

	return (
		<div
			className='flex items-center gap-2 self-end text-[11px] text-zinc-500'
			title={`${breakdown}\n${t('assistant.contextOf', { used: context.used_tokens.toLocaleString(), window: context.window_tokens.toLocaleString() })}`}>
			<span>{t('assistant.contextUsed', { percent: context.percent })}</span>
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
