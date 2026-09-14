import {
	Puzzle,
	Wrench,
	Zap,
	Sparkles,
	Wand2,
	Lightbulb,
	Hammer,
	type LucideIcon,
} from 'lucide-react';

export const SKILL_CATEGORIES = [
	'General',
	'Research',
	'Data',
	'Communication',
	'Automation',
	'Development',
	'Content',
] as const;

export type TSkillCategory = (typeof SKILL_CATEGORIES)[number];

export const SKILL_ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
	{ name: 'Puzzle', Icon: Puzzle },
	{ name: 'Wrench01', Icon: Wrench },
	{ name: 'Zap', Icon: Zap },
	{ name: 'Sparkles', Icon: Sparkles },
	{ name: 'AiMagic', Icon: Wand2 },
	{ name: 'Idea01', Icon: Lightbulb },
	{ name: 'Tools', Icon: Hammer },
];

export const SKILL_COLOR_OPTIONS = [
	'#6366F1',
	'#7C3AED',
	'#D97706',
	'#10A37F',
	'#EC4899',
	'#0EA5E9',
	'#EF4444',
];

export const getSkillIconComponent = (icon?: string | null): LucideIcon => {
	const found = SKILL_ICON_OPTIONS.find((opt) => opt.name === icon);
	return found ? found.Icon : Puzzle;
};

export const getSkillCategoryColor = (category?: string | null): string => {
	switch (category) {
		case 'Research':
			return '#7C3AED';
		case 'Data':
			return '#0EA5E9';
		case 'Communication':
			return '#EC4899';
		case 'Automation':
			return '#D97706';
		case 'Development':
			return '#10A37F';
		case 'Content':
			return '#EF4444';
		default:
			return '#6366F1';
	}
};
