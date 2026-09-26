import type { LucideIcon } from 'lucide-react';

export interface IHistoryItem {
	id: string;
	title: string;
	type: 'Chat' | 'Workflow run';
	timestamp: string;
	credits: number;
	status: 'Complete' | 'Failed' | 'Reviewed';
	icon: LucideIcon;
	chatTranscript?: { sender: 'user' | 'agent'; text: string }[];
}

export interface DisplayItem {
	id: string;
	title: string;
	type: 'Chat' | 'Workflow run';
	timestamp: string;
	credits: number;
	status: string;
	icon: LucideIcon;
	chatTranscript?: { sender: 'user' | 'agent'; text: string }[];
}
