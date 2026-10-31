import ModelPicker from '@/components/ai/model-picker/ModelPicker';
import { useEditorWorkspaceId } from '../../../_hooks/useEditorWorkspaceId.hook';

interface IWorkflowModelPickerProps {
	value: string | null;
	onChange: (slug: string | null) => void;
}

/** An AI step's model: a catalog slug, or empty for the workspace default. */
const WorkflowModelPicker = ({ value, onChange }: IWorkflowModelPickerProps) => {
	const ws = useEditorWorkspaceId();

	return (
		<ModelPicker
			ws={ws}
			value={value}
			valueKey='slug'
			onChange={onChange}
			emptyOption={{
				label: 'Workspace default',
				description: 'Uses the model your admins set as the default.',
			}}
			compact
		/>
	);
};

export default WorkflowModelPicker;
