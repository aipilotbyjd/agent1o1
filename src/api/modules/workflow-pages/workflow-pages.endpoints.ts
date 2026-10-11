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
	submission: (ws: string, id: string, submissionId: string) =>
		`${page(ws, id)}/submissions/${submissionId}`,
} as const;

/** Unauthenticated: the token in the URL is the page's link. */
export const PublicPageEndpoints = {
	show: (token: string) => `/p/${token}`,
	unlock: (token: string) => `/p/${token}/unlock`,
	submit: (token: string) => `/p/${token}/submissions`,
	result: (token: string, submissionId: string) => `/p/${token}/submissions/${submissionId}`,
} as const;
