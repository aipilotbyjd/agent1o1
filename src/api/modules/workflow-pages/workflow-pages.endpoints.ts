const base = (ws: string) => `/workspaces/${ws}/pages`;
const page = (ws: string, id: string) => `${base(ws)}/${id}`;

export const WorkflowPageEndpoints = {
	list: base,
	create: base,
	detail: page,
	update: page,
	delete: page,
	duplicate: (ws: string, id: string) => `${page(ws, id)}/duplicate`,
	publish: (ws: string, id: string) => `${page(ws, id)}/publish`,
	unpublish: (ws: string, id: string) => `${page(ws, id)}/unpublish`,
	rotateLink: (ws: string, id: string) => `${page(ws, id)}/rotate-link`,
	view: (ws: string, id: string) => `${page(ws, id)}/view`,
	submissions: (ws: string, id: string) => `${page(ws, id)}/submissions`,
	exportSubmissions: (ws: string, id: string) => `${page(ws, id)}/submissions/export`,
	insights: (ws: string, id: string) => `${page(ws, id)}/insights`,
	events: (ws: string, id: string) => `${page(ws, id)}/events`,
	variant: (ws: string, id: string) => `${page(ws, id)}/variant`,
	promoteVariant: (ws: string, id: string) => `${page(ws, id)}/variant/promote`,
	versions: (ws: string, id: string) => `${page(ws, id)}/versions`,
	version: (ws: string, id: string, versionId: string) => `${page(ws, id)}/versions/${versionId}`,
	restoreVersion: (ws: string, id: string, versionId: string) => `${page(ws, id)}/versions/${versionId}/restore`,
	comments: (ws: string, id: string) => `${page(ws, id)}/comments`,
	comment: (ws: string, id: string, commentId: string) => `${page(ws, id)}/comments/${commentId}`,
	generations: (ws: string, id: string) => `${page(ws, id)}/generations`,
	generation: (ws: string, id: string, generationId: string) => `${page(ws, id)}/generations/${generationId}`,
	submission: (ws: string, id: string, submissionId: string) =>
		`${page(ws, id)}/submissions/${submissionId}`,
} as const;

export const PageSectionEndpoints = {
	list: (ws: string) => `/workspaces/${ws}/page-sections`,
	create: (ws: string) => `/workspaces/${ws}/page-sections`,
	update: (ws: string, id: string) => `/workspaces/${ws}/page-sections/${id}`,
	delete: (ws: string, id: string) => `/workspaces/${ws}/page-sections/${id}`,
} as const;

/** Unauthenticated: the token in the URL is the page's link. */
export const PublicPageEndpoints = {
	show: (token: string) => `/p/${token}`,
	unlock: (token: string) => `/p/${token}/unlock`,
	submit: (token: string) => `/p/${token}/submissions`,
	result: (token: string, submissionId: string) => `/p/${token}/submissions/${submissionId}`,
	events: (token: string) => `/p/${token}/events`,
} as const;
