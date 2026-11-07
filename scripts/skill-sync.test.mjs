import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const loadTs = (path, overrides = {}) => {
	const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
	const { outputText } = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			jsx: ts.JsxEmit.ReactJSX,
			target: ts.ScriptTarget.ES2022,
		},
	});
	const module = { exports: {} };
	vm.runInThisContext(`(function(require,module,exports){${outputText}\n})`)(
		(name) => (Object.hasOwn(overrides, name) ? overrides[name] : require(name)),
		module,
		module.exports,
	);
	return module.exports;
};
const helpers = loadTs('src/pages/coreapp/Skills/_helper/skill-sync.helpers.ts');
const endpoints = loadTs('src/api/modules/agent-skills/agent-skills.endpoints.ts');
const conflict = {
	path: '',
	base: { 'SKILL.md': 'original' },
	local: { 'SKILL.md': 'app' },
	remote: { 'SKILL.md': 'github' },
	commit_sha: 'head',
};

test('export paths remain within the repository folder', () => {
	for (const path of ['skills/my-skill', 'my-skill', 'notes.v2'])
		assert.equal(helpers.isValidSkillExportPath(path), true, path);
	for (const path of [
		'',
		'../outside',
		'a/../outside',
		'/root',
		'a\\b',
		'a//b',
		'a/',
		'a/./b',
		'a\0b',
		'x'.repeat(201),
	])
		assert.equal(helpers.isValidSkillExportPath(path), false, path);
});

test('conflict review includes edits and deletions but omits identical files', () => {
	assert.deepEqual(
		helpers.changedConflictFiles({
			...conflict,
			base: { a: 'old', b: 'removed', c: 'same' },
			local: { a: 'local', c: 'same' },
			remote: { a: 'remote', b: 'old', c: 'same' },
		}),
		['a', 'b'],
	);
	assert.deepEqual(helpers.changedConflictFiles({ ...conflict, local: null }), ['SKILL.md']);
});

test('a choice cannot silently apply to a newer conflict', () => {
	const choice = { fingerprint: helpers.conflictFingerprint(conflict), resolution: 'local' };
	assert.equal(helpers.selectedConflictResolution(conflict, choice), 'local');
	assert.equal(
		helpers.selectedConflictResolution({ ...conflict, remote: { 'SKILL.md': 'new' } }, choice),
		undefined,
	);
	assert.equal(
		helpers.selectedConflictResolution({ ...conflict, commit_sha: 'new-head' }, choice),
		undefined,
	);
	assert.equal(
		helpers.selectedConflictResolution({ ...conflict, resolution: 'remote' }),
		'remote',
	);
});

for (const [action, method, body, suffix] of [
	['update', 'patch', { two_way: true, credential_id: 'account' }, ''],
	['export', 'post', { skill_id: 'skill', path: 'skills/custom' }, '/export'],
	['resolve', 'post', { path: '', commit_sha: 'head', resolution: 'remote' }, '/resolve'],
]) {
	test(`${action} sends the authenticated client the expected workspace route and payload`, async () => {
		const calls = [];
		const source = { id: 'source', two_way: true };
		const client = {
			[method]: (...args) => {
				calls.push(args);
				return Promise.resolve({ data: { data: { source } } });
			},
		};
		const { SkillSourceService } = loadTs(
			'src/api/modules/agent-skills/agent-skills.service.ts',
			{
				'@/api/client': { axiosClient: client },
				'@/api/core': { unwrapKey: (key) => (response) => response.data.data[key] },
				'./agent-skills.endpoints': endpoints,
			},
		);
		assert.equal(await SkillSourceService[action]('workspace', 'source', body), source);
		assert.deepEqual(calls, [[`/workspaces/workspace/skill-sources/source${suffix}`, body]]);
	});
}

