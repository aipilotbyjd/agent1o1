import { useMemo, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useWorkflowEditor } from '../../../_context/WorkflowEditorProvider.context';
import type { TNodeField } from '../../../_types/node.type';
import FieldInput from './FieldInput.partial';
import NodeHelpTip from './NodeHelpTip.partial';

const COLLAPSED_COUNT = 3;

type Props = {
	nodeId: string;
	fields: TNodeField[];
	values: Record<string, unknown>;
	/** Skip the "Show More Options" collapse and render every field up front. */
	forceExpanded?: boolean;
};

const NodeFields = ({ nodeId, fields, values, forceExpanded }: Props) => {
	const { dispatch } = useWorkflowEditor();
	const [expanded, setExpanded] = useState(false);

	// A definition that marks fields `advanced` controls its own split; otherwise
	// fall back to hiding everything past the first few.
	const { always, extra } = useMemo(() => {
		const flagged = fields.some((field) => field.advanced);
		if (flagged) {
			return {
				always: fields.filter((field) => !field.advanced),
				extra: fields.filter((field) => field.advanced),
			};
		}
		return {
			always: fields.slice(0, COLLAPSED_COUNT),
			extra: fields.slice(COLLAPSED_COUNT),
		};
	}, [fields]);

	if (fields.length === 0) return null;

	const visible = forceExpanded || expanded ? [...always, ...extra] : always;

	return (
		<div
			className='nodrag nowheel flex flex-col gap-3'
			onPointerDown={(event) => event.stopPropagation()}>
			{visible.map((field) => (
				<div key={field.key}>
					<div className='mb-1.5 flex items-center gap-1'>
						<span className='truncate text-[11px] font-bold text-zinc-800 dark:text-zinc-200'>
							{field.label}
						</span>
						{field.required && <span className='text-rose-500'>*</span>}
						{field.help && <NodeHelpTip text={field.help} />}
					</div>
					<FieldInput
						compact
						nodeId={nodeId}
						field={field}
						value={values[field.key]}
						onChange={(value) =>
							dispatch({
								type: 'UPDATE_NODE_VALUE',
								id: nodeId,
								fieldKey: field.key,
								value,
							})
						}
					/>
				</div>
			))}

			{!forceExpanded && extra.length > 0 && (
				<button
					type='button'
					onClick={() => setExpanded((value) => !value)}
					className='mt-0.5 flex cursor-pointer items-center gap-1.5 self-start rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
					{expanded ? (
						<>
							<PanelLeftClose size={11} /> Show Fewer Options
						</>
					) : (
						<>
							<PanelLeftOpen size={11} /> Show More Options
						</>
					)}
				</button>
			)}
		</div>
	);
};

export default NodeFields;
