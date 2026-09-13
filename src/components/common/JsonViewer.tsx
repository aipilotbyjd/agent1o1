import { FC, useState } from 'react';
import Button from '@/components/ui/Button';

// ============================================================
// JSON Viewer
// ------------------------------------------------------------
// Run payloads are arbitrary JSON of unknown size, so this stays
// deliberately dumb: pretty-print, scroll, copy. Anything with a
// collapsible tree would need a schema it doesn't have, and the
// common case is a developer wanting to read or paste the whole
// blob somewhere else.
//
// Renders a placeholder rather than "null" for an absent payload —
// a node that produced no output and one that produced literal
// null are different things to a reader.
// ============================================================

interface IJsonViewerProps {
	value: unknown;
	/** Shown when there is nothing to display. */
	emptyLabel?: string;
	className?: string;
	maxHeight?: string;
}

const JsonViewer: FC<IJsonViewerProps> = ({
	value,
	emptyLabel = 'No payload',
	className,
	maxHeight = 'max-h-72',
}) => {
	const [isCopied, setIsCopied] = useState(false);

	if (value === null || value === undefined) {
		return <div className='text-sm text-zinc-500'>{emptyLabel}</div>;
	}

	// A payload that can't be stringified (a cycle, a BigInt) must not take
	// the page down with it — show why instead.
	let text: string;
	try {
		text = JSON.stringify(value, null, 2);
	} catch {
		text = '// Payload could not be serialised for display';
	}

	const onCopy = () => {
		void navigator.clipboard.writeText(text).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 1500);
		});
	};

	return (
		<div className={['group/json relative', className].filter(Boolean).join(' ')}>
			<Button
				variant='outline'
				color='zinc'
				dimension='sm'
				icon={isCopied ? 'Tick02' : 'Copy01'}
				className='invisible absolute top-2 right-2 z-10 group-hover/json:visible'
				onClick={onCopy}>
				{isCopied ? 'Copied' : 'Copy'}
			</Button>
			<pre
				className={`overflow-auto rounded-xl bg-zinc-500/10 p-3 font-mono text-xs ${maxHeight}`}>
				{text}
			</pre>
		</div>
	);
};

export default JsonViewer;
