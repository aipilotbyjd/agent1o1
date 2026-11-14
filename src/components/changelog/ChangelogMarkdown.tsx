import ReactMarkdown, { type Components } from 'react-markdown';

// react-markdown renders no raw HTML and drops `javascript:` links by
// default, so an entry's body is safe to show as written.

const components: Components = {
	a: ({ href, children }) => (
		<a
			href={href}
			target='_blank'
			rel='noopener noreferrer nofollow'
			className='font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-800 dark:text-indigo-400'>
			{children}
		</a>
	),
	p: ({ children }) => <p className='my-3 first:mt-0 last:mb-0'>{children}</p>,
	ul: ({ children }) => <ul className='my-3 list-disc space-y-1.5 pl-6'>{children}</ul>,
	ol: ({ children }) => <ol className='my-3 list-decimal space-y-1.5 pl-6'>{children}</ol>,
	h1: ({ children }) => <h2 className='mt-6 mb-3 text-2xl font-bold first:mt-0'>{children}</h2>,
	h2: ({ children }) => <h3 className='mt-6 mb-3 text-xl font-bold first:mt-0'>{children}</h3>,
	h3: ({ children }) => (
		<h4 className='mt-5 mb-2 text-sm font-bold tracking-wide uppercase opacity-70 first:mt-0'>
			{children}
		</h4>
	),
	code: ({ children }) => (
		<code className='rounded bg-slate-500/10 px-1.5 py-0.5 font-mono text-[0.9em]'>
			{children}
		</code>
	),
	pre: ({ children }) => (
		<pre className='my-3 overflow-x-auto rounded-xl bg-slate-500/10 p-4 font-mono text-sm [&_code]:bg-transparent [&_code]:p-0'>
			{children}
		</pre>
	),
	blockquote: ({ children }) => (
		<blockquote className='my-3 border-l-4 border-slate-300 pl-4 opacity-80'>
			{children}
		</blockquote>
	),
	img: ({ src, alt }) =>
		typeof src === 'string' && /^https:\/\//i.test(src) ? (
			<img src={src} alt={alt ?? ''} loading='lazy' className='my-4 max-w-full rounded-xl' />
		) : null,
};

const ChangelogMarkdown = ({ children, className }: { children: string; className?: string }) => (
	<div className={`leading-relaxed break-words ${className ?? ''}`}>
		<ReactMarkdown components={components}>{children}</ReactMarkdown>
	</div>
);

export default ChangelogMarkdown;
