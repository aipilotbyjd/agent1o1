import { createContext, useContext } from 'react';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TWorkflowPage } from '@/types/workflow-page.type';
import type { TSaveState } from '../_store/pageBuilder.store';

export type TPageBuilderContext = {
	ws: string;
	page: TWorkflowPage;
	/** The workflow's inputs and outputs, from its published version. */
	fields: TWorkflowInterfaceField[];
	outputs: { name: string }[];
	interfaceLoading: boolean;
	saveState: TSaveState;
	retrySave: () => void;
	/** Saves the draft now; resolves to whether the server has what is on screen. */
	flush: () => Promise<boolean>;
};

export const PageBuilderContext = createContext<TPageBuilderContext | null>(null);

export const usePageBuilder = () => {
	const context = useContext(PageBuilderContext);
	if (!context) throw new Error('usePageBuilder must be used inside the page builder.');
	return context;
};
