const fieldLabel = (key: string) =>
	key
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/^./, (c) => c.toUpperCase());

const technicalFields =
	/^(id|.*_id|.*Id|usage|metadata|headers|payload|mimeType|partId|nextPageToken|.*tokens|provider|model|internalDate|sizeEstimate|resultSizeEstimate|historyId|labelIds)$/i;

// Prefer content people can read; retain the untouched response under Original data.
const readableEntries = (value: object): [string, unknown][] => {
	const fields = Object.entries(value);
	const payload = 'payload' in value ? value.payload : undefined;
	if (
		payload &&
		typeof payload === 'object' &&
		'headers' in payload &&
		Array.isArray(payload.headers)
	) {
		const headers: [string, unknown][] = [];
		for (const name of ['Subject', 'From', 'To']) {
			const header = payload.headers.find(
				(item: unknown) =>
					item && typeof item === 'object' && 'name' in item && item.name === name,
			);
			if (header && typeof header === 'object' && 'value' in header)
				headers.push([name, header.value]);
		}
		if ('snippet' in value) headers.push(['Preview', value.snippet]);
		if (headers.length) return headers;
	}
	return fields.filter(([key]) => !technicalFields.test(key));
};

/** Render actual results as readable fields, keeping complete data available separately. */
const RunResult = ({ value, depth = 0 }: { value: unknown; depth?: number }) => {
	if (value === undefined || value === null) {
		return <p className='text-sm text-zinc-500 dark:text-zinc-400'>No result was returned.</p>;
	}
	if (typeof value !== 'object') {
		return (
			<p className='text-sm leading-relaxed break-words whitespace-pre-wrap text-zinc-700 dark:text-zinc-200'>
				{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
			</p>
		);
	}
	if (depth >= 3) {
		return <p className='text-sm text-zinc-500 dark:text-zinc-400'>Additional details</p>;
	}
	if (Array.isArray(value)) {
		if (
			value.length &&
			value.every(
				(item) =>
					item &&
					typeof item === 'object' &&
					!Array.isArray(item) &&
					!readableEntries(item).length,
			)
		) {
			return (
				<p className='text-sm text-zinc-700 dark:text-zinc-200'>
					{value.length} item{value.length === 1 ? '' : 's'} returned.
				</p>
			);
		}
		return value.length ? (
			<div className='space-y-3'>
				{value.slice(0, 10).map((item, index) => (
					<div
						key={index}
						className='border-l-2 border-zinc-200 pl-3 dark:border-zinc-700'>
						<RunResult value={item} depth={depth + 1} />
					</div>
				))}
				{value.length > 10 && (
					<p className='text-xs text-zinc-500'>
						Showing 10 of {value.length} items. Open original data to see all.
					</p>
				)}
			</div>
		) : (
			<p className='text-sm text-zinc-500 dark:text-zinc-400'>No items were returned.</p>
		);
	}
	const entries = readableEntries(value);
	return entries.length ? (
		<dl className='space-y-3'>
			{entries.slice(0, 12).map(([key, item]) => (
				<div key={key} className='min-w-0'>
					<dt className='mb-1 text-xs font-medium break-words text-zinc-500 dark:text-zinc-400'>
						{fieldLabel(key)}
					</dt>
					<dd>
						<RunResult value={item} depth={depth + 1} />
					</dd>
				</div>
			))}
			{entries.length > 12 && (
				<p className='text-xs text-zinc-500'>Open original data to see all fields.</p>
			)}
		</dl>
	) : (
		<p className='text-sm text-zinc-500 dark:text-zinc-400'>
			This step returned a result. Open original data to see its details.
		</p>
	);
};

export const OriginalRunData = ({ value }: { value: unknown }) => (
	<details className='mt-4 border-t border-zinc-100 pt-3 dark:border-white/[0.06]'>
		<summary className='cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400'>
			View original data
		</summary>
		<pre className='mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400'>
			{JSON.stringify(value, null, 2) ?? 'No data'}
		</pre>
	</details>
);

export const RunInputDetails = ({ value }: { value: unknown }) =>
	value === undefined ? null : (
		<details className='mt-4 border-t border-zinc-100 pt-3 dark:border-white/[0.06]'>
			<summary className='cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400'>
				Input details
			</summary>
			<p className='mt-2 text-[11px] text-zinc-400'>Data supplied to this step.</p>
			<pre className='mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400'>
				{JSON.stringify(value, null, 2) ?? 'No data'}
			</pre>
		</details>
	);

export const formatRunDuration = (ms: number) =>
	ms < 1000 ? 'Less than a second' : `${(ms / 1000).toFixed(1)} seconds`;

export default RunResult;
