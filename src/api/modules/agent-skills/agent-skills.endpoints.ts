export const AgentSkillEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/skills`,
	create: (ws: string) => `/workspaces/${ws}/skills`,
	detail: (ws: string, id: string) => `/workspaces/${ws}/skills/${id}`,
	update: (ws: string, id: string) => `/workspaces/${ws}/skills/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/skills/${id}`,
} as const;

export const SkillReferenceEndpoints = {
	list: (ws: string, skillId: string) => `/workspaces/${ws}/skills/${skillId}/references`,
	create: (ws: string, skillId: string) => `/workspaces/${ws}/skills/${skillId}/references`,
	update: (ws: string, skillId: string, id: string) =>
		`/workspaces/${ws}/skills/${skillId}/references/${id}`,
	delete: (ws: string, skillId: string, id: string) =>
		`/workspaces/${ws}/skills/${skillId}/references/${id}`,
} as const;

export const SkillScriptEndpoints = {
	list: (ws: string, skillId: string) => `/workspaces/${ws}/skills/${skillId}/scripts`,
	create: (ws: string, skillId: string) => `/workspaces/${ws}/skills/${skillId}/scripts`,
	update: (ws: string, skillId: string, id: string) =>
		`/workspaces/${ws}/skills/${skillId}/scripts/${id}`,
	delete: (ws: string, skillId: string, id: string) =>
		`/workspaces/${ws}/skills/${skillId}/scripts/${id}`,
} as const;
