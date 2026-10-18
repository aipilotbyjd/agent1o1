import { getNodeOutput } from '../../../_helper/outputPorts.helper';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, KeyRound, Lock, Plus } from 'lucide-react';
import { useWorkflowEditor } from '../../../_hooks/useWorkflowEditor.hook';
import { collectUpstreamVariables } from '../../../_helper/variables.helper';
import {
	getTokenFromDrop,
	parseNodeToken,
	TOKEN_DND_MIME,
} from '../../../_helper/tokenDrag.helper';
import { getNodeDefinition } from '../../../_helper/nodeCatalog.constants';
import { getNodeAccentColor } from '../../library/library.util';
import { buildRuntimeContext, resolveExpressions } from '../../../_helper/runtime.helper';
import type { TNodeField } from '../../../_types/node.type';
import type { TNodeOutputs } from '../../../_helper/runtime.helper';
import { useEditorSecrets } from '../../../_hooks/useEditorSecrets.hook';
import {
	buildSecretToken,
	parseSecretToken,
	toSecretKey,
} from '../../../_helper/secretTokens.helper';
import SecretPicker from '../../secrets/SecretPicker.partial';
import NewSecretDialog from '../../secrets/NewSecretDialog.partial';

type Props = {
	field: TNodeField;
	value: unknown;
	onChange: (value: unknown) => void;
	compact?: boolean;
	nodeId: string;
	className: string;
};

type TSegment = { type: 'text'; value: string } | { type: 'token'; value: string };

type TVariable = ReturnType<typeof collectUpstreamVariables>[number];

/** One row of the `{{` / `@` suggestions. */
type TMatch =
	| { kind: 'node'; variable: TVariable }
	| { kind: 'secret'; key: string; isSecret: boolean }
	| { kind: 'create'; name: string };

const SECRET_CHIP_COLOR = '#d97706';
const MASK = '••••••';
// lucide `lock`, inline: chips are built as HTML strings.
const LOCK_SVG =
	'<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

const TOKEN_RE = /\{\{.*?\}\}/g;

// Structural class only: color comes from the source node's own accent color
// (set via inline style) so a chip visually matches where its value comes from.
const CHIP_CLS =
	'mx-0.5 my-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 align-middle text-[10px] font-semibold select-none';
const CHIP_X_CLS = 'ml-0.5 cursor-pointer rounded-full px-0.5 opacity-70 hover:opacity-100';
const DEFAULT_CHIP_COLOR = '#10b981';
const MISSING_CHIP_COLOR = '#f43f5e';

