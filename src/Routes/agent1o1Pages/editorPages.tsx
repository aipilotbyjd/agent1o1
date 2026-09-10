import pages from '@/Routes/pages';
import { lazy } from 'react';

const WorkflowEditorPage = lazy(() => import('@/pages/editor/WorkflowEditor/WorkflowEditor.page'));

const EditorPages = [
	{
		path: pages.editor.subPages.addWorkflow.to,
		element: <WorkflowEditorPage />,
	},
	{
		path: `${pages.editor.subPages.editWorkflow.to}/:workspaceId/:workflowId`,
		element: <WorkflowEditorPage />,
	},
	{
		path: `${pages.editor.subPages.viewWorkflow.to}/:workspaceId/:workflowId`,
		element: <WorkflowEditorPage />,
	},
];

export default EditorPages;
