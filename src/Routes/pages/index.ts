export type { TPage, TPages } from './types';
export { WORKSPACE_ROOT, ws, relativeTo, relativeToWorkspace } from './types';
export { settingsRedirects } from './settings.pages';
export { editorRedirects } from './workspace.pages';
export { billingCallbacks } from './welcome.pages';

import { workspace, playbookEditor, agentEditor } from './workspace.pages';
import { settings } from './settings.pages';
import { identity } from './identity.pages';
import { welcome, choose } from './welcome.pages';

/**
 * Single source of truth for URLs. What the sidebars show, and in what order,
 * lives in `@/Routes/navigation` - keep the two concerns apart.
 */
const pages = {
	workspace,
	playbookEditor,
	agentEditor,
	settings,
	identity,
	welcome,
	choose,
};

export default pages;
