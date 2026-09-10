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
	source: string | null;
	chunk_text: string;
	dimensions: number;
	metadata: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
};

export type TKnowledgeCollection = {
	collection: string;
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
	chunk_text: string;
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
