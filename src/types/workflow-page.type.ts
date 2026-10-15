import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';

// ─── Content ─────────────────────────────────────────────────
// The canonical shape `PageSchema::normalize()` returns. The server fills in
// every prop, so a block read back from the API always has all of them.

export type TPageBlockWidth = 'full' | 'two_thirds' | 'half' | 'third';
export type TPageAlign = 'left' | 'center' | 'right';

export type TPageBlockProps = {
	heading: { text: string; level: 1 | 2 | 3; align: TPageAlign };
	text: { markdown: string; align: TPageAlign };
	image: {
		url: string | null;
		alt: string | null;
		fit: 'cover' | 'contain';
		height: 'md' | 'sm' | 'lg' | 'auto';
	};
	divider: { style: 'solid' | 'dashed' };
	spacer: { size: 'md' | 'sm' | 'lg' | 'xl' };
	callout: {
		tone: 'info' | 'success' | 'warning' | 'danger';
		title: string | null;
		markdown: string;
	};
	field: {
		field_key: string;
		label: string | null;
		placeholder: string | null;
		help: string | null;
		variant: 'auto' | 'input' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'switch';
	};
	submit: {
		label: string;
		running_label: string;
		align: 'left' | 'center' | 'right' | 'stretch';
	};
	output: {
		output_name: string;
		label: string | null;
		display: 'auto' | 'text' | 'markdown' | 'json' | 'table' | 'image' | 'link';
		empty_text: string | null;
		copyable: boolean;
	};
	status: { show_progress: boolean; idle_text: string | null };
	button: {
		label: string;
		url: string | null;
		style: 'solid' | 'outline' | 'ghost';
		align: 'left' | 'center' | 'right' | 'stretch';
		new_tab: boolean;
	};
	video: { url: string | null; caption: string | null };
	faq: { items: { question: string; answer: string }[]; open_first: boolean };
	testimonial: {
		quote: string;
		author: string | null;
		role: string | null;
		avatar_url: string | null;
		rating: number;
	};
	stats: { items: { value: string; label: string }[]; align: 'center' | 'left' };
	logos: { title: string | null; items: { url: string; alt: string | null }[]; grayscale: boolean };
	tabs: { items: { label: string; markdown: string }[] };
	/** `target` is an ISO 8601 moment in UTC. */
	countdown: {
		target: string | null;
		label: string | null;
		ended_text: string | null;
		show_seconds: boolean;
	};
	section: {
		background: 'none' | 'subtle' | 'accent' | 'dark' | 'image';
		image_url: string | null;
		padding: 'md' | 'sm' | 'lg';
		align: 'left' | 'center';
	};
	columns: {
		layout: TPageColumnLayout;
		gap: 'md' | 'sm' | 'lg';
		valign: 'top' | 'center';
	};
	column: { background: 'none' | 'subtle' };
};

export type TPageColumnLayout = '1-1' | '1-2' | '2-1' | '1-1-1' | '1-1-1-1';

export type TPageBlockType = keyof TPageBlockProps;

/** Blocks that hold other blocks — see `PageBlockType::fitsIn()` on the server. */
export type TPageContainerType = 'section' | 'columns' | 'column';

/** An interface, so the block types can refer to themselves. */
export interface TPageBlockChildren {
	children: TPageBlock[];
}

export type TPageBlockOf<T extends TPageBlockType> = {
	id: string;
	type: T;
	width: TPageBlockWidth;
	props: TPageBlockProps[T];
} & (T extends TPageContainerType ? TPageBlockChildren : unknown);

export type TPageBlock = { [T in TPageBlockType]: TPageBlockOf<T> }[TPageBlockType];

export type TPageFont =
	| 'sans'
	| 'serif'
	| 'mono'
	| 'inter'
	| 'dm_sans'
	| 'manrope'
	| 'poppins'
	| 'space_grotesk'
	| 'outfit'
	| 'playfair'
	| 'lora'
	| 'fraunces'
	| 'jetbrains_mono';

export type TPageTheme = {
	accent: string;
	appearance: 'light' | 'dark' | 'auto';
	background: 'soft' | 'plain' | 'dots' | 'gradient';
	radius: 'lg' | 'none' | 'sm' | 'md' | 'xl';
	font: TPageFont;
	width: 'medium' | 'narrow' | 'wide';
	logo_url: string | null;
	cover_url: string | null;
	show_branding: boolean;
};

export type TPageContent = {
	blocks: TPageBlock[];
	theme: TPageTheme;
};

/** A block saved to the workspace's library, to drop into any page. */
export type TPageSection = {
	id: string;
	name: string;
	block: TPageBlock;
	created_by?: { id: string; name: string } | null;
	created_at: string;
	updated_at: string;
};

// ─── Page (for the people who build it) ──────────────────────

export type TPageAccess = 'workspace' | 'link' | 'password';

export type TPageIssue = {
	severity: 'error' | 'warning';
	code: string;
	message: string;
	block_id: string | null;
};

/** What a link to the page shows when it's pasted into a chat or a post. */
export type TPageSharePreview = {
	title: string;
	description: string;
	image_url: string | null;
	theme_color: string;
	site_name: string;
};

