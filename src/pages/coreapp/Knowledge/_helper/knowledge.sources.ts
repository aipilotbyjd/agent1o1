import {
	FileUp,
	GitBranch,
	Globe,
	HardDrive,
	Hash,
	Mail,
	Type,
	type LucideIcon,
} from 'lucide-react';
import type { TKnowledgeSourceType } from '@/types/knowledge-base.type';

export type TKnowledgeField = {
	key: string;
	label: string;
	placeholder: string;
	hint?: string;
	required?: boolean;
};

/**
 * Pick from the account instead of typing an id: the value goes to `key`,
 * the shown name to `labelKey`. `optional` sources still work with nothing
 * picked (`emptyLabel`), or with the `fields` filled in instead.
 */
export type TKnowledgePicker = {
	key: string;
	labelKey?: string;
	label: string;
	searchPlaceholder: string;
	emptyLabel?: string;
	optional?: boolean;
	/** Search runs in the app (Drive) rather than over the loaded list. */
	remoteSearch?: boolean;
};

/** Ways to add knowledge: once (text, a file) or kept in sync (a page or an app). */
export type TKnowledgeKind = 'text' | 'file' | TKnowledgeSourceType;

export type TKnowledgeKindDefinition = {
	label: string;
	description: string;
	icon: LucideIcon;
	synced: boolean;
	picker?: TKnowledgePicker;
	/** Typed settings — mirrors the backend readers' `configRules()`. With a picker these are the alternative. */
	fields: TKnowledgeField[];
	/** Shown above `fields` when there is a picker, e.g. "Or use a search". */
	fieldsTitle?: string;
};

export const KNOWLEDGE_KINDS: Record<TKnowledgeKind, TKnowledgeKindDefinition> = {
	text: {
		label: 'Text',
		description: 'Paste notes or a document',
		icon: Type,
		synced: false,
		fields: [],
	},
	file: {
		label: 'File',
		description: 'Upload a text file',
		icon: FileUp,
		synced: false,
		fields: [],
	},
	url: {
		label: 'Web page',
		description: 'Re-read every hour',
		icon: Globe,
		synced: true,
		fields: [
			{
				key: 'url',
				label: 'Page URL',
				placeholder: 'https://docs.example.com/pricing',
				required: true,
			},
		],
	},
	google_drive: {
		label: 'Google Drive',
		description: 'Docs, Sheets and Slides',
		icon: HardDrive,
		synced: true,
		picker: {
			key: 'folder_id',
			labelKey: 'folder_name',
			label: 'Folder',
			searchPlaceholder: 'Search folders…',
			emptyLabel: 'All of my Drive',
			optional: true,
			remoteSearch: true,
		},
		fieldsTitle: 'Only files named…',
		fields: [{ key: 'name_contains', label: 'Name contains', placeholder: 'e.g. Roadmap' }],
	},

	gmail: {
		label: 'Gmail',
		description: 'Mail under a label',
		icon: Mail,
		synced: true,
		picker: {
			key: 'label',
			label: 'Label',
			searchPlaceholder: 'Search labels…',
			optional: true,
		},
		fieldsTitle: 'Or use a Gmail search',
		fields: [
			{
				key: 'query',
				label: 'Gmail search',
				placeholder: 'from:sam@globex.com has:attachment',
			},
		],
	},

	outlook: {
		label: 'Outlook',
		description: 'Mail in a folder',
		icon: Mail,
		synced: true,
		picker: {
			key: 'folder_id',
			labelKey: 'folder_name',
			label: 'Folder',
			searchPlaceholder: 'Search folders…',
			optional: true,
		},
		fieldsTitle: 'Or use a search',
		fields: [{ key: 'query', label: 'Search', placeholder: 'from:sam@globex.com' }],
	},

	github: {
		label: 'GitHub',
		description: 'Issues and pull requests',
		icon: GitBranch,
		synced: true,
		picker: { key: 'repo', label: 'Repository', searchPlaceholder: 'Search repositories…' },
		fields: [],
	},

	slack: {
		label: 'Slack',
		description: 'A channel, day by day',
		icon: Hash,
		synced: true,
		picker: {
			key: 'channel',
			labelKey: 'channel_name',
			label: 'Channel',
			searchPlaceholder: 'Search channels…',
		},
		fields: [],
	},
};

/** Plain-text-like formats the backend can read — mirrors `knowledge_base.allowed_extensions`. */
export const ALLOWED_EXTENSIONS = [
	'txt',
	'md',
	'markdown',
	'csv',
	'json',
	'xml',
	'yaml',
	'yml',
	'html',
	'htm',
];

/**
 * Whether the settings are enough to add the source: a picked item, or the
 * typed alternative, or nothing for sources that read everything by default.
 */
export const hasRequiredSettings = (
	definition: TKnowledgeKindDefinition,
	config: Record<string, string>,
): boolean => {
	const filled = (key: string) => !!config[key]?.trim();

	if (definition.fields.some((field) => field.required && !filled(field.key))) return false;
	if (!definition.picker) return true;
	if (filled(definition.picker.key)) return true;
	if (definition.picker.emptyLabel) return true;

	return (
		definition.picker.optional === true && definition.fields.some((field) => filled(field.key))
	);
};
