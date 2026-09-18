export const PlanEndpoints = {
	list: () => `/plans`,
	subscription: (ws: string) => `/workspaces/${ws}/subscription`,
	cancelSubscription: (ws: string) => `/workspaces/${ws}/subscription/cancel`,
	resumeSubscription: (ws: string) => `/workspaces/${ws}/subscription/resume`,
	usageSnapshots: (ws: string) => `/workspaces/${ws}/usage-snapshots`,
} as const;
