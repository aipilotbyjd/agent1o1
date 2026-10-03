import { memo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';

const components: Components = {
	p: ({ children }) => <p className='mb-2 break-words [overflow-wrap:anywhere] last:mb-0'>{children}</p>,
	strong: ({ children }) => <strong className='font-semibold text-zinc-900 dark:text-white'>{children}</strong>,
	em: ({ children }) => <em className='italic'>{children}</em>,
	ul: ({ children }) => <ul className='mb-2 ml-4 list-disc space-y-1 last:mb-0'>{children}</ul>,
	ol: ({ children }) => <ol className='mb-2 ml-4 list-decimal space-y-1 last:mb-0'>{children}</ol>,
	li: ({ children }) => <li className='pl-0.5'>{children}</li>,
	h1: ({ children }) => <h1 className='mb-1.5 text-base font-semibold'>{children}</h1>,
	h2: ({ children }) => <h2 className='mb-1.5 text-sm font-semibold'>{children}</h2>,
	h3: ({ children }) => <h3 className='mb-1 text-sm font-semibold'>{children}</h3>,
	code: ({ children }) => (
		<code className='rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[12px] dark:bg-white/10'>{children}</code>
	),
	pre: ({ children }) => (
		<pre className='mb-2 max-w-full overflow-x-auto rounded-lg bg-zinc-200/70 p-3 text-[12px] dark:bg-black/40'>
			{children}
		</pre>
	),
	a: ({ children, href }) => (
		<a href={href} target='_blank' rel='noreferrer' className='underline underline-offset-2 [overflow-wrap:anywhere]'>
			{children}
		</a>
	),
	table: ({ children }) => (
		<div className='mb-2 max-w-full overflow-x-auto'>
			<table className='min-w-max text-left text-xs'>{children}</table>
		</div>
	),
};

/** An assistant reply as Markdown. Memoised: only the reply that is still
 *  streaming re-parses on each delta. */
const AssistantMarkdown = memo(({ text }: { text: string }) => (
	<ReactMarkdown components={components}>{text}</ReactMarkdown>
));

AssistantMarkdown.displayName = 'AssistantMarkdown';

export default AssistantMarkdown;
