import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Rocket, Send } from 'lucide-react';
import { describeDiff, EMPTY_GRAPH } from '../../_helper/versionDiff.helper';
import { useDraftStatus } from '../../_hooks/useDraftStatus.hook';
import { usePublishDraft } from '../../_hooks/usePublishDraft.hook';
import { usePublishReview } from '../../_hooks/usePublishReview.hook';

const NOTES_LIMIT = 500;

/**
 * Publishing with an optional "what changed" note, prefilled from the draft's
 * differences to the live version so a useful note is one keystroke away.
 * Where the workspace reviews changes first, the same note goes with a
 * request for review instead.
 */
const PublishPopover = ({ onClose }: { onClose: () => void }) => {
	const { status, diff, liveGraph, draftGraph, liveVersionNumber } = useDraftStatus();
	const { publish, requestReview, isPublishing, isRequesting } = usePublishDraft();
	const { requiresApproval, pending } = usePublishReview();
	const isSubmitting = isPublishing || isRequesting;

	const suggestion =
		status === 'unpublished'
			? 'First version'
			: diff
				? describeDiff(diff, liveGraph ?? EMPTY_GRAPH, draftGraph)
				: '';
	const [notes, setNotes] = useState(suggestion);
	const [edited, setEdited] = useState(false);
	if (!edited && notes !== suggestion) setNotes(suggestion);

	const nothingToPublish = status === 'live';

	const notesRef = useRef<HTMLTextAreaElement>(null);
	useEffect(() => {
		notesRef.current?.focus();
		notesRef.current?.select();
	}, []);

	const submit = async () => {
		if (nothingToPublish || isSubmitting) return;
		const sent = requiresApproval ? await requestReview(notes) : await publish(notes);
		if (sent) onClose();
	};

	const title = requiresApproval
		? 'Send for review'
		: status === 'unpublished'
			? 'Publish your workflow'
			: 'Publish changes';
	const description = nothingToPublish
		? `Nothing new to publish. Your draft matches v${liveVersionNumber ?? ''}, the live version.`
		: requiresApproval
			? pending
				? 'An admin reviews this before it goes live. It replaces the review already waiting.'
				: 'An admin reviews this before it goes live. You can keep editing meanwhile; later edits need another review.'
			: 'This becomes the live version. Triggers and runs use it right away, and you can restore an older version anytime.';
	const submitLabel = requiresApproval
		? isRequesting
			? 'Sending…'
			: 'Request review'
		: isPublishing
			? 'Publishing…'
			: 'Publish';

	return (
		<>
			<div aria-hidden='true' className='fixed inset-0 z-40' onClick={onClose} />
			<motion.div
				initial={{ opacity: 0, y: 4, scale: 0.97 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 4, scale: 0.97 }}
				transition={{ duration: 0.12 }}
				role='dialog'
				aria-label={title}
				className='absolute top-10 right-0 z-50 w-[320px] origin-top-right rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-zinc-950'>
				<h3 className='text-sm font-semibold text-zinc-900 dark:text-zinc-100'>{title}</h3>
				<p className='mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400'>
					{description}
				</p>

				{!nothingToPublish && (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							void submit();
						}}>
						<label
							htmlFor='publish-notes'
							className='mt-4 block text-xs font-medium text-zinc-700 dark:text-zinc-300'>
							What changed?{' '}
							<span className='font-normal text-zinc-400 dark:text-zinc-500'>
								Optional
							</span>
						</label>
						<textarea
							id='publish-notes'
							ref={notesRef}
							rows={3}
							maxLength={NOTES_LIMIT}
							value={notes}
							placeholder='e.g. Send the summary to #sales instead of #general'
							onChange={(event) => {
								setEdited(true);
								setNotes(event.target.value);
							}}
							onKeyDown={(event) => {
								if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
									event.preventDefault();
									// ⌘↵ is also Run; this one is only for publishing.
									event.nativeEvent.stopImmediatePropagation();
									void submit();
								}
							}}
							className='focus:border-primary-400 mt-1.5 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs leading-relaxed text-zinc-900 outline-none dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100'
						/>
						<div className='mt-3 flex items-center justify-end gap-2'>
							<button
								type='button'
								onClick={onClose}
								className='rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'>
								Cancel
							</button>
							<button
								type='submit'
								disabled={isSubmitting}
								className='bg-primary-400 text-primary-950 hover:bg-primary-500 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50'>
								{isSubmitting ? (
									<Loader2 size={13} className='animate-spin' />
								) : requiresApproval ? (
									<Send size={13} />
								) : (
									<Rocket size={13} />
								)}
								{submitLabel}
								<kbd className='text-primary-900/70 ml-1 hidden font-sans text-[10px] sm:inline'>
									⌘↵
								</kbd>
							</button>
						</div>
					</form>
				)}
			</motion.div>
		</>
	);
};

export default PublishPopover;
