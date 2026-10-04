export type TRunLog = {
	id: string;
	nodeId?: string;
	level: 'info' | 'warn' | 'error';
	message: string;
	at: number;
};

export type TRunState = {
	id: string | null;
	status: 'idle' | 'running' | 'success' | 'error' | 'stopped';
	startedAt: number | null;
	finishedAt: number | null;
	currentNodeId: string | null;
	logs: TRunLog[];
};

export type TNodeRunRecord = {
	nodeId: string;
	label: string;
	status: 'success' | 'error' | 'skipped';
	durationMs?: number;
	output?: unknown;
	error?: string;
};

export type TRunRecord = {
	id: string;
	startedAt: number;
	finishedAt: number;
	status: 'success' | 'error' | 'stopped';
	trigger: 'manual';
	nodeRuns: TNodeRunRecord[];
	logs: TRunLog[];
};