const modal = ({ children }) => React.createElement('div', null, children);
const renderDialog = (name, source) => {
	const hooks = {
		useUpdateSkillSource: () => ({ isPending: false }),
		useRepositoryAccess: () => ({ isPending: false }),
		useExportSkill: () => ({ isPending: false }),
		useResolveSkillSource: () => ({ isPending: false }),
		useSyncSkillSource: () => ({ isPending: false }),
		useSkillSources: () => ({ data: [source], isLoading: false }),
		isSkillSourceSyncing: (s) => ['pending', 'syncing'].includes(s.status),
	};
	const dialogs = loadTs('src/pages/coreapp/Skills/_partial/SkillSyncDialogs.partial.tsx', {
		'@/components/ui/Modal': {
			__esModule: true,
			default: modal,
			ModalHeader: modal,
			ModalBody: modal,
		},
		'@/api/core': { notify: {} },
		'@/api/modules/knowledge-base': { useKnowledgeSourceApps: () => ({ data: [] }) },
		'@/api/modules/agent-skills': hooks,
		'../_helper/skill-sync.helpers': helpers,
	});
	return renderToStaticMarkup(
		React.createElement(dialogs[name], { ws: 'workspace', source, onClose: () => {} }),
	);
};

test('conflict dialog distinguishes deletion and escapes repository content', () => {
	const html = renderDialog('SkillConflictsDialog', {
		id: 'source',
		status: 'conflict',
		conflicts: [
			{ ...conflict, local: null, remote: { 'SKILL.md': '<script>alert(1)</script>' } },
		],
	});
	assert.match(html, /Repository root/);
	assert.match(html, /Keep app version.*\(delete skill\)/);
	assert.match(html, /Keep GitHub version/);
	assert.match(html, /&lt;script&gt;/);
	assert.doesNotMatch(html, /<script>/);
	assert.match(html, /<button[^>]*disabled=""[^>]*>Apply choices and sync/);
});

test('two-way settings cannot be enabled without an account', () => {
	const html = renderDialog('SkillSyncSettingsDialog', {
		id: 'source',
		repo: 'owner/repo',
		two_way: true,
		credential_id: null,
		status: 'ready',
	});
	assert.match(html, /repository write access/);
	assert.match(html, /<button[^>]*disabled=""[^>]*>Save settings/);
});

const dialogTree = (name, props, hooks, state = []) => {
	let index = 0;
	const dialogs = loadTs('src/pages/coreapp/Skills/_partial/SkillSyncDialogs.partial.tsx', {
		react: {
			useState: (initial) => [index < state.length ? state[index++] : initial, () => {}],
		},
		'@/components/ui/Modal': {
			__esModule: true,
			default: modal,
			ModalHeader: modal,
			ModalBody: modal,
		},
		'@/api/core': { notify: { success: () => {}, error: () => {} } },
		'@/api/modules/knowledge-base': { useKnowledgeSourceApps: () => ({ data: [] }) },
		'@/api/modules/agent-skills': hooks,
		'../_helper/skill-sync.helpers': helpers,
	});
	return dialogs[name](props);
};
const findElement = (tree, type) => {
	if (tree?.type === type) return tree;
	for (const child of React.Children.toArray(tree?.props?.children)) {
		const found = findElement(child, type);
		if (found) return found;
	}
};

test('applying conflict choices saves every choice before starting sync', async () => {
	const calls = [];
	const source = {
		id: 'repo',
		status: 'conflict',
		conflicts: [{ ...conflict, resolution: 'remote' }],
	};
	const tree = dialogTree(
		'SkillConflictsDialog',
		{ ws: 'ws', source, onClose: () => calls.push('close') },
		{
			useResolveSkillSource: () => ({ mutateAsync: async (payload) => calls.push(payload) }),
			useSyncSkillSource: () => ({
				mutateAsync: async (id) => {
					calls.push(id);
					return { status: 'pending' };
				},
			}),
			isSkillSourceSyncing: () => false,
		},
	);
	await findElement(tree, 'button').props.onClick();
	assert.deepEqual(calls, [
		{ id: 'repo', body: { path: '', commit_sha: 'head', resolution: 'remote' } },
		'repo',
		'close',
	]);
});