export type TWorkflowPage = {
	id: string;
	workflow_id: string;
	workflow: { id: string; name: string; published: boolean; trashed: boolean } | null;
	name: string;
	description: string | null;
	/** Left out of list responses. */
	content?: TPageContent;
	published_content?: TPageContent | null;
	is_published: boolean;
	has_unpublished_changes: boolean;
	published_at: string | null;
	published_by?: { id: string; name: string } | null;
	access: TPageAccess;
	has_password: boolean;
	public_token: string;
	is_enabled: boolean;
	max_runs_per_day: number | null;
	/** The link card the builder chose; null parts are worked out from the page. */
	share: { title: string | null; description: string | null; image_url: string | null };
	/** The link card as it will show. Left out of list responses. */
	share_preview?: TPageSharePreview;
	/** List only: runs started from the page, not counting builder test runs. */
	runs_count?: number;
	last_run_at?: string | null;
	issues: TPageIssue[];
	/** Moves on whenever either draft changes; sent back as `base_revision` when saving. */
	draft_revision: number;
	/** Version B, for an A/B test. `live` once it has been published. */
	variant: {
		exists: boolean;
		live: boolean;
		/** Percent of visitors who get B while it's live. */
		split: number;
		/** Left out of list responses; null when there is no version B. */
		content?: TPageContent | null;
		issues: TPageIssue[];
	};
	created_by?: { id: string; name: string } | null;
	created_at: string;
	updated_at: string;
};

export type TCreateWorkflowPageDto = {
	workflow_id: string;
	name?: string;
	description?: string;
	/** Lays the page out from a page template instead of the default starter. */
	template_id?: string;
};

export type TUpdateWorkflowPageDto = Partial<{
	name: string;
	description: string | null;
	workflow_id: string;
	content: TPageContent;
	access: TPageAccess;
	password: string;
	is_enabled: boolean;
	max_runs_per_day: number | null;
	share_title: string | null;
	share_description: string | null;
	share_image_url: string | null;
	variant_content: TPageContent;
	variant_split: number;
	/** The `draft_revision` the draft being saved was based on; a mismatch is refused (409). */
	base_revision: number | null;
}>;

export type TPageVariant = 'a' | 'b';

// ─── Using a page ────────────────────────────────────────────

/** A field block as served to the person using the page, with the
 *  interface field it fills in. */
export type TPageViewFieldBlock = TPageBlockOf<'field'> & { field: TWorkflowInterfaceField };

export type TPageViewBlock = Exclude<TPageBlock, TPageBlockOf<'field'>> | TPageViewFieldBlock;

export type TPageView = {
	name: string;
	description: string | null;
	workspace_name: string | null;
	theme: TPageTheme;
	/** A password page before the password is entered: no blocks. */
	locked: boolean;
	requires_password: boolean;
	blocks: TPageViewBlock[];
};

export type TPageRunState = 'running' | 'waiting' | 'completed' | 'failed';

export type TPageSubmissionResult = {
	id: string;
	state: TPageRunState;
	/** Only the outputs the page shows. */
	outputs: Record<string, unknown>;
	progress: { completed: number; total: number };
	error: string | null;
	started_at: string | null;
	finished_at: string | null;
	/** Members only. */
	run_id?: string | null;
	is_test?: boolean;
};

export type TPageSubmissionRecord = {
	id: string;
	is_test: boolean;
	variant: TPageVariant;
	/** The values submitted. */
	input: Record<string, unknown>;
	/** The run's outputs that the page shows. */
	outputs: Record<string, unknown>;
	duration_seconds: number | null;
	user: { id: string; name: string } | null;
	run: {
		id: string;
		status: string;
		started_at: string | null;
		finished_at: string | null;
	} | null;
	created_at: string;
};

export type TPageSubmissionStatus = 'completed' | 'failed' | 'running' | 'waiting';

export type TPageSubmissionFilters = {
	status?: TPageSubmissionStatus | null;
	variant?: TPageVariant | null;
	include_tests?: boolean;
	from?: string | null;
	to?: string | null;
	page?: number;
	per_page?: number;
};

export type TPageSubmissionPage = {
	submissions: TPageSubmissionRecord[];
	meta: { total: number; page: number; per_page: number; last_page: number };
};

// ─── Insights ────────────────────────────────────────────────

/** Unique visitors a day for views and starts; rates are 0–1, null with nothing to divide by. */
export type TPageInsightCounts = {
	views: number;
	starts: number;
	submissions: number;
	completed: number;
	failed: number;
	start_rate: number | null;
	conversion_rate: number | null;
	completion_rate: number | null;
};

export type TPageInsights = {
	range: { from: string; to: string; days: number };
	totals: TPageInsightCounts & { avg_duration_seconds: number | null };
	daily: (TPageInsightCounts & { date: string })[];
	/** Version A then B, while an A/B test runs or has data; empty otherwise. */
	variants: (TPageInsightCounts & { variant: TPageVariant; avg_duration_seconds: number | null })[];
};

// ─── Building together ───────────────────────────────────────

export type TPageVersionKind = 'published' | 'saved' | 'before_restore' | 'before_generation';

export type TPageVersion = {
	id: string;
	number: number;
	kind: TPageVersionKind;
	label: string | null;
	has_variant: boolean;
	/** Only when one version is opened. */
	content?: TPageContent;
	variant_content?: TPageContent | null;
	created_by?: { id: string; name: string } | null;
	created_at: string;
};

export type TPageComment = {
	id: string;
	/** The block a thread is about; null for the whole page. */
	block_id: string | null;
	body: string;
	author: { id: string; name: string } | null;
	is_mine: boolean;
	resolved_at: string | null;
	resolved_by?: { id: string; name: string } | null;
	/** Threads only. */
	replies?: TPageComment[];
	created_at: string;
	updated_at: string;
};

export type TPageGeneration = {
	id: string;
	prompt: string;
	variant: TPageVariant;
	keep_theme: boolean;
	status: 'pending' | 'running' | 'completed' | 'failed';
	content: TPageContent | null;
	error: string | null;
	created_at: string;
	updated_at: string;
};
