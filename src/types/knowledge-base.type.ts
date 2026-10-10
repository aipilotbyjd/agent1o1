// ============================================================
// Knowledge Base Types
// ------------------------------------------------------------
// Workspace-wide vector search — what `agent.type.ts`'s
// `TAgentKnowledgeSources` scopes an agent to. The embedding vector
// itself is never serialized; `dimensions` is its length, useful
// for diagnosing a chunk that never ranks. `collections` is derived
// (grouped) rather than a resource of its own.
// ============================================================

export type TDocumentEmbedding = {
	id: string;
	collection: string;
	/** Only its owner (and their assistant) can see it — never agents or other members. */
	private: boolean;
	knowledge_source_id: string | null;
	source: string | null;
	chunk_text: string;
	dimensions: number;
	metadata: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
};

export type TKnowledgeCollection = {
	collection: string;
	private: boolean;
	chunks_count: number;
};

/** Sent as `multipart/form-data` when `file` is used — the service builds
 *  the `FormData`. Exactly one of `text`/`file` is required. */
export type TIngestKnowledgeDto = {
	text?: string;
	file?: File;
	source?: string;
	collection?: string;
	metadata?: Record<string, unknown> | null;
	private?: boolean;
};

export type TIngestKnowledgeResult = {
	chunks_count: number;
	chunks: TDocumentEmbedding[];
};

export type TSearchKnowledgeDto = {
	query: string;
	collection?: string;
	limit?: number;
};

export type TKnowledgeSearchHit = {
	source: string | null;
	collection: string;
	text: string;
	url: string | null;
	private: boolean;
	score: number;
	metadata: Record<string, unknown> | null;
};

export type TReadKnowledgeDocumentParams = {
	source: string;
	collection?: string;
};

export type TKnowledgeDocument = {
	source: string;
	text: string;
};

// ─── Synced sources ─────────────────────────────────────────
// Web pages and connected apps the knowledge base keeps in sync, shared
// with the workspace or private to the member who added them.

export type TKnowledgeSourceType =
	| 'url'
	| 'google_drive'
	| 'gmail'
	| 'outlook'
	| 'github'
	| 'slack';

export type TKnowledgeSourceStatus = 'pending' | 'syncing' | 'ready' | 'failed';

export type TKnowledgeSource = {
	id: string;
	type: TKnowledgeSourceType;
	name: string;
	collection: string;
	private: boolean;
	config: Record<string, string>;
	credential_id: string | null;
	account: string | null;
	status: TKnowledgeSourceStatus;
	last_error: string | null;
	last_synced_at: string | null;
	documents_count: number;
	chunks_count: number;
	created_at: string;
};

export type TCreateKnowledgeSourceDto = {
	type: TKnowledgeSourceType;
	name: string;
	collection?: string;
	private?: boolean;
	credential_id?: string;
	config: Record<string, string>;
};

export type TUpdateKnowledgeSourceDto = {
	name?: string;
	config?: Record<string, string>;
};

export type TKnowledgeSourceDocument = {
	external_id: string;
	title: string | null;
	url: string | null;
	chunks_count: number;
	synced_at: string;
};

/** An app that can be synced, and the member's accounts for it (empty = not connected). */
export type TKnowledgeSourceApp = {
	type: TKnowledgeSourceType;
	accounts: { id: string; name: string; shared: boolean }[];
	/** Connected before, but every connection has expired — reconnect it. */
	expired: boolean;
};

/** A folder, label, repo or channel to pick when adding an app source. */
export type TKnowledgeSourceOption = {
	value: string;
	label: string;
	hint: string | null;
};
