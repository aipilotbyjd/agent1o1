import ModelPicker from '@/components/ai/model-picker/ModelPicker';
import { useAiChatStore } from '@/store/aiChat.store';

interface IBuilderModelPickerProps {
	workspaceId: string;
	disabled?: boolean;
}

/** The model the workflow builder runs on, shared by both of its composers. */
const BuilderModelPicker = ({ workspaceId, disabled }: IBuilderModelPickerProps) => {
	const modelCatalogId = useAiChatStore((store) => store.modelCatalogId);
	const setModelCatalogId = useAiChatStore((store) => store.setModelCatalogId);

	return (
		<ModelPicker
			ws={workspaceId}
			value={modelCatalogId}
			onChange={setModelCatalogId}
			emptyOption={{
				label: 'Builder default',
				description: "The workflow builder's own recommended model.",
			}}
			label='Builder model'
			disabled={disabled}
			inline
		/>
	);
};

export default BuilderModelPicker;
