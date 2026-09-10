// ============================================================
// API — Public Entry Point
// ------------------------------------------------------------
// Namespaced per resource — never a flat `export *` from modules.
// Import `authApi.useLogin` / `workspacesApi.useWorkspaces`, or
// reach directly into `@/api/modules/<resource>` for tree-shaking.
// This is what keeps a second resource from silently colliding with
// the first's hook names.
// ============================================================

export * from './client';
export * from './core';

export * as authApi from './modules/auth';
export * as userApi from './modules/user';
export * as workspacesApi from './modules/workspaces';
export * as workspaceMembersApi from './modules/workspace-members';
export * as catalogApi from './modules/catalog';
export * as connectorsApi from './modules/connectors';
export * as secretsApi from './modules/secrets';
export * as nodesApi from './modules/nodes';
export * as agentSkillsApi from './modules/agent-skills';
export * as agentsApi from './modules/agents';
export * as triggersApi from './modules/triggers';
export * as foldersApi from './modules/folders';
export * as tagsApi from './modules/tags';
export * as workflowsApi from './modules/workflows';
export * as workflowBuilderApi from './modules/workflow-builder';
export * as runsApi from './modules/runs';
export * as knowledgeBaseApi from './modules/knowledge-base';
export * as templatesApi from './modules/templates';
export * as artifactsApi from './modules/artifacts';
export * as onboardingApi from './modules/onboarding';
export * as billingApi from './modules/billing';
export * as notificationsApi from './modules/notifications';
export * as notificationChannelsApi from './modules/notification-channels';
export * as notificationPreferencesApi from './modules/notification-preferences';
