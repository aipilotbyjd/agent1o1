import { useState } from 'react';
import classNames from 'classnames';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { TAssistantFeedback, TAssistantFeedbackRating } from '@/types/assistant.type';

const RATING_LABELS: Record<TAssistantFeedbackRating, string> = {
	up: 'Good reply',
	down: 'Bad reply',
};

interface IMessageFeedbackProps {
	feedback?: TAssistantFeedback | null;
	onRate: (rating: TAssistantFeedbackRating, comment?: string) => void;
	isSaving?: boolean;
}

/**
 * Thumbs up/down under a reply. A comment ("shorter please") can teach the
 * assistant a lasting preference; a bare rating is just recorded.
 */
const MessageFeedbackPartial = ({ feedback, onRate, isSaving = false }: IMessageFeedbackProps) => {
	const [commentFor, setCommentFor] = useState<TAssistantFeedbackRating | null>(null);
	const [comment, setComment] = useState('');

	const choose = (rating: TAssistantFeedbackRating) => {
		setCommentFor(rating);
		setComment('');
		if (rating === 'up') onRate('up');
	};

	const submit = () => {
		if (!commentFor) return;
		onRate(commentFor, comment.trim() || undefined);
		setCommentFor(null);
	};

	return (
		<div className='mt-1 flex flex-col gap-2'>
			<div className='flex items-center gap-1 text-zinc-400'>
				{(['up', 'down'] as const).map((rating) => {
					const Icon = rating === 'up' ? ThumbsUp : ThumbsDown;
					return (
						<button
							key={rating}
							type='button'
							disabled={isSaving}
							onClick={() => choose(rating)}
							aria-label={RATING_LABELS[rating]}
							title={RATING_LABELS[rating]}
							className={classNames(
								'rounded p-1 hover:text-zinc-700 dark:hover:text-zinc-200',
								feedback?.rating === rating && 'text-assistant',
							)}>
							<Icon className='h-3.5 w-3.5' />
						</button>
					);
				})}
				{feedback?.status === 'applied' && (
					<span className='text-[11px] text-zinc-500'>Learned from your feedback</span>
				)}
			</div>

			{commentFor && (
				<div className='flex items-center gap-2'>
					<label htmlFor='assistant-feedback-comment' className='sr-only'>
						What should change? (optional)
					</label>
					<input
						aria-label='What should change? (optional)'
						id='assistant-feedback-comment'
						value={comment}
						onChange={(event) => setComment(event.target.value)}
						onKeyDown={(event) => event.key === 'Enter' && submit()}
						placeholder='What should change? (optional)'
						className='min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-white/5'
					/>
					<button
						type='button'
						onClick={submit}
						className='text-xs font-semibold text-zinc-700 dark:text-zinc-200'>
						{commentFor === 'down' ? 'Send' : 'Save'}
					</button>
					<button
						type='button'
						onClick={() => {
							if (commentFor === 'down') onRate('down');
							setCommentFor(null);
						}}
						className='text-xs text-zinc-400'>
						Skip
					</button>
				</div>
			)}
		</div>
	);
};

export default MessageFeedbackPartial;
