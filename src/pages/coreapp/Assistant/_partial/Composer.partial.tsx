import { KeyboardEvent, useCallback, useState } from 'react';
import { ArrowUp, Loader2, Mic, Square } from 'lucide-react';
import { useVoiceRecorder } from '../_hooks/useVoiceRecorder.hook';
import { useBrand } from '@/context/brand';

interface IComposerProps {
	onSend: (content: string) => void;
	onStop?: () => void;
	isWorking?: boolean;
	isSending?: boolean;
	/** Turns a recording into text; the mic is hidden when not provided. */
	onTranscribe?: (audio: Blob) => Promise<string>;
}

/**
 * The chat box. While a reply is being written the owner can stop it, or
 * keep typing — what they send then is queued and answered next.
 */
const ComposerPartial = ({
	onSend,
	onStop,
	isWorking = false,
	isSending = false,
	onTranscribe,
}: IComposerProps) => {
	const brand = useBrand();
	const [content, setContent] = useState('');
	const [isTranscribing, setIsTranscribing] = useState(false);

	const handleRecorded = useCallback(
		(audio: Blob) => {
			if (!onTranscribe) return;
			setIsTranscribing(true);
			onTranscribe(audio)
				.then((text) => {
					if (text) setContent((current) => (current ? `${current} ${text}` : text));
				})
				.catch(() => undefined)
				.finally(() => setIsTranscribing(false));
		},
		[onTranscribe],
	);

	const voice = useVoiceRecorder(handleRecorded);

	const send = () => {
		const trimmed = content.trim();
		if (!trimmed || isSending) return;
		onSend(trimmed);
		setContent('');
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			send();
		}
	};

	return (
		<div className='rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-white/5'>
			<label htmlFor='assistant-composer' className='sr-only'>
				Ask {brand.name} anything…
			</label>
			<textarea
				aria-label={`Ask ${brand.name} anything…`}
				id='assistant-composer'
				rows={3}
				value={content}
				onChange={(event) => setContent(event.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={`Ask ${brand.name} anything…`}
				className='w-full resize-none border-0 bg-transparent p-2 text-base text-zinc-900 placeholder:text-zinc-400 focus:ring-0 dark:text-white'
			/>
			<div className='flex items-center justify-between gap-3 px-2'>
				<p className='text-xs text-zinc-500'>
					{voice.isRecording
						? 'Listening… tap the mic again to stop.'
						: voice.error
							? 'Microphone access was blocked.'
							: isWorking
								? `${brand.name} is working — anything you send now is answered next.`
								: 'Enter to send · Shift+Enter for a new line'}
				</p>
				<div className='flex items-center gap-2'>
					{onTranscribe && voice.isSupported && (
						<button
							type='button'
							onClick={voice.isRecording ? voice.stop : voice.start}
							disabled={isTranscribing}
							aria-label={voice.isRecording ? 'Stop recording' : 'Voice input'}
							title={voice.isRecording ? 'Stop recording' : 'Voice input'}
							className={
								voice.isRecording
									? 'inline-flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-red-500 text-white'
									: 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10'
							}>
							{isTranscribing ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Mic className='h-4 w-4' />
							)}
						</button>
					)}
					{isWorking && onStop && (
						<button
							type='button'
							onClick={onStop}
							aria-label='Stop'
							title='Stop'
							className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10'>
							<Square className='h-3.5 w-3.5 fill-current' />
						</button>
					)}
					<button
						type='button'
						onClick={send}
						disabled={!content.trim() || isSending}
						aria-label='Send'
						title='Send'
						className='bg-assistant inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-40'>
						<ArrowUp className='h-4 w-4' />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ComposerPartial;
