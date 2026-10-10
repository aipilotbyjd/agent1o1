const base = (ws: string) => `/workspaces/${ws}/agents`;
const agent = (ws: string, id: string) => `${base(ws)}/${id}`;

export const AgentEndpoints = {
	list: base,
	create: base,
	draft: (ws: string) => `${base(ws)}/draft`,
	detail: agent,
	update: agent,
	delete: agent,
	trash: (ws: string) => `${base(ws)}/trash`,
	restore: (ws: string, id: string) => `${agent(ws, id)}/restore`,
	forceDelete: (ws: string, id: string) => `${agent(ws, id)}/force`,
	duplicate: (ws: string, id: string) => `${agent(ws, id)}/duplicate`,
	improveInstructions: (ws: string, id: string) => `${agent(ws, id)}/instructions/improve`,
	syncTags: (ws: string, id: string) => `${agent(ws, id)}/tags`,
} as const;
