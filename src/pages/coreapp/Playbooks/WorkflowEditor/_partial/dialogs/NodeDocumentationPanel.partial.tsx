import { useState, type ReactNode } from 'react';
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	BookOpen,
	Check,
	ChevronDown,
	Coins,
	Copy,
	KeyRound,
	Lightbulb,
	MousePointerClick,
	Repeat,
	SlidersHorizontal,
	X,
	Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '@/api/core';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { CATEGORY_META, PORT_TYPE_COLOR, getNodeCreditCost } from '../../_helper/builder.constants';
import { getOutputPorts } from '../../_helper/outputPorts.helper';
import { dynamicInputPorts } from '../../_helper/dynamicInputs.helper';
import { buildOutputToken } from '../../_helper/tokenDrag.helper';
import { getNodeAccentColor, tintStyle } from '../library/library.util';
import NodeIcon from '../library/NodeIcon.partial';
import type { TFieldKind, TNodeField, TNodePort } from '../../_types/node.type';

const FIELD_KIND_LABEL: Record<TFieldKind, string> = {
	text: 'Text',
	longtext: 'Long text',
	code: 'Code',
	number: 'Number',
	toggle: 'Toggle',
	select: 'Select',
	multiselect: 'Multi-select',
	kv: 'Key / value',
	credential: 'Account',
	model: 'Model',
	picker: 'Picker',
	dynamic: 'Dynamic list',
	list: 'List',
};

const MAX_OPTIONS_SHOWN = 6;

const humanize = (value: string) =>
	value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDefault = (value: unknown) =>
	typeof value === 'string' ? value : JSON.stringify(value);

const Section = ({
	icon,
	title,
	count,
	children,
}: {
	icon: ReactNode;
	title: string;
	count?: number;
	children: ReactNode;
}) => (
	<section>
		<div className='mb-2.5 flex items-center gap-2 text-zinc-500 dark:text-zinc-400'>
			{icon}
			<h3 className='text-[11px] font-bold tracking-[0.12em] uppercase'>{title}</h3>
			{count !== undefined && (
				<span className='rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-500 tabular-nums dark:bg-white/[0.06] dark:text-zinc-400'>
					{count}
				</span>
			)}
		</div>
		{children}
	</section>
);

const TypeBadge = ({ type }: { type: string }) => {
	const color = PORT_TYPE_COLOR[type] ?? PORT_TYPE_COLOR.any;
	return (
		<span
			className='inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium'
			style={{ backgroundColor: `${color}1a`, color }}>
			<span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: color }} />
			{type}
		</span>
	);
};

const CopyButton = ({ value, label }: { value: string; label: string }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 1400);
		} catch {
			notify.error(`Could not copy the ${label}`);
		}
	};

	return (
		<button
			type='button'
			title={`Copy ${label}`}
			aria-label={`Copy ${label}`}
			onClick={handleCopy}
			className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-white/[0.08] dark:hover:text-zinc-100'>
			{copied ? <Check size={12} className='text-emerald-500' /> : <Copy size={12} />}
		</button>
	);
};

const InputPortRow = ({ port }: { port: TNodePort }) => (
	<li className='flex items-center justify-between gap-3 px-3 py-2.5'>
		<div className='flex min-w-0 items-center gap-1.5'>
			<span className='truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
				{port.name}
			</span>
			{port.required ? (
				<span className='text-[10px] font-semibold text-rose-500'>Required</span>
			) : (
				<span className='text-[10px] text-zinc-400'>Optional</span>
			)}
		</div>
		<TypeBadge type={port.type} />
	</li>
);

const OutputPortRow = ({ port, nodeId }: { port: TNodePort; nodeId: string }) => {
	const token = buildOutputToken(nodeId, port.path ?? port.name);
	return (
		<li className='space-y-1.5 px-3 py-2.5'>
			<div className='flex items-center justify-between gap-3'>
				<span className='truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
					{port.name}
				</span>
				<TypeBadge type={port.type} />
			</div>
			<div className='flex items-center gap-1 rounded-md bg-zinc-100/80 py-0.5 pr-0.5 pl-2 dark:bg-white/[0.04]'>
				<code className='min-w-0 flex-1 truncate font-mono text-[10.5px] text-zinc-600 dark:text-zinc-300'>
					{token}
				</code>
				<CopyButton value={token} label='reference' />
			</div>
		</li>
	);
};

