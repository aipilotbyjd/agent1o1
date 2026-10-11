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
};

export type TPageBlockType = keyof TPageBlockProps;

export type TPageBlockOf<T extends TPageBlockType> = {
	id: string;
	type: T;
	width: TPageBlockWidth;
	props: TPageBlockProps[T];
};

export type TPageBlock = { [T in TPageBlockType]: TPageBlockOf<T> }[TPageBlockType];

export type TPageTheme = {
	accent: string;
	appearance: 'light' | 'dark' | 'auto';
	background: 'soft' | 'plain' | 'dots' | 'gradient';
	radius: 'lg' | 'none' | 'sm' | 'md' | 'xl';
	font: 'sans' | 'serif' | 'mono';
	width: 'medium' | 'narrow' | 'wide';
	logo_url: string | null;
	cover_url: string | null;
	show_branding: boolean;
};

export type TPageContent = {
	blocks: TPageBlock[];
	theme: TPageTheme;
};

// ─── Page (for the people who build it) ──────────────────────

export type TPageAccess = 'workspace' | 'link' | 'password';

export type TPageIssue = {
	severity: 'error' | 'warning';
	code: string;
	message: string;
	block_id: string | null;
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
	/** List only: runs started from the page, not counting builder test runs. */
	runs_count?: number;
	last_run_at?: string | null;
	issues: TPageIssue[];
	created_by?: { id: string; name: string } | null;
	created_at: string;
	updated_at: string;
};

export type TCreateWorkflowPageDto = {
	workflow_id: string;
	name?: string;
	description?: string;
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
}>;

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
	user: { id: string; name: string } | null;
	run: {
		id: string;
		status: string;
		started_at: string | null;
		finished_at: string | null;
	} | null;
	created_at: string;
};
