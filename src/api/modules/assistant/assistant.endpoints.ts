const base = (ws: string) => `/workspaces/${ws}/assistant`;
const session = (ws: string, id: string) => `${base(ws)}/sessions/${id}`;

export const AssistantEndpoints = {
	show: base,
	update: base,
} as const;

export const AssistantSessionEndpoints = {
	list: (ws: string) => `${base(ws)}/sessions`,
	create: (ws: string) => `${base(ws)}/sessions`,
	detail: session,
	update: session,
	delete: session,
	messages: (ws: string, id: string) => `${session(ws, id)}/messages`,
	context: (ws: string, id: string) => `${session(ws, id)}/context`,
	feedback: (ws: string, id: string, messageId: string) =>
		`${session(ws, id)}/messages/${messageId}/feedback`,
	send: (ws: string, id: string) => `${session(ws, id)}/messages`,
	turn: (ws: string, id: string, turnId: string) => `${session(ws, id)}/turns/${turnId}`,
	cancel: (ws: string, id: string, turnId: string) => `${session(ws, id)}/turns/${turnId}/cancel`,
	decide: (ws: string, id: string, turnId: string) =>
		`${session(ws, id)}/turns/${turnId}/decisions`,
} as const;

export const AssistantMemoryEndpoints = {
	list: (ws: string) => `${base(ws)}/memories`,
	delete: (ws: string, id: string) => `${base(ws)}/memories/${id}`,
} as const;

export const AssistantSettingsEndpoints = {
	apps: (ws: string) => `${base(ws)}/apps`,
	toolRules: (ws: string) => `${base(ws)}/tool-rules`,
	transcribe: (ws: string) => `${base(ws)}/transcribe`,
	styles: (ws: string) => `${base(ws)}/styles`,
	style: (ws: string, kind: string) => `${base(ws)}/styles/${kind}`,
	restoreStyle: (ws: string, kind: string, revisionId: string) =>
		`${base(ws)}/styles/${kind}/revisions/${revisionId}/restore`,
} as const;