const FieldCard = ({ field }: { field: TNodeField }) => {
	const options = field.options ?? [];
	const hiddenOptions = options.length - MAX_OPTIONS_SHOWN;
	const hasRange = field.min !== undefined || field.max !== undefined;

	return (
		<li className='px-3 py-3'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<div className='flex items-center gap-1.5'>
						<span className='text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
							{field.label}
						</span>
						{field.required && (
							<span className='text-[10px] font-semibold text-rose-500'>
								Required
							</span>
						)}
					</div>
					<code className='font-mono text-[10px] text-zinc-400'>{field.key}</code>
				</div>
				<span className='shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'>
					{FIELD_KIND_LABEL[field.kind] ?? field.kind}
				</span>
			</div>

			{field.help && (
				<p className='mt-1.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
					{field.help}
				</p>
			)}

			{options.length > 0 && (
				<div className='mt-2 flex flex-wrap gap-1'>
					{options.slice(0, MAX_OPTIONS_SHOWN).map((option) => (
						<span
							key={option.value}
							className='rounded border border-zinc-200 px-1.5 py-px text-[10px] text-zinc-600 dark:border-white/10 dark:text-zinc-300'>
							{option.label}
						</span>
					))}
					{hiddenOptions > 0 && (
						<span className='px-1 py-px text-[10px] text-zinc-400'>
							+{hiddenOptions} more
						</span>
					)}
				</div>
			)}

			{(field.default !== undefined ||
				hasRange ||
				field.credentialType ||
				field.supportsVariables) && (
				<dl className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-zinc-400'>
					{field.default !== undefined && (
						<div className='flex min-w-0 items-center gap-1'>
							<dt>Default</dt>
							<dd className='truncate font-mono text-zinc-600 dark:text-zinc-300'>
								{formatDefault(field.default)}
							</dd>
						</div>
					)}
					{hasRange && (
						<div className='flex items-center gap-1'>
							<dt>Range</dt>
							<dd className='font-mono text-zinc-600 dark:text-zinc-300'>
								{field.min ?? '−∞'} – {field.max ?? '∞'}
							</dd>
						</div>
					)}
					{field.credentialType && (
						<div className='flex items-center gap-1'>
							<dt>Account</dt>
							<dd className='text-zinc-600 dark:text-zinc-300'>
								{humanize(field.credentialType)}
							</dd>
						</div>
					)}
					{field.supportsVariables && (
						<div className='flex items-center gap-1'>
							<dt>Accepts</dt>
							<dd className='font-mono text-zinc-600 dark:text-zinc-300'>
								{'{{ }}'}
							</dd>
						</div>
					)}
				</dl>
			)}
		</li>
	);
};

const listClass =
	'divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:divide-white/[0.05] dark:border-white/[0.08] dark:bg-white/[0.02]';

