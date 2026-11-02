// ============================================================
// Public Page Types
// ------------------------------------------------------------
// A workflow page as a visitor at its public link receives it
// (`GET /p/{token}`): blocks and theme only — never the graph,
// step names or ids behind it. Field blocks carry the workflow
// input they fill in under `field`.
// ============================================================

export type TPageAlign = 'left' | 'center' | 'right';

export type TPageTheme = {
	accent: string;
	appearance: 'light' | 'dark' | 'auto';
	background: 'soft' | 'plain' | 'dots' | 'gradient';
	radius: 'lg' | 'none' | 'sm' | 'md' | 'xl';
	font: string;
	width: 'medium' | 'narrow' | 'wide';
	logo_url: string | null;
	cover_url: string | null;
	/** Already resolved against the plan: false only when the workspace
	 *  may hide the badge and chose to. */
	show_branding: boolean;
};

/** The "Made with Agent1o1" badge. `url` is signup with the page
 *  creator's referral code and UTM tags; null when the badge is hidden. */
export type TPageBranding = {
	show: boolean;
	url: string | null;
};

export type TPageFieldType = 'string' | 'text' | 'number' | 'boolean' | 'select' | 'json';

export type TPageField = {
	key: string;
	label: string;
	type: TPageFieldType;
	required: boolean;
	help: string | null;
	default: unknown;
	options: { value: string; label: string }[];
};

export type TPageBlockType =
	| 'heading'
	| 'text'
	| 'image'
	| 'divider'
	| 'spacer'
	| 'callout'
	| 'button'
	| 'video'
	| 'faq'
	| 'testimonial'
	| 'stats'
	| 'logos'
	| 'tabs'
	| 'countdown'
	| 'field'
	| 'submit'
	| 'output'
	| 'status'
	| 'section'
	| 'columns'
	| 'column';

export type TPageBlock = {
	id: string;
	type: TPageBlockType;
	// Props differ per block type; see `PageSchema::props()` on the API.
	props: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
	field?: TPageField;
	children?: TPageBlock[];
};

export type TPublicPage = {
	name: string;
	description: string | null;
	workspace_name: string | null;
	theme: TPageTheme;
	branding: TPageBranding;
	locked: boolean;
	requires_password: boolean;
	blocks: TPageBlock[];
};

export type TPageSubmissionState = 'running' | 'waiting' | 'completed' | 'failed';

export type TPageSubmission = {
	id: string;
	state: TPageSubmissionState;
	outputs: Record<string, unknown>;
	progress: { completed: number; total: number };
	error: string | null;
	started_at: string | null;
	finished_at: string | null;
};

export type TSubmitPageDto = {
	input: Record<string, unknown>;
};

export type TSubmitPageResult = {
	submission: TPageSubmission;
	secret: string;
};

export type TUnlockPageResult = {
	access_token: string;
	page: TPublicPage;
};

/** Events a visitor's browser may report; views are counted server-side. */
export type TPageEventType = 'start' | 'badge_click';
