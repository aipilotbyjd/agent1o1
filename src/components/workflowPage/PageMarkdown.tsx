import ReactMarkdown, { type Components } from 'react-markdown';

// react-markdown renders no raw HTML and drops `javascript:` links by
// default, so authored and workflow-returned text is safe to show as-is.

const components: Components = {
	a: ({ href, children }) => (
		<a
			href={href}
			target='_blank'
			rel='noopener noreferrer nofollow'
			className='font-semibold text-[var(--pg-accent)] underline underline-offset-2'>
			{children}
		</a>
	),
	p: ({ children }) => <p className='my-2 first:mt-0 last:mb-0'>{children}</p>,
	ul: ({ children }) => <ul className='my-2 list-disc space-y-1 pl-5'>{children}</ul>,
	ol: ({ children }) => <ol className='my-2 list-decimal space-y-1 pl-5'>{children}</ol>,
	h1: ({ children }) => <h3 className='mt-4 mb-2 text-lg font-bold first:mt-0'>{children}</h3>,
	h2: ({ children }) => <h4 className='mt-4 mb-2 text-base font-bold first:mt-0'>{children}</h4>,
	h3: ({ children }) => <h5 className='mt-3 mb-1.5 text-sm font-bold first:mt-0'>{children}</h5>,
	code: ({ children }) => (
		<code className='rounded bg-[var(--pg-subtle)] px-1 py-0.5 font-mono text-[0.9em]'>
			{children}
		</code>
	),
	pre: ({ children }) => (
		<pre className='my-2 overflow-x-auto rounded-[calc(var(--pg-radius)*0.6)] bg-[var(--pg-subtle)] p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0'>
			{children}
		</pre>
	),
	blockquote: ({ children }) => (
		<blockquote className='my-2 border-l-2 border-[var(--pg-border)] pl-3 text-[var(--pg-muted)]'>
			{children}
		</blockquote>
	),
	img: ({ src, alt }) =>
		typeof src === 'string' && /^https?:\/\//i.test(src) ? (
			<img src={src} alt={alt ?? ''} className='my-2 max-w-full rounded-[var(--pg-radius)]' />
		) : null,
};

const PageMarkdown = ({ children, className }: { children: string; className?: string }) => (
	<div className={`text-sm leading-relaxed break-words ${className ?? ''}`}>
		<ReactMarkdown components={components}>{children}</ReactMarkdown>
	</div>
);

export default PageMarkdown;