const NodeDocumentationPanel = () => {
	const { state, dispatch } = useWorkflowEditor();
	const [showAdvanced, setShowAdvanced] = useState(false);

	const open = state.ui.nodeDocOpen;
	const nodeId = state.ui.nodeDocNodeId ?? state.ui.selectedNodeId;
	const node = state.nodes.find((n) => n.id === nodeId);
	const def = node ? getNodeDefinition(node.data.defKey, node.data.definition) : undefined;

	const close = () => dispatch({ type: 'SET_NODE_DOC', open: false });

	const inputs =
		def && node ? [...def.inputs, ...dynamicInputPorts(def, node.data.dynamicInputKeys)] : [];
	const outputs = def && node ? getOutputPorts(def, node.data) : [];
	const basicFields = def?.fields.filter((field) => !field.advanced) ?? [];
	const advancedFields = def?.fields.filter((field) => field.advanced) ?? [];
	const accent = node ? getNodeAccentColor(node.id, node.data.color, def?.colorHex) : undefined;
	const creditCost = getNodeCreditCost(def);
	const category = def
		? (CATEGORY_META[def.category as keyof typeof CATEGORY_META]?.label ??
			humanize(def.category))
		: '';
	const customLabel = node && def && node.data.label !== def.label ? node.data.label : null;

	return (
		<AnimatePresence>
			{open && (
				<motion.aside
					key='node-doc-panel'
					initial={{ x: 380, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					exit={{ x: 380, opacity: 0 }}
					transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
					onKeyDown={(event) => event.key === 'Escape' && close()}
					aria-label='Node documentation'
					className='absolute top-0 right-0 z-20 flex h-full w-[380px] max-w-full flex-col border-l border-zinc-200 bg-zinc-50/95 shadow-2xl shadow-zinc-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 dark:shadow-black/40'>
					<header className='flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/[0.06]'>
						<div className='flex items-center gap-2 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100'>
							<BookOpen size={15} className='text-primary-500' />
							Node docs
						</div>
						<button
							aria-label='Close'
							type='button'
							onClick={close}
							className='flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-white'>
							<X size={14} />
						</button>
					</header>

					{!def || !node ? (
						<div className='flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center'>
							<div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/[0.05]'>
								<MousePointerClick size={20} />
							</div>
							<div>
								<p className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
									No node selected
								</p>
								<p className='mt-1 text-xs leading-relaxed text-zinc-400'>
									Click a node on the canvas to see what it does, what it needs,
									and what it returns.
								</p>
							</div>
						</div>
					) : (
						<div className='flex-1 space-y-6 overflow-y-auto px-4 pt-4 pb-6'>
							<div>
								<div className='flex items-start gap-3'>
									<div
										className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 dark:ring-white/10'
										style={tintStyle(accent)}>
										{def.icon ? (
											<NodeIcon icon={def.icon} size={20} />
										) : (
											<Zap size={20} />
										)}
									</div>
									<div className='min-w-0 flex-1'>
										<h2 className='truncate text-[15px] leading-tight font-bold text-zinc-900 dark:text-zinc-50'>
											{def.label}
										</h2>
										<div className='mt-1 flex items-center gap-1.5 text-[11px] text-zinc-400'>
											<span className='font-medium text-zinc-500 dark:text-zinc-400'>
												{category}
											</span>
											<span>·</span>
											<code className='truncate font-mono text-zinc-400'>
												{def.key}
											</code>
										</div>
										{customLabel && (
											<div className='mt-0.5 truncate text-[11px] text-zinc-400'>
												On canvas as{' '}
												<span className='font-medium text-zinc-600 dark:text-zinc-300'>
													{customLabel}
												</span>
											</div>
										)}
									</div>
								</div>

								{def.description && (
									<p className='mt-3 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300'>
										{def.description}
									</p>
								)}

								<div className='mt-3 flex flex-wrap gap-1.5'>
									{creditCost > 0 && (
										<span className='inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:ring-white/10'>
											<Coins size={11} className='text-amber-500' />~
											{creditCost} credit{creditCost === 1 ? '' : 's'} / run
										</span>
									)}
									{def.requiresCredential && (
										<span className='inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20'>
											<KeyRound size={11} />
											Needs connected account
										</span>
									)}
									{def.supportsLoopMode && (
										<span className='inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:ring-white/10'>
											<Repeat size={11} className='text-indigo-500' />
											Loop mode
										</span>
									)}
									{def.supportsTrigger && (
										<span className='inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:ring-white/10'>
											<Zap size={11} className='text-primary-500' />
											Can trigger flow
										</span>
									)}
								</div>
							</div>

							{inputs.length > 0 && (
								<Section
									icon={<ArrowDownToLine size={13} />}
									title='Inputs'
									count={inputs.length}>
									<ul className={listClass}>
										{inputs.map((port) => (
											<InputPortRow key={port.id} port={port} />
										))}
									</ul>
								</Section>
							)}

							{outputs.length > 0 && (
								<Section
									icon={<ArrowUpFromLine size={13} />}
									title='Outputs'
									count={outputs.length}>
									<ul className={listClass}>
										{outputs.map((port) => (
											<OutputPortRow
												key={port.id}
												port={port}
												nodeId={node.id}
											/>
										))}
									</ul>
								</Section>
							)}

							{def.fields.length > 0 && (
								<Section
									icon={<SlidersHorizontal size={13} />}
									title='Settings'
									count={def.fields.length}>
									{basicFields.length > 0 && (
										<ul className={listClass}>
											{basicFields.map((field) => (
												<FieldCard key={field.key} field={field} />
											))}
										</ul>
									)}
									{advancedFields.length > 0 && (
										<div className={basicFields.length > 0 ? 'mt-2' : ''}>
											<button
												type='button'
												onClick={() => setShowAdvanced((prev) => !prev)}
												aria-expanded={showAdvanced}
												className='flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-[11.5px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'>
												{showAdvanced ? 'Hide' : 'Show'}{' '}
												{advancedFields.length} advanced setting
												{advancedFields.length === 1 ? '' : 's'}
												<ChevronDown
													size={14}
													className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
												/>
											</button>
											{showAdvanced && (
												<ul className={`${listClass} mt-1`}>
													{advancedFields.map((field) => (
														<FieldCard key={field.key} field={field} />
													))}
												</ul>
											)}
										</div>
									)}
								</Section>
							)}

							<div className='border-primary-200/70 bg-primary-50/70 dark:border-primary-500/20 dark:bg-primary-500/[0.06] rounded-xl border p-3.5'>
								<div className='text-primary-700 dark:text-primary-300 mb-1.5 flex items-center gap-1.5 text-xs font-semibold'>
									<Lightbulb size={13} />
									Using this node's data
								</div>
								<p className='text-primary-900/70 dark:text-primary-200/70 text-[11.5px] leading-relaxed'>
									Wire an upstream output into an input handle, or drag an output
									pill into any text field. Copy a reference above to use a
									specific output elsewhere —{' '}
									<code className='bg-primary-100/80 text-primary-800 dark:bg-primary-500/15 dark:text-primary-200 rounded px-1 font-mono text-[10.5px]'>
										{buildOutputToken(node.id, '')}
									</code>{' '}
									passes the whole result.
								</p>
							</div>
						</div>
					)}
				</motion.aside>
			)}
		</AnimatePresence>
	);
};

export default NodeDocumentationPanel;
