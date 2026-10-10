import { useEffect, useMemo, useState } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { dynamicInputId } from '../../../_helper/dynamicInputs.helper';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useWorkflowEditor } from '../../../_hooks/useWorkflowEditor.hook';
import type { TNodeField } from '../../../_types/node.type';
import FieldInput from './FieldInput.partial';
import NodeHelpTip from './NodeHelpTip.partial';

const COLLAPSED_COUNT = 3;
const NO_DYNAMIC_INPUTS: string[] = [];

type Props = {
	nodeId: string;
	fields: TNodeField[];
	values: Record<string, unknown>;
	/** Skip the "Show More Options" collapse and render every field up front. */
	forceExpanded?: boolean;
};

const NodeFields = ({ nodeId, fields, values, forceExpanded }: Props) => {
	const { state, dispatch } = useWorkflowEditor();
	const dynamicKeys =
		state.nodes.find((node) => node.id === nodeId)?.data.dynamicInputKeys ?? NO_DYNAMIC_INPUTS;
	const updateNodeInternals = useUpdateNodeInternals();
	const [expanded, setExpanded] = useState(false);

	// A definition that marks fields `advanced` controls its own split; otherwise
	// fall back to hiding everything past the first few.
	const { always, extra } = useMemo(() => {
		const flagged = fields.some((field) => field.advanced);
		if (flagged) {
			return {
				always: fields.filter(
					(field) => !field.advanced || dynamicKeys.includes(field.key),
				),
				extra: fields.filter((field) => field.advanced && !dynamicKeys.includes(field.key)),
			};
		}
		return {
			always: fields.filter(
				(field, index) => index < COLLAPSED_COUNT || dynamicKeys.includes(field.key),
			),
			extra: fields.filter(
				(field, index) => index >= COLLAPSED_COUNT && !dynamicKeys.includes(field.key),
			),
		};
	}, [fields, dynamicKeys]);

	useEffect(() => {
		if (!forceExpanded) updateNodeInternals(nodeId);
	}, [nodeId, updateNodeInternals, dynamicKeys, expanded, forceExpanded]);

	if (fields.length === 0) return null;

	const visible = forceExpanded || expanded ? [...always, ...extra] : always;

	return (
		<div
			className='nodrag nowheel flex flex-col gap-3'
			onPointerDown={(event) => event.stopPropagation()}>
			{visible.map((field) => (
				<div key={field.key} className='relative'>
					{!forceExpanded && dynamicKeys.includes(field.key) && (
						<Handle
							id={dynamicInputId(field.key)}
							type='target'
							position={Position.Left}
							title={`Connect an output to ${field.label}`}
							aria-label={`${field.label} dynamic input`}
							style={{ left: -27, top: 10, width: 12, height: 12 }}
							className='border-primary-400! border-2! bg-white! dark:bg-zinc-900!'
						/>
					)}
					<div className='mb-1.5 flex items-center gap-1'>
						<span className='truncate text-[11px] font-bold text-zinc-800 dark:text-zinc-200'>
							{field.label}
						</span>
						{dynamicKeys.includes(field.key) && (
							<span className='text-primary-600 dark:text-primary-400 ml-auto text-[9px] font-medium'>
								Dynamic input
							</span>
						)}
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
					aria-label='Toggle sidebar'
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
