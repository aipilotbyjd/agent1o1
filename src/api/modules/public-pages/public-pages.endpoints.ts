// ============================================================
// Public Page Endpoints
// ------------------------------------------------------------
// A workflow page at its public link. Unauthenticated: the token
// in the URL is the page's link.
// ============================================================
export const PublicPageEndpoints = {
	show: (token: string) => `/p/${token}`,
	events: (token: string) => `/p/${token}/events`,
	unlock: (token: string) => `/p/${token}/unlock`,
	submit: (token: string) => `/p/${token}/submissions`,
	result: (token: string, submissionId: string) => `/p/${token}/submissions/${submissionId}`,
} as const;

/** Request headers the public page endpoints read. */
export const PublicPageHeaders = {
	visitor: 'X-Page-Visitor',
	access: 'X-Page-Access',
	submissionSecret: 'X-Submission-Secret',
} as const;
