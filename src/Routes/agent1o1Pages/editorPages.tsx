import pages from '@/Routes/pages';
import { lazy } from 'react';

// ============================================================
// Editor routes
// ------------------------------------------------------------
// The workflow canvas (pages/editor/WorkflowEditor) has not been
// ported onto the current API yet, so these paths resolve to the
// placeholder instead of 404-ing. Swap the import below back to
// WorkflowEditor.page once it lands.
// ============================================================
const WorkflowEditorPage = lazy(() => import('@/pages/UnderConstruction.page'));

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
