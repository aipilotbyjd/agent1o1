import useFontSize from '@/hooks/useFontSize';

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 18;

/** Text-size stepper. It used to live behind the aside footer's gear icon, which
 *  read as a link to Settings and was not one — the gear now goes to Settings and
 *  this sits in the user menu, beside the theme switcher. */
const FontSizeSwitcherPart = () => {
	const { fontSize, setFontSize } = useFontSize();

	return (
		<div className='mb-1 flex w-full items-center justify-between gap-2 py-2 text-sm'>
			<span className='truncate text-zinc-500'>Text size</span>

			<div className='flex items-center gap-x-1.5'>
				<button
					type='button'
					onClick={() => setFontSize(fontSize - 1)}
					disabled={fontSize <= MIN_FONT_SIZE}
					className='inline-flex size-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800'
					aria-label='Decrease text size'>
					<svg
						className='size-3.5 shrink-0'
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'>
						<path d='M5 12h14' />
					</svg>
				</button>

				<span
					className='w-6 text-center text-zinc-800 dark:text-white'
					aria-live='polite'
					aria-label={`Text size ${fontSize}`}>
					{fontSize}
				</span>

				<button
					type='button'
					onClick={() => setFontSize(fontSize + 1)}
					disabled={fontSize >= MAX_FONT_SIZE}
					className='inline-flex size-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800'
					aria-label='Increase text size'>
					<svg
						className='size-3.5 shrink-0'
						xmlns='http://www.w3.org/2000/svg'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'>
						<path d='M5 12h14' />
						<path d='M12 5v14' />
					</svg>
				</button>
			</div>
		</div>
	);
};

export default FontSizeSwitcherPart;