test('a rejected resolution leaves the dialog open and never starts sync', async () => {
	const calls = [];
	const source = {
		id: 'repo',
		status: 'conflict',
		conflicts: [{ ...conflict, resolution: 'local' }],
	};
	const tree = dialogTree(
		'SkillConflictsDialog',
		{ ws: 'ws', source, onClose: () => calls.push('close') },
		{
			useResolveSkillSource: () => ({
				mutateAsync: async () => {
					throw new Error('Stale conflict');
				},
			}),
			useSyncSkillSource: () => ({ mutateAsync: async () => calls.push('sync') }),
			isSkillSourceSyncing: () => false,
		},
	);
	await findElement(tree, 'button').props.onClick();
	assert.deepEqual(calls, []);
});

const publishingTree = (name, props, hooks, state = []) => {
	let index = 0;
	const dialogs = loadTs('src/pages/coreapp/Skills/_partial/SkillPublishingDialogs.partial.tsx', {
		react: {
			useState: (initial) => [index < state.length ? state[index++] : initial, () => {}],
			useRef: (initial) => ({ current: initial }),
			useEffect: () => {},
		},
		'@tanstack/react-query': { useQueryClient: () => ({ invalidateQueries: () => {} }) },
		'@/components/ui/Modal': {
			__esModule: true,
			default: modal,
			ModalHeader: modal,
			ModalBody: modal,
		},
		'@/api/core': {
			notify: { success: () => {}, error: () => {} },
			ApiError: { is: () => false },
		},
		'@/api/modules/knowledge-base': {
			useKnowledgeSourceApps: () => ({
				data: [{ type: 'github', accounts: [{ id: 'account', name: 'Me' }] }],
			}),
			useKnowledgeSourceOptions: () => ({ data: [] }),
		},
		'@/api/modules/agent-skills': hooks,
		'../_helper/skill-sync.helpers': helpers,
	});
	return dialogs[name](props);
};

test('publish sends the selected skill destination and sync choice after verification', () => {
	const calls = [];
	const tree = publishingTree(
		'PublishSkillDialog',
		{
			ws: 'ws',
			skill: { id: 'skill', slug: 'my-skill', name: 'My skill' },
			onClose: () => calls.push('close'),
		},
		{
			useRepositoryAccess: () => ({
				data: { repo: 'me/skills', branch: 'main', can_push: true, private: false },
				variables: { repo: 'me/skills', branch: 'main', credential_id: 'account' },
			}),
			usePublishAgentSkill: () => ({
				mutate: (payload, options) => {
					calls.push(payload);
					options.onSuccess();
				},
			}),
		},
		['account', 'me/skills', 'main', 'skills/custom', true],
	);
	findElement(tree, 'form').props.onSubmit({ preventDefault: () => {} });
	assert.deepEqual(calls, [
		{
			id: 'skill',
			body: {
				repo: 'me/skills',
				branch: 'main',
				credential_id: 'account',
				path: 'skills/custom',
				keep_synced: true,
			},
		},
		'close',
	]);
});

test('changing the destination or account invalidates a previous publishing check', () => {
	for (const state of [
		['account', 'me/other', 'main', 'skill', false],
		['other', 'me/skills', 'main', 'skill', false],
		['account', 'me/skills', 'dev', 'skill', false],
	]) {
		const calls = [];
		const tree = publishingTree(
			'PublishSkillDialog',
			{ ws: 'ws', skill: { id: 'skill', slug: 'skill' }, onClose: () => {} },
			{
				useRepositoryAccess: () => ({
					data: { repo: 'me/skills', branch: 'main', can_push: true },
					variables: { repo: 'me/skills', branch: 'main', credential_id: 'account' },
				}),
				usePublishAgentSkill: () => ({ mutate: () => calls.push('publish') }),
			},
			state,
		);
		findElement(tree, 'form').props.onSubmit({ preventDefault: () => {} });
		assert.deepEqual(calls, []);
	}
});

test('read-only public source settings offer checking and never show an enabled two-way option', () => {
	const html = renderDialog('SkillSyncSettingsDialog', {
		id: 'source',
		repo: 'anthropics/skills',
		two_way: false,
		credential_id: null,
		branch: 'main',
		status: 'ready',
	});
	assert.doesNotMatch(html, /Enable two-way sync/);
	assert.match(html, /make an editable copy or fork it/);
});

