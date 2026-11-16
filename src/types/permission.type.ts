// ============================================================
// Permission Types
// ------------------------------------------------------------
// Mirrors the backend's App\Enums\Workspaces\Permission. The
// workspace payload carries the viewer's own list, worked out
// from their role server-side, so the frontend never maps roles
// to permissions itself.
// ============================================================

export type TPermission =
	| 'workspace.view'
	| 'workspace.update'
	| 'workspace.delete'
	| 'member.view'
	| 'member.invite'
	| 'member.update-role'
	| 'member.remove'
	| 'invitation.view'
	| 'workflow.view'
	| 'workflow.manage'
	| 'workflow.publish'
	| 'workflow.version'
	| 'workflow.trigger'
	| 'workflow.builder.use'
	| 'workflow.approve-publish'
	| 'page.view'
	| 'page.manage'
	| 'node.view'
	| 'node.manage'
	| 'agent.view'
	| 'agent.manage'
	| 'agent.chat'
	| 'agent.skill.manage'
	| 'agent.approve'
	| 'agent.policy.manage'
	| 'assistant.use'
	| 'connector.view'
	| 'connector.manage'
	| 'ai-credential.view'
	| 'ai-credential.use-personal'
	| 'ai-credential.manage'
	| 'secret.view'
	| 'secret.manage'
	| 'template.view'
	| 'template.manage'
	| 'artifact.view'
	| 'artifact.manage'
	| 'run.view'
	| 'run.trigger'
	| 'trigger.view'
	| 'trigger.manage'
	| 'api-key.view'
	| 'api-key.manage'
	| 'billing.view'
	| 'billing.manage'
	| 'notification-channel.view'
	| 'notification-channel.manage'
	| 'audit-log.view';

/** One permission, or several of which any (or all, with `mode: 'all'`) must be granted. */
export type TPermissionCheck = TPermission | TPermission[];

export type TPermissionMode = 'any' | 'all';
