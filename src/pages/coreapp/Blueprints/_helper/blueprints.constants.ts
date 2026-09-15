import {
	Workflow,
	Bot,
	Layers,
	Sparkles,
	Zap,
	MessageSquare,
	BarChart3,
	Megaphone,
	type LucideIcon,
} from 'lucide-react';

/** Icon/color are free-text fields on the record — this is a display
 *  fallback, not a fixed catalog the backend enforces. */
const ICON_MAP: Record<string, LucideIcon> = {
	workflow: Workflow,
	bot: Bot,
	sparkles: Sparkles,
	zap: Zap,
	chat: MessageSquare,
	analytics: BarChart3,
	marketing: Megaphone,
};

export const getTemplateIcon = (icon: string | null, kind: 'workflow' | 'agent' | 'collection'): LucideIcon => {
	if (icon && ICON_MAP[icon.toLowerCase()]) return ICON_MAP[icon.toLowerCase()];
	if (kind === 'workflow') return Workflow;
	if (kind === 'agent') return Bot;
	return Layers;
};

export const DEFAULT_TEMPLATE_COLORS: Record<'workflow' | 'agent' | 'collection', string> = {
	workflow: '#10A37F',
	agent: '#6366F1',
	collection: '#D97706',
};

export const getTemplateColor = (color: string | null, kind: 'workflow' | 'agent' | 'collection'): string =>
	color || DEFAULT_TEMPLATE_COLORS[kind];

export const formatUsageCount = (count: number): string => {
	if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
	return count.toString();
};