test('combined conflicts send edited files with the reviewed conflict snapshot', async () => {
	const calls = [];
	const files = { 'SKILL.md': 'Combined', 'ref.md': 'Useful' };
	const tree = dialogTree(
		'SkillConflictsDialog',
		{
			ws: 'ws',
			source: { id: 'repo', status: 'conflict', conflicts: [conflict] },
			onClose: () => {},
		},
		{
			useResolveSkillSource: () => ({ mutateAsync: async (p) => calls.push(p) }),
			useSyncSkillSource: () => ({ mutateAsync: async () => ({ status: 'ready' }) }),
			isSkillSourceSyncing: () => false,
		},
		[
			{
				'': {
					fingerprint: helpers.conflictFingerprint(conflict),
					resolution: 'merged',
					files,
				},
			},
			false,
		],
	);
	// The apply button follows the file editors.
	const buttons = [];
	const walk = (t) => {
		if (t?.type === 'button') buttons.push(t);
		for (const child of React.Children.toArray(t?.props?.children)) walk(child);
	};
	walk(tree);
	await buttons.at(-1).props.onClick();
	assert.deepEqual(calls, [
		{ id: 'repo', body: { path: '', commit_sha: 'head', resolution: 'merged', files } },
	]);
	assert.equal(
		helpers.selectedConflictFiles(
			{ ...conflict, commit_sha: 'new' },
			{ fingerprint: helpers.conflictFingerprint(conflict), resolution: 'merged', files },
		),
		undefined,
	);
});

for (const [service, action, method, args, key, url] of [
	[
		'AgentSkillService',
		'copy',
		'post',
		['ws', 'skill'],
		'skill',
		'/workspaces/ws/skills/skill/copy',
	],
	[
		'AgentSkillService',
		'publish',
		'post',
		[
			'ws',
			'skill',
			{
				repo: 'me/skills',
				branch: 'main',
				path: 's',
				credential_id: 'a',
				keep_synced: false,
			},
		],
		'skill',
		'/workspaces/ws/skills/skill/publish',
	],
	[
		'SkillSourceService',
		'access',
		'post',
		['ws', { repo: 'me/skills', credential_id: 'a' }],
		'access',
		'/workspaces/ws/skill-sources/access',
	],
	[
		'SkillSourceService',
		'fork',
		'post',
		['ws', 'source', { credential_id: 'a' }],
		'source',
		'/workspaces/ws/skill-sources/source/fork',
	],
	[
		'SkillSourceService',
		'completeFork',
		'post',
		['ws', 'source'],
		'source',
		'/workspaces/ws/skill-sources/source/fork/complete',
	],
	[
		'SkillSourceService',
		'cancelFork',
		'delete',
		['ws', 'source'],
		'source',
		'/workspaces/ws/skill-sources/source/fork',
	],
	[
		'SkillSourceService',
		'upstream',
		'get',
		['ws', 'source'],
		'upstream',
		'/workspaces/ws/skill-sources/source/upstream',
	],
	[
		'SkillSourceService',
		'applyUpstream',
		'post',
		['ws', 'source', { fork_sha: 'a', upstream_sha: 'b' }],
		'source',
		'/workspaces/ws/skill-sources/source/upstream',
	],
])
	test(`${action} uses its workspace endpoint and preserves the payload`, async () => {
		const calls = [];
		const result = { id: 'result' };
		const client = {
			[method]: (...request) => {
				calls.push(request);
				return Promise.resolve({ data: { data: { [key]: result } } });
			},
		};
		const services = loadTs('src/api/modules/agent-skills/agent-skills.service.ts', {
			'@/api/client': { axiosClient: client },
			'@/api/core': { unwrapKey: (k) => (r) => r.data.data[k] },
			'./agent-skills.endpoints': endpoints,
		});
		assert.equal(await services[service][action](...args), result);
		assert.equal(calls[0][0], url);
		if (typeof args.at(-1) === 'object') assert.deepEqual(calls[0][1], args.at(-1));
	});
