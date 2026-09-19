import type { LucideIcon } from 'lucide-react';

export type TAgentTemplate = {
	title: string;
	copy: string;
	icons: LucideIcon[];
	count: string;
	categories: string[];
	headerIcon?: LucideIcon;
	headerIconColor?: 'purple' | 'green';
	badge?: 'Popular' | 'New';
	footerIcon?: LucideIcon;
};
