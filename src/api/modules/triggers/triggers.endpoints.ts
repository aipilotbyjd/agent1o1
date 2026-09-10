// A trigger is one flat, workspace-scoped resource that points at either a
// workflow or an agent via `target_type`/`target_id` in the request body —
// not nested under `agents/{agent}/triggers` or `workflows/{workflow}/triggers`.
const base = (ws: string) => `/workspaces/${ws}/triggers`;
const trigger = (ws: string, id: string) => `${base(ws)}/${id}`;

export const TriggerEndpoints = {
	list: base,
	create: base,
	update: trigger,
	delete: trigger,
	run: (ws: string, id: string) => `${trigger(ws, id)}/run`,
	rotateToken: (ws: string, id: string) => `${trigger(ws, id)}/rotate-token`,
	events: (ws: string, id: string) => `${trigger(ws, id)}/events`,
} as const;
