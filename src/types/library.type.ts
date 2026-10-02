// ============================================================
// Library Types
// ------------------------------------------------------------
// The gallery of files from agent chats — uploads and what agents
// made. Mirrors `LibraryItemResource` on the backend; separate from
// the Artifacts file manager, though both read the same stored files.
// ============================================================

export type TLibraryItemKind = 'image' | 'file';

export type TLibraryItem = {
	id: string;
	filename: string;
	mime_type: string;
	kind: TLibraryItemKind;
	size: number;
	/** `uploaded` when a member attached it to a message; otherwise the agent made it. */
	source: 'uploaded' | 'generated';
	agent: { id: string; name: string; icon: string | null; color: string | null } | null;
	chat: { id: string; title: string | null } | null;
	/** Short-lived signed link for thumbnails and the viewer; null for types that can't be shown inline. */
	view_url: string | null;
	created_at: string;
};

export type TLibraryListParams = {
	type?: TLibraryItemKind;
	agent_id?: string;
	search?: string;
	per_page?: number;
};
