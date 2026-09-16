import type { LucideIcon } from 'lucide-react';
import {
	Blocks,
	Bot,
	Calendar,
	Cloud,
	Code,
	Database,
	FileText,
	Folder,
	Globe,
	Mail,
	MessageSquare,
	Table,
	Workflow,
	Wrench,
	Zap,
} from 'lucide-react';

/** Known category slugs → curated icon. */
const SLUG_ICONS: Record<string, LucideIcon> = {
	'ai-automation': Bot,
	'triggers-events': Zap,
	'flow-logic': Workflow,
	'data-transform': Database,
	custom: Wrench,
};

/** Keyword fallbacks for app integrations and unmapped categories. */
const KEYWORD_ICONS: [RegExp, LucideIcon][] = [
	[/ai|automat|agent|gpt|llm|model/i, Bot],
	[/trigger|event|webhook|schedul/i, Zap],
	[/flow|logic|condition|loop|branch/i, Workflow],
	[/data|transform|filter|merge|format/i, Database],
	[/custom|tool|team/i, Wrench],
	[/web|http|globe|url|browser|scrape/i, Globe],
	[/mail|email|gmail|smtp/i, Mail],
	[/file|drive|storage|folder|s3|bucket/i, Folder],
	[/slack|chat|message|discord/i, MessageSquare],
	[/calendar|date|time/i, Calendar],
	[/doc|note|text/i, FileText],
	[/sheet|table|excel|csv|airtable/i, Table],
	[/git|repo|code|hub/i, Code],
	[/cloud|api/i, Cloud],
];

export const resolveCategoryIcon = (slug?: string, label?: string): LucideIcon => {
	if (slug && SLUG_ICONS[slug]) return SLUG_ICONS[slug];
	const haystack = `${slug ?? ''} ${label ?? ''}`;
	for (const [pattern, Icon] of KEYWORD_ICONS) {
		if (pattern.test(haystack)) return Icon;
	}
	return Blocks;
};

type Props = {
	slug?: string;
	label?: string;
	size?: number;
	className?: string;
};

const CategoryIcon = ({ slug, label, size = 18, className }: Props) => {
	const Icon = resolveCategoryIcon(slug, label);
	return <Icon size={size} className={className} strokeWidth={2} aria-hidden />;
};

export default CategoryIcon;
