import { useMemo, useState } from 'react';
import { exportWorkflow, parseWorkflowImport } from '../../_helper/importExport.helper';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import Modal from './Modal.partial';

type TExportFormat = 'json' | 'yaml';

const jsonToYaml = (obj: unknown, indent = 0): string => {
	const pad = '  '.repeat(indent);
	if (obj === null || obj === undefined) return 'null';
	if (typeof obj === 'string') {
		if (obj.includes('\n') || obj.includes(':')) return `"${obj.replace(/"/g, '\\"')}"`;
		return obj;
	}
	if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
	if (Array.isArray(obj)) {
		if (obj.length === 0) return '[]';
		return obj.map((item) => `\n${pad}- ${jsonToYaml(item, indent + 1)}`).join('');
	}
	if (typeof obj === 'object') {
		const entries = Object.entries(obj as Record<string, unknown>);
		if (entries.length === 0) return '{}';
		return entries
			.map(([key, val]) => {
				const valStr = jsonToYaml(val, indent + 1);
				if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
					return `\n${pad}${key}:${valStr}`;
				}
				if (Array.isArray(val)) {
					return `\n${pad}${key}:${valStr}`;
				}
				return `\n${pad}${key}: ${valStr}`;
			})
			.join('');
	}
	return String(obj);
};

const downloadFile = (content: string, filename: string, mime: string) => {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
};

const ImportExportDialog = () => {
	const { state, dispatch } = useWorkflowEditor();
	const [format, setFormat] = useState<TExportFormat>('json');
	const [raw, setRaw] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

	const exported = useMemo(() => exportWorkflow(state), [state]);

	const yamlExport = useMemo(() => {
		try {
			const parsed = JSON.parse(exported);
			return `# Workflow: ${state.workflow.name}\n---${jsonToYaml(parsed)}`;
		} catch {
			return exported;
		}
	}, [exported, state.workflow.name]);

	const displayValue = format === 'json' ? exported : yamlExport;

	if (!state.ui.importExportOpen) return null;

	const workflowSlug = state.workflow.name.toLowerCase().replace(/\s+/g, '-');

	return (
		<Modal
			title='Import / Export Workflow'
			onClose={() => dispatch({ type: 'SET_IMPORT_EXPORT', open: false })}>
			<div className='space-y-4'>
				{/* Tabs */}
				<div className='flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900'>
					{(['export', 'import'] as const).map((tab) => (
						<button
							key={tab}
							type='button'
							onClick={() => {
								setActiveTab(tab);
								setError(null);
								if (tab === 'import') setRaw('');
							}}
							className={[
								'flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition',
								activeTab === tab
									? 'bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
									: 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
							].join(' ')}>
							{tab}
						</button>
					))}
				</div>

				{activeTab === 'export' ? (
					<>
						{/* Format selector */}
						<div className='flex items-center gap-2'>
							<span className='text-xs font-semibold text-zinc-500'>Format:</span>
							{(['json', 'yaml'] as const).map((fmt) => (
								<button
									key={fmt}
									type='button'
									onClick={() => setFormat(fmt)}
									className={[
										'rounded-lg px-3 py-1 text-xs font-bold uppercase transition',
										format === fmt
											? 'bg-primary-400 text-primary-950'
											: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300',
									].join(' ')}>
									{fmt}
								</button>
							))}
						</div>

						<textarea
							readOnly
							value={displayValue}
							className='h-64 w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-800 transition outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
						/>

						{/* Download buttons */}
						<div className='flex gap-2'>
							<button
								type='button'
								onClick={() => {
									navigator.clipboard.writeText(displayValue);
								}}
								className='flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300'>
								Copy to clipboard
							</button>
							<button
								type='button'
								onClick={() =>
									downloadFile(
										displayValue,
										`${workflowSlug}.${format}`,
										format === 'json' ? 'application/json' : 'text/yaml',
									)
								}
								className='flex-1 rounded-lg bg-primary-400 px-3 py-2 text-xs font-black text-primary-950 hover:bg-primary-500'>
								Download .{format}
							</button>
						</div>
					</>
				) : (
					<>
						<textarea
							value={raw}
							onChange={(event) => setRaw(event.target.value)}
							placeholder='Paste workflow JSON here…'
							className='h-64 w-full rounded-xl border border-zinc-300 bg-white p-3 font-mono text-xs text-zinc-800 transition outline-none placeholder:text-zinc-400 focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
						/>
						{error && (
							<div className='rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300'>
								{error}
							</div>
						)}
						<div className='flex justify-end gap-2'>
							<button
								type='button'
								onClick={() => {
									setRaw('');
									setError(null);
								}}
								className='rounded-lg border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-white'>
								Clear
							</button>
							<button
								type='button'
								onClick={() => {
									try {
										dispatch({
											type: 'LOAD_WORKFLOW',
											workflow: parseWorkflowImport(raw),
										});
									} catch (err) {
										setError(
											err instanceof Error
												? err.message
												: 'Invalid workflow JSON.',
										);
									}
								}}
								className='rounded-lg bg-emerald-500 px-3 py-2 text-sm font-black text-white hover:bg-emerald-600'>
								Import
							</button>
						</div>
					</>
				)}
			</div>
		</Modal>
	);
};

export default ImportExportDialog;