const prettify = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s: string) => s.replace(/"/g, '&quot;');

/** Split a value into literal-text and {{token}} segments, preserving order. */
const splitSegments = (text: string): TSegment[] => {
	const segments: TSegment[] = [];
	let last = 0;
	let match: RegExpExecArray | null;
	TOKEN_RE.lastIndex = 0;
	while ((match = TOKEN_RE.exec(text)) !== null) {
		if (match.index > last)
			segments.push({ type: 'text', value: text.slice(last, match.index) });
		segments.push({ type: 'token', value: match[0] });
		last = match.index + match[0].length;
	}
	if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
	return segments;
};

/** Serialize a contentEditable subtree back into the `{{token}}` string form. */
const domToValue = (root: Node): string => {
	let out = '';
	root.childNodes.forEach((node) => {
		if (node.nodeType === 3) {
			out += node.textContent ?? '';
		} else if (node.nodeName === 'BR') {
			out += '\n';
		} else {
			const el = node as HTMLElement;
			if (el.dataset && el.dataset.token !== undefined) {
				out += el.dataset.token;
			} else {
				// Block wrappers the browser inserts on Enter start a new line.
				if (el.nodeName === 'DIV' && out.length && !out.endsWith('\n')) out += '\n';
				out += domToValue(el);
			}
		}
	});
	return out;
};

/**
 * Inline expression editor. Renders `{{nodes.<id>.field}}` tokens as chips right
 * inside an editable surface (Gumloop-style), so you can drag values in, type text
 * around them, and delete a chip with Backspace or its ✕: all in one field. The
 * underlying value stays the `{{…}}` string, with a live resolved preview below.
 */
const ExpressionInput = ({ field, value, onChange, compact, nodeId, className }: Props) => {
	const { state } = useWorkflowEditor();
	const editorRef = useRef<HTMLDivElement | null>(null);
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Start offset (in the value string) of the fragment autocomplete replaces:
	// the `{{` for a brace trigger or the `@` for the Gumloop-style inserter.
	const triggerStart = useRef<number>(-1);
	const [query, setQuery] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [dragOver, setDragOver] = useState(false);
	const [pickerOpen, setPickerOpen] = useState(false);
	// Lists open upward for a field near the bottom of the screen.
	const [dropUp, setDropUp] = useState(false);
	// The secret being created inline, and where its reference goes once it
	// exists: `null` range for a chip that's already in the text.
	const [creating, setCreating] = useState<{
		name: string;
		range: [number, number] | null;
	} | null>(null);
	// Caret position captured before focus leaves the field for the picker.
	const pickerCaret = useRef(0);
	const secrets = useEditorSecrets();

	useEffect(
		() => () => {
			if (blurTimer.current) clearTimeout(blurTimer.current);
		},
		[],
	);

	const text = String(value ?? '');

	const variables = useMemo(
		() => collectUpstreamVariables(nodeId, state.nodes, state.edges),
		[nodeId, state.nodes, state.edges],
	);

	// node id → label + color, so a chip can show where its value comes from.
	const tokenNode = useMemo(() => {
		const map = new Map<string, { label: string; color: string }>();
		state.nodes.forEach((node) => {
			const def = getNodeDefinition(node.data.defKey, node.data.definition);
			map.set(node.id, {
				label: node.data.label,
				color: getNodeAccentColor(
					node.id,
					node.data.color as string | undefined,
					def?.colorHex,
				),
			});
		});
		return map;
	}, [state.nodes]);

	const runtimeCtx = useMemo(() => {
		const outputs: TNodeOutputs = {};
		state.nodes.forEach((node) => {
			const out = getNodeOutput(node.data);
			if (out !== undefined) outputs[node.id] = out;
		});
		// Secrets preview masked; a plain variable's value is shown as-is.
		const store = Object.fromEntries(
			secrets.secrets.map((secret) => [
				secret.key,
				secret.is_secret ? MASK : (secret.value ?? ''),
			]),
		);
		return { ...buildRuntimeContext(state.nodes, outputs), secrets: store, vars: store };
	}, [state.nodes, secrets.secrets]);

	const matches = useMemo((): TMatch[] => {
		if (query === null) return [];
		const q = query.trim().toLowerCase();
		// `{{ secrets.OPENAI` matches on the key alone.
		const keyQuery = q.replace(/^(secrets|vars)\.?/, '');
		const nodeMatches = variables
			.filter((v) => `${v.nodeLabel} ${v.outputId} ${v.token}`.toLowerCase().includes(q))
			.slice(0, 6)
			.map((variable): TMatch => ({ kind: 'node', variable }));
		const secretMatches = secrets.secrets
			.filter((secret) => secret.key.toLowerCase().includes(keyQuery))
			.slice(0, 5)
			.map(
				(secret): TMatch => ({
					kind: 'secret',
					key: secret.key,
					isSecret: secret.is_secret,
				}),
			);
		const name = toSecretKey(keyQuery);
		const create: TMatch[] = name && !secrets.keys.has(name) ? [{ kind: 'create', name }] : [];
		return [...nodeMatches, ...secretMatches, ...create];
	}, [query, variables, secrets]);

	const hasTokens = text.includes('{{');
	const preview = hasTokens ? String(resolveExpressions(text, runtimeCtx) ?? '') : '';
	const previewChanged = preview !== text;

	/** Build the HTML for one token chip. */
	const chipHtml = (token: string) => {
		const secretKey = parseSecretToken(token);
		if (secretKey) {
			const secret = secrets.byKey.get(secretKey);
			const missing = secrets.isReady && !secret;
			const color = missing ? MISSING_CHIP_COLOR : SECRET_CHIP_COLOR;
			const title = missing
				? `No secret named ${secretKey}. Click to create it.`
				: `${secret?.is_secret ? 'Secret' : 'Variable'} ${secretKey}${secret?.description ? `: ${secret.description}` : ''}`;
			const style = `border-color:${color}55;background-color:${color}1a;color:${color};`;
			return (
				`<span data-token="${escapeAttr(token)}"${missing ? ` data-missing-secret="${escapeAttr(secretKey)}"` : ''} contenteditable="false" title="${escapeAttr(title)}" style="${style}" class="${CHIP_CLS}${missing ? ' cursor-pointer' : ''}">` +
				`${LOCK_SVG}<span class="max-w-[140px] truncate font-mono">${escapeHtml(secretKey)}</span>` +
				`<span data-remove="1" class="${CHIP_X_CLS}">×</span>` +
				`</span>`
			);
		}
		const inner = token.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '');
		const ref = parseNodeToken(token);
		const node = ref ? tokenNode.get(ref.nodeId) : undefined;
		const missing = Boolean(ref && !node);
		const name = ref
			? ref.path
					.split(/[.[\]]/)
					.filter(Boolean)
					.pop()
			: inner.split('.').pop();
		const label = ref && !ref.path ? 'Output' : prettify(name ?? inner);
		const title = missing
			? `${inner}: this node no longer exists, so the value will be empty`
			: `${node ? `${node.label} / ` : ''}${label}`;
		const color = missing ? MISSING_CHIP_COLOR : (node?.color ?? DEFAULT_CHIP_COLOR);
		const style = `border-color:${color}55;background-color:${color}1a;color:${color};`;
		return (
			`<span data-token="${escapeAttr(token)}" contenteditable="false" title="${escapeAttr(title)}" style="${style}" class="${CHIP_CLS}">${
				node
					? `<span class="max-w-[80px] truncate opacity-60">${escapeHtml(node.label)}</span><span class="opacity-30">/</span>`
					: ''
			}<span class="max-w-[120px] truncate">${escapeHtml(label)}</span>` +
			`<span data-remove="1" class="${CHIP_X_CLS}">×</span>` +
			`</span>`
		);
	};

	const valueToHtml = (v: string) =>
		splitSegments(v)
			.map((segment) =>
				segment.type === 'token' ? chipHtml(segment.value) : escapeHtml(segment.value),
			)
			.join('');

	// Render the value into the surface, but never while the user is typing in it,
	// so we don't reset the caret. Runs on external changes (drop, remove, labels).
	useEffect(() => {
		const el = editorRef.current;
		if (!el) return;
		if (document.activeElement === el) {
			// Mid-edit only the chips are redrawn (a secret just created stops
			// showing as missing): swapping a chip leaves the caret where it is.
			el.querySelectorAll<HTMLElement>('[data-token]').forEach((chip) => {
				const html = chipHtml(chip.dataset.token ?? '');
				if (chip.outerHTML !== html) chip.outerHTML = html;
			});
			return;
		}
		const html = valueToHtml(text);
		if (el.innerHTML !== html) el.innerHTML = html;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text, tokenNode, secrets]);

	/** Serialized value of everything before the caret (tokens included). */
	const beforeCaret = (): string | null => {
		const el = editorRef.current;
		const sel = window.getSelection();
		if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.getRangeAt(0).endContainer)) {
			return null;
		}
		const range = sel.getRangeAt(0);
		const pre = document.createRange();
		pre.selectNodeContents(el);
		pre.setEnd(range.endContainer, range.endOffset);
		const tmp = document.createElement('div');
		tmp.appendChild(pre.cloneContents());
		return domToValue(tmp);
	};

	const placeCaretAtEnd = (el: HTMLElement) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		const sel = window.getSelection();
		sel?.removeAllRanges();
		sel?.addRange(range);
	};

	/** Push a new value, re-render the surface, and keep editing at the end. */
	const commit = (next: string, keepFocus: boolean) => {
		const el = editorRef.current;
		if (el) {
			el.innerHTML = valueToHtml(next);
			if (keepFocus) {
				el.focus();
				placeCaretAtEnd(el);
			}
		}
		onChange(next);
	};

	const lacksRoomBelow = () => {
		const rect = editorRef.current?.getBoundingClientRect();
		return !!rect && window.innerHeight - rect.bottom < 260;
	};

	const updateQuery = () => {
		const before = beforeCaret();
		if (before === null) {
			triggerStart.current = -1;
			setQuery(null);
			return;
		}
		const braceOpen = before.lastIndexOf('{{');
		if (braceOpen !== -1 && before.indexOf('}}', braceOpen) === -1) {
			triggerStart.current = braceOpen;
			setDropUp(lacksRoomBelow());
			setQuery(before.slice(braceOpen + 2));
			setActiveIndex(0);
			return;
		}
		const at = before.lastIndexOf('@');
		if (at !== -1 && (at === 0 || /\s/.test(before[at - 1]))) {
			const fragment = before.slice(at + 1);
			if (/^[\w .-]*$/.test(fragment)) {
				triggerStart.current = at;
				setDropUp(lacksRoomBelow());
				setQuery(fragment);
				setActiveIndex(0);
				return;
			}
		}
		triggerStart.current = -1;
		setQuery(null);
	};

	/** Where a suggestion goes: over the typed `{{…` / `@…`, else at the caret. */
	const suggestionRange = (): [number, number] => {
		const before = beforeCaret();
		const caret = before === null ? text.length : before.length;
		return [triggerStart.current >= 0 ? triggerStart.current : caret, caret];
	};

	const insertAt = ([start, end]: [number, number], token: string) => {
		commit(`${text.slice(0, start)}${token}${text.slice(end)}`, true);
	};

	const insertToken = (token: string) => {
		const range = suggestionRange();
		triggerStart.current = -1;
		setQuery(null);
		insertAt(range, token);
	};

	const chooseMatch = (match: TMatch) => {
		if (match.kind === 'node') return insertToken(match.variable.token);
		if (match.kind === 'secret') return insertToken(buildSecretToken(match.key));
		const range = suggestionRange();
		triggerStart.current = -1;
		setQuery(null);
		setCreating({ name: match.name, range });
	};

	const onInput = () => {
		const el = editorRef.current;
		if (!el) return;
		onChange(domToValue(el));
		updateQuery();
	};

	const onEditorClick = (event: React.MouseEvent) => {
		const target = event.target as HTMLElement;
		const missingSecret = target.closest<HTMLElement>('[data-missing-secret]');
		if (missingSecret && !target.closest('[data-remove]')) {
			event.preventDefault();
			setCreating({ name: missingSecret.dataset.missingSecret ?? '', range: null });
			return;
		}
		const remove = target.closest('[data-remove]');
		if (remove) {
			event.preventDefault();
			const chip = remove.closest('[data-token]');
			const el = editorRef.current;
			if (chip && el) {
				chip.remove();
				onChange(domToValue(el));
			}
			return;
		}
		updateQuery();
	};

	const onDrop = (event: React.DragEvent) => {
		const token = getTokenFromDrop(event.dataTransfer);
		if (!token) return;
		event.preventDefault();
		event.stopPropagation();
		setDragOver(false);
		const before = beforeCaret();
		let next: string;
		if (before !== null) {
			const caret = before.length;
			next = `${text.slice(0, caret)}${token}${text.slice(caret)}`;
		} else {
			const needsSpace = text.length > 0 && !/\s$/.test(text);
			next = `${text}${needsSpace ? ' ' : ''}${token}`;
		}
		commit(next, true);
	};

	const onDragOver = (event: React.DragEvent) => {
		// Accept unconditionally so the browser fires `onDrop`; validate on drop.
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		const isToken =
			event.dataTransfer.types.includes(TOKEN_DND_MIME) ||
			event.dataTransfer.types.includes('text/plain');
		if (isToken && !dragOver) setDragOver(true);
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		if (query !== null && matches.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				setActiveIndex((i) => (i + 1) % matches.length);
				return;
			}
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
				return;
			}
			if (event.key === 'Enter') {
				event.preventDefault();
				chooseMatch(matches[activeIndex]);
				return;
			}
			if (event.key === 'Escape') {
				setQuery(null);
				return;
			}
		}
		// Single-line fields shouldn't accept newlines.
		if (event.key === 'Enter' && !(field.kind === 'longtext' || field.kind === 'code')) {
			event.preventDefault();
		}
	};

	const isMultiline = field.kind === 'longtext' || field.kind === 'code';
	const ringClass = dragOver ? 'ring-2 ring-emerald-400/60 border-emerald-400' : '';

	const openPicker = () => {
		setDropUp(lacksRoomBelow());
		const before = beforeCaret();
		pickerCaret.current = before === null ? text.length : before.length;
		setQuery(null);
		setPickerOpen((open) => !open);
	};

	return (
		<div className='group/expr relative'>
			<div
				ref={editorRef}
				role='textbox'
				aria-label={field.label}
				contentEditable
				suppressContentEditableWarning
				spellCheck={false}
				onInput={onInput}
				onKeyDown={onKeyDown}
				onKeyUp={updateQuery}
				onClick={onEditorClick}
				onDrop={onDrop}
				onDragOver={onDragOver}
				onDragLeave={() => setDragOver(false)}
				onBlur={() => {
					if (blurTimer.current) clearTimeout(blurTimer.current);
					blurTimer.current = setTimeout(() => setQuery(null), 120);
				}}
				className={`${className} block cursor-text pr-8 break-words whitespace-pre-wrap ${
					isMultiline ? 'min-h-[64px] font-mono' : 'min-h-[36px]'
				} ${ringClass}`}
			/>
			{!text && (
				<div
					className={`pointer-events-none absolute left-3 text-zinc-400 dark:text-zinc-500 ${
						compact ? 'top-1.5 text-[11px]' : 'top-2 text-sm'
					}`}>
					{field.placeholder}
				</div>
			)}

			<button
				type='button'
				title='Insert a secret'
				aria-label='Insert a secret'
				aria-expanded={pickerOpen}
				data-secret-picker-toggle
				// Keep the caret in the field: the picker inserts where it was.
				onMouseDown={(event) => event.preventDefault()}
				onClick={openPicker}
				className={`nodrag absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 ${
					pickerOpen
						? 'bg-amber-500/10 text-amber-600 opacity-100 dark:text-amber-400'
						: 'opacity-0 group-focus-within/expr:opacity-100 group-hover/expr:opacity-100'
				}`}>
				<KeyRound size={13} />
			</button>
			{pickerOpen && (
				<SecretPicker
					dropUp={dropUp}
					onClose={() => setPickerOpen(false)}
					onPick={(key) => {
						setPickerOpen(false);
						const at = pickerCaret.current;
						insertAt([at, at], buildSecretToken(key));
					}}
					onCreate={(name) => {
						setPickerOpen(false);
						const at = pickerCaret.current;
						setCreating({ name, range: [at, at] });
					}}
				/>
			)}
			{creating && (
				<NewSecretDialog
					isOpen
					initialKey={creating.name}
					onClose={() => setCreating(null)}
					onCreated={(secret) => {
						if (creating.range) insertAt(creating.range, buildSecretToken(secret.key));
					}}
				/>
			)}

			{query !== null && matches.length > 0 && (
				<ul
					className={`absolute z-30 max-h-56 w-full overflow-y-auto ${dropUp ? 'bottom-full mb-1' : 'mt-1'} rounded-lg border border-zinc-200 bg-white py-1 text-[11px] shadow-lg dark:border-zinc-700 dark:bg-zinc-900`}>
					{matches.map((match, index) => {
						const rowClass = `flex w-full items-center gap-2 px-2.5 py-1.5 text-left ${
							index === activeIndex
								? 'bg-zinc-100 dark:bg-zinc-800'
								: 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
						}`;
						const choose = (event: React.MouseEvent) => {
							event.preventDefault();
							chooseMatch(match);
						};
						const firstSecret =
							match.kind !== 'node' &&
							(index === 0 || matches[index - 1].kind === 'node');
						return (
							<li
								key={
									match.kind === 'node'
										? `${match.variable.nodeId}-${match.variable.outputId}`
										: `${match.kind}:${match.kind === 'secret' ? match.key : match.name}`
								}>
								{firstSecret && (
									<p className='px-2.5 pt-1.5 pb-0.5 text-[9px] font-bold tracking-wider text-zinc-400 uppercase'>
										Secrets
									</p>
								)}
								{match.kind === 'node' && (
									<button type='button' onMouseDown={choose} className={rowClass}>
										<span
											className='h-2 w-2 shrink-0 rounded-full'
											style={{ backgroundColor: match.variable.nodeColor }}
										/>
										<span className='truncate font-medium'>
											{match.variable.nodeLabel}
										</span>
										<span className='ml-auto truncate font-mono text-[10px] text-zinc-400'>
											.{match.variable.outputId}
										</span>
									</button>
								)}
								{match.kind === 'secret' && (
									<button type='button' onMouseDown={choose} className={rowClass}>
										<Lock size={11} className='shrink-0 text-amber-500' />
										<span className='truncate font-mono font-semibold'>
											{match.key}
										</span>
										<span className='ml-auto text-[9px] font-bold text-zinc-400 uppercase'>
											{match.isSecret ? 'Secret' : 'Variable'}
										</span>
									</button>
								)}
								{match.kind === 'create' && (
									<button
										type='button'
										onMouseDown={choose}
										className={`${rowClass} text-primary-700 dark:text-primary-300 font-bold`}>
										<Plus size={11} className='shrink-0' />
										New secret <span className='font-mono'>{match.name}</span>
									</button>
								)}
							</li>
						);
					})}
				</ul>
			)}

			{hasTokens && previewChanged && (
				<div className='mt-1.5 flex items-start gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/50'>
					<CornerDownLeft size={11} className='mt-0.5 shrink-0 text-emerald-500' />
					<span className='line-clamp-3 min-w-0 flex-1 font-mono text-[10px] break-all text-zinc-600 dark:text-zinc-400'>
						{preview || '(empty)'}
					</span>
				</div>
			)}
			{hasTokens && !previewChanged && variables.length === 0 && (
				<div className='mt-1 text-[10px] text-zinc-400'>
					Connect upstream nodes to use their data here.
				</div>
			)}
			{!hasTokens && query === null && variables.length > 0 && (
				<div className='mt-1 text-[10px] text-zinc-400'>
					Type <span className='font-mono text-zinc-500 dark:text-zinc-300'>@</span> or
					drag an input here to insert data.
				</div>
			)}
		</div>
	);
};

export default ExpressionInput;
