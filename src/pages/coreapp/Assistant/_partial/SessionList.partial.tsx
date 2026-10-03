import classNames from 'classnames';
import { EyeOff, MessageSquare, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { useBrand } from '@/context/brand';
import type { TAssistantSession } from '@/types/assistant.type';

interface ISessionListProps {
	sessions: TAssistantSession[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onDelete: (session: TAssistantSession) => void;
	isLoading?: boolean;
}

const SessionListPartial = ({
	sessions,
	activeId,
	onSelect,
	onDelete,
	isLoading = false,
}: ISessionListProps) => {
	const brand = useBrand();

	if (isLoading) return null;

	if (sessions.length === 0) {
		return (
			<p className='px-2 py-6 text-sm text-zinc-500'>
				No conversations yet. Start one to talk to {brand.name}.
			</p>
		);
	}

	return (
		<ul className='flex flex-col gap-1'>
			{sessions.map((session) => (
				<li key={session.id} className='group relative'>
					<button
						type='button'
						onClick={() => onSelect(session.id)}
						className={classNames(
							'flex w-full items-center gap-2 rounded-xl px-3 py-2 pr-9 text-left text-sm transition',
							session.id === activeId
								? 'bg-assistant/10 text-zinc-950 dark:text-white'
								: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5',
						)}>
						{session.incognito ? (
							<EyeOff className='h-4 w-4 shrink-0' aria-label='Incognito' />
						) : (
							<MessageSquare className='h-4 w-4 shrink-0' />
						)}
						<span className='min-w-0 flex-1 truncate'>
							{session.title || 'Untitled chat'}
						</span>
						{session.last_activity_at && (
							<span className='shrink-0 text-[11px] text-zinc-400'>
								{dayjs(session.last_activity_at).format('MMM D')}
							</span>
						)}
					</button>
					<button
						type='button'
						onClick={() => onDelete(session)}
						aria-label='Delete'
						className='absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:text-red-500 focus:opacity-100'>
						<Trash2 className='h-4 w-4' />
					</button>
				</li>
			))}
		</ul>
	);
};

export default SessionListPartial;
