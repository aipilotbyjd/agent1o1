import {
	Bot,
	Brain,
	CalendarDays,
	ChartLine,
	Code,
	Database,
	FileText,
	Flame,
	Headphones,
	Layers,
	Mail,
	Megaphone,
	Rocket,
	Search,
	Shield,
	SlidersHorizontal,
	Sparkles,
	Target,
	Users,
	type LucideIcon,
} from 'lucide-react';
import type { TAgentColor, TAgentIcon } from '@/types/agent.type';

export const AGENT_ICON_COMPONENTS: Record<TAgentIcon, LucideIcon> = {
	bot: Bot,
	brain: Brain,
	sparkles: Sparkles,
	search: Search,
	target: Target,
	shield: Shield,
	rocket: Rocket,
	layers: Layers,
	flame: Flame,
	'sliders-horizontal': SlidersHorizontal,
	users: Users,
	database: Database,
	'calendar-days': CalendarDays,
	'file-text': FileText,
	mail: Mail,
	megaphone: Megaphone,
	'chart-line': ChartLine,
	headphones: Headphones,
	code: Code,
};

export const AGENT_COLOR_SWATCHES: Record<TAgentColor, string> = {
	purple: 'bg-primary-400',
	green: 'bg-emerald-500',
	blue: 'bg-blue-500',
	teal: 'bg-teal-500',
	orange: 'bg-amber-500',
	red: 'bg-rose-500',
	rainbow: 'bg-gradient-to-tr from-primary-400 via-emerald-500 to-rose-500',
};

const TEXT_CLASSES: Record<TAgentColor, string> = {
	purple: 'text-primary-500 dark:text-primary-400',
	green: 'text-emerald-500 dark:text-emerald-400',
	blue: 'text-blue-500 dark:text-blue-400',
	teal: 'text-teal-500 dark:text-teal-400',
	orange: 'text-amber-500 dark:text-amber-400',
	red: 'text-rose-500 dark:text-rose-400',
	rainbow:
		'text-transparent bg-clip-text bg-gradient-to-tr from-primary-400 via-emerald-500 to-rose-500',
};

const TILE_CLASSES: Record<TAgentColor, string> = {
	purple: 'border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-500/10 dark:bg-primary-400/5 dark:text-primary-400',
	green: 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/10 dark:bg-emerald-500/5 dark:text-emerald-400',
	blue: 'border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/10 dark:bg-blue-500/5 dark:text-blue-400',
	teal: 'border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-500/10 dark:bg-teal-500/5 dark:text-teal-400',
	orange: 'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/10 dark:bg-amber-500/5 dark:text-amber-400',
	red: 'border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400',
	rainbow:
		'border-primary-100 bg-primary-50 text-primary-600 dark:border-primary-500/10 dark:bg-primary-400/5 dark:text-primary-400',
};

const asColor = (color: string | null | undefined): TAgentColor =>
	color && color in TEXT_CLASSES ? (color as TAgentColor) : 'purple';

export const agentIconFor = (icon: string | null | undefined): LucideIcon =>
	(icon && AGENT_ICON_COMPONENTS[icon as TAgentIcon]) || Bot;

export const agentColorTextClass = (color: string | null | undefined): string =>
	TEXT_CLASSES[asColor(color)];

export const agentColorTileClass = (color: string | null | undefined): string =>
	TILE_CLASSES[asColor(color)];
