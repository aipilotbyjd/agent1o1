import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import { collectUpstreamVariables } from '../../../_helper/variables.helper';
import { getTokenFromDrop, TOKEN_DND_MIME } from '../../../_helper/tokenDrag.helper';
import { buildRuntimeContext, resolveExpressions } from '../../../_helper/runtime.helper';
import type { TNodeField } from '../../../_types/node.type';
import type { TNodeOutputs } from '../../../_helper/runtime.helper';

type Props = {
	field: TNodeField;
	value: unknown;
	onChange: (value: unknown) => void;
	compact?: boolean;
	nodeId: string;
	className: string;
};

type TSegment = { type: 'text'; value: string } | { type: 'token'; value: string };

const TOKEN_RE = /\{\{.*?\}\}/g;

// Structural class only — color comes from the source node's own accent color
// (set via inline style) so a chip visually matches where its value comes from.
const CHIP_CLS =
	'mx-0.5 my-0.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 align-middle text-[10px] font-semibold select-none';
const CHIP_X_CLS = 'ml-0.5 cursor-pointer rounded-full px-0.5 opacity-70 hover:opacity-100';
const DEFAULT_CHIP_COLOR = '#10b981';

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
		if (match.index > last) segments.push({ type: 'text', value: text.slice(last, match.index) });
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
 * Inline expression editor. Renders `{{node.output.field}}` tokens as chips right
 * inside an editable surface (Gumloop-style), so you can drag values in, type text
 * around them, and delete a chip with Backspace or its ✕ — all in one field. The
 * underlying value stays the `{{…}}` string, with a live resolved preview below.
 */
const ExpressionInput = ({ field, value, onChange, compact, nodeId, className }: Props) => {
	const { state } = useWorkflowEditor();
	const editorRef = useRef<HTMLDivElement | null>(null);
	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Start offset (in the value string) of the fragment autocomplete replaces —
	// the `{{` for a brace trigger or the `@` for the Gumloop-style inserter.
	const triggerStart = useRef<number>(-1);
	const [query, setQuery] = useState<string | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [dragOver, setDragOver] = useState(false);

	useEffect(() => () => {
		if (blurTimer.current) clearTimeout(blurTimer.current);
	}, []);

	const text = String(value ?? '');

	const variables = useMemo(
		() => collectUpstreamVariables(nodeId, state.nodes, state.edges),
		[nodeId, state.nodes, state.edges],
	);

	// token → upstream node label + color, so a chip can show where the value comes from.
	const tokenNode = useMemo(() => {
		const map = new Map<string, { label: string; color: string }>();
		variables.forEach((v) => map.set(v.token, { label: v.nodeLabel, color: v.nodeColor }));
		return map;
	}, [variables]);

	const runtimeCtx = useMemo(() => {
		const outputs: TNodeOutputs = {};
		state.nodes.forEach((node) => {
			const out = node.data.pinned ? node.data.pinnedOutput : node.data.outputPreview;
			if (out !== undefined) outputs[node.id] = out;
		});
		return buildRuntimeContext(state.nodes, outputs);
	}, [state.nodes]);

	const matches = useMemo(() => {
		if (query === null) return [];
		const q = query.toLowerCase();
		return variables
			.filter((v) => `${v.nodeLabel} ${v.outputId} ${v.token}`.toLowerCase().includes(q))
			.slice(0, 6);
	}, [query, variables]);

	const hasTokens = text.includes('{{');
	const preview = hasTokens ? String(resolveExpressions(text, runtimeCtx) ?? '') : '';
	const previewChanged = preview !== text;

	/** Build the HTML for one token chip. */
	const chipHtml = (token: string) => {
		const inner = token.replace(/^\{\{/, '').replace(/\}\}$/, '');
		const name = inner.split('.').pop() ?? inner;
		const node = tokenNode.get(token);
		const label = prettify(name);
		const title = `${node ? `${node.label} / ` : ''}${label}`;
		const color = node?.color ?? DEFAULT_CHIP_COLOR;
		const style = `border-color:${color}55;background-color:${color}1a;color:${color};`;
		return (
			`<span data-token="${escapeAttr(token)}" contenteditable="false" title="${escapeAttr(title)}" style="${style}" class="${CHIP_CLS}">` +
			(node
				? `<span class="max-w-[80px] truncate opacity-60">${escapeHtml(node.label)}</span><span class="opacity-30">/</span>`
				: '') +
			`<span class="max-w-[120px] truncate">${escapeHtml(label)}</span>` +
			`<span data-remove="1" class="${CHIP_X_CLS}">×</span>` +
			`</span>`
		);
	};

	const valueToHtml = (v: string) =>
		splitSegments(v)
			.map((segment) => (segment.type === 'token' ? chipHtml(segment.value) : escapeHtml(segment.value)))
			.join('');

	// Render the value into the surface — but never while the user is typing in it,
	// so we don't reset the caret. Runs on external changes (drop, remove, labels).
	useEffect(() => {
		const el = editorRef.current;
		if (!el || document.activeElement === el) return;
		const html = valueToHtml(text);
		if (el.innerHTML !== html) el.innerHTML = html;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [text, tokenNode]);

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
			setQuery(before.slice(braceOpen + 2));
			setActiveIndex(0);
			return;
		}
		const at = before.lastIndexOf('@');
		if (at !== -1 && (at === 0 || /\s/.test(before[at - 1]))) {
			const fragment = before.slice(at + 1);
			if (/^[\w .-]*$/.test(fragment)) {
				triggerStart.current = at;
				setQuery(fragment);
				setActiveIndex(0);
				return;
			}
		}
		triggerStart.current = -1;
		setQuery(null);
	};

	const insertToken = (token: string) => {
		const before = beforeCaret();
		const caret = before === null ? text.length : before.length;
		const start = triggerStart.current >= 0 ? triggerStart.current : caret;
		const next = `${text.slice(0, start)}${token}${text.slice(caret)}`;
		triggerStart.current = -1;
		setQuery(null);
		commit(next, true);
	};

	const onInput = () => {
		const el = editorRef.current;
		if (!el) return;
		onChange(domToValue(el));
		updateQuery();
	};

	const onEditorClick = (event: React.MouseEvent) => {
		const target = event.target as HTMLElement;
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
				insertToken(matches[activeIndex].token);
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

	return (
		<div className='relative'>
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
				className={`${className} block cursor-text break-words whitespace-pre-wrap ${
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

			{query !== null && matches.length > 0 && (
				<ul className='absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 text-[11px] shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
					{matches.map((variable, index) => (
						<li key={`${variable.nodeId}-${variable.outputId}`}>
							<button
								type='button'
								onMouseDown={(event) => {
									event.preventDefault();
									insertToken(variable.token);
								}}
								className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left ${
									index === activeIndex
										? 'bg-zinc-100 dark:bg-zinc-800'
										: 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'
								}`}>
								<span
									className='h-2 w-2 shrink-0 rounded-full'
									style={{ backgroundColor: variable.nodeColor }}
								/>
								<span className='truncate font-medium'>{variable.nodeLabel}</span>
								<span className='ml-auto truncate font-mono text-[10px] text-zinc-400'>
									.{variable.outputId}
								</span>
							</button>
						</li>
					))}
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
					Type <span className='font-mono text-zinc-500 dark:text-zinc-300'>@</span> or drag an
					input here to insert data.
				</div>
			)}
		</div>
	);
};

export default ExpressionInput;
