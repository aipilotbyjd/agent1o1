import { TPage, ws } from './types';

export const workspace: TPage = {
	id: 'workspace',
	to: ws(),
	text: 'Workspace',
	icon: 'Home09',
	subPages: {
		dashboard: {
			id: 'dashboard',
			to: ws('dashboard'),
			text: 'Dashboard',
			icon: 'Home09',
		},
		playbooks: {
			id: 'playbooks',
			to: ws('playbooks'),
			text: 'Playbooks',
			icon: 'GitMerge',
		},
		agents: {
			id: 'agents',
			to: ws('agents'),
			text: 'Agents',
			icon: 'Robot01',
		},
		blueprints: {
			id: 'blueprints',
			to: ws('blueprints'),
			text: 'Blueprints',
			icon: 'Layers01',
		},
		skills: {
			id: 'skills',
			to: ws('skills'),
			text: 'Skills',
			icon: 'Puzzle',
		},
		apps: {
			id: 'apps',
			to: ws('apps'),
			text: 'Apps',
			icon: 'Plug01',
		},
		knowledge: {
			id: 'knowledge',
			to: ws('knowledge'),
			text: 'Knowledge',
			icon: 'Book02',
		},
		vault: {
			id: 'vault',
			to: ws('vault'),
			text: 'Vault',
			icon: 'Lock',
		},
		trail: {
			id: 'trail',
			to: ws('trail'),
			text: 'Trail',
			icon: 'Clock01',
		},
		artifacts: {
			id: 'artifacts',
			to: ws('artifacts'),
			text: 'Artifacts',
			icon: 'FileDownload',
		},
	},
};

/**
 * Full-screen editors. They live under the playbooks/agents URL space but render
 * outside the core-app shell, so they are registered separately from the list pages.
 * `edit`/`view` carry a route param - build them with the helpers in `@/Routes/paths`
 * rather than concatenating an id onto `to`.
 */
export const playbookEditor: TPage = {
	id: 'playbookEditor',
	to: ws('playbooks'),
	text: 'Playbook Editor',
	icon: 'PencilEdit01',
	subPages: {
		add: {
			id: 'addPlaybook',
			to: ws('playbooks/new'),
			text: 'New Playbook',
			icon: 'PencilEdit01',
		},
		edit: {
			id: 'editPlaybook',
			to: ws('playbooks/:workflowId/edit'),
			text: 'Edit Playbook',
			icon: 'PencilEdit01',
		},
		view: {
			id: 'viewPlaybook',
			to: ws('playbooks/:workflowId'),
			text: 'View Playbook',
			icon: 'PencilEdit01',
		},
	},
};

/**
 * Editor URLs before they were normalised to `:id/edit`. Registered as
 * redirects so existing bookmarks and in-flight links keep resolving; the id is
 * carried across by the matched route's params.
 */
export const editorRedirects: { from: string; to: string }[] = [
	{ from: ws('playbooks/edit/:workflowId'), to: ws('playbooks/:workflowId/edit') },
	{ from: ws('playbooks/view/:workflowId'), to: ws('playbooks/:workflowId') },
	{ from: ws('agents/edit/:agentId'), to: ws('agents/:agentId/edit') },
];

export const agentEditor: TPage = {
	id: 'agentEditor',
	to: ws('agents'),
	text: 'Agent Editor',
	icon: 'Robot01',
	subPages: {
		add: {
			id: 'addAgent',
			to: ws('agents/new'),
			text: 'Add Agent',
			icon: 'Robot01',
		},
		edit: {
			id: 'editAgent',
			to: ws('agents/:agentId/edit'),
			text: 'Edit Agent',
			icon: 'Robot01',
		},
		reflections: {
			id: 'agentReflections',
			to: ws('agents/:agentId/reflections'),
			text: 'Agent Reflections',
			icon: 'Sparkles',
		},
	},
};
