import type { LucideIcon } from 'lucide-react';

export interface DisplayItem {
	id: string;
	title: string;
	/** The run kind's label, e.g. `Workflow` or `Chat`. */
	type: string;
	timestamp: string;
	credits: number;
	status: string;
	icon: LucideIcon;
}
