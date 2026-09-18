import type { TListParams } from './api.type';

export type TCreditBalance = {
	workspace_id: string;
	plan: {
		name: string | null;
		slug: string | null;
	};
	billing_interval: 'monthly' | 'yearly' | null;
	credits: {
		limit: number | null;
		used: number | null;
		remaining: number | null;
		from_packs: number | null;
		rolled_over: number | null;
	};
	period: {
		start: string | null;
		end: string | null;
	};
};

export type TCreditTransactionType =
	| 'execution'
	| 'ai_execution'
	| 'code_execution'
	| 'refund'
	| 'adjustment'
	| 'pack_purchase'
	| 'bonus'
	| 'rollover';

export type TCreditTransaction = {
	id: string;
	type: TCreditTransactionType;
	credits: number;
	description: string;
	execution_id: string | null;
	created_at: string;
};

export type TCreditTransactionFilters = TListParams & {
	type?: TCreditTransactionType;
	from?: string;
	to?: string;
};

export type TCreditPack = {
	id: string;
	credits_amount: number;
	credits_remaining: number;
	price_cents: number;
	currency: string;
	status: 'pending' | 'active' | 'exhausted' | 'expired' | 'refunded';
	purchased_at: string;
	expires_at: string | null;
};

export type TUsageSnapshot = {
	date: string;
	credits_used: number;
	executions_total: number;
	executions_succeeded: number;
	executions_failed: number;
	nodes_executed: number;
	ai_nodes_executed: number;
};

export type TUsageSnapshots = {
	from: string;
	to: string;
	snapshots: TUsageSnapshot[];
};
