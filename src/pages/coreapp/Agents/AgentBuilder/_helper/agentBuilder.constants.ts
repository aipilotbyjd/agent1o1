import { Bot, CalendarDays, FileText, Flame, PanelTop, Users } from 'lucide-react';
import type { TAgentTemplate } from '../_types/agentBuilder.type';

export const agentTemplateTabs = [
	'All',
	'Sales & Outreach',
	'Data & Analytics',
	'Support & Success',
	'Marketing & Content',
	'Productivity & Ops',
	'Research & Intelligence',
];

export const agentTemplates: TAgentTemplate[] = [
	{
		title: 'Recruiting Sourcer',
		copy: 'A recruiting agent. Give it a job description and it finds matching candidates, scores them against the role, and drafts outreach.',
		icons: [Flame, PanelTop],
		count: '+1',
		categories: ['All', 'Sales & Outreach', 'Productivity & Ops'],
		headerIcon: Users,
		headerIconColor: 'purple',
		badge: 'Popular',
		footerIcon: CalendarDays,
	},
	{
		title: 'Feedback Digest Agent',
		copy: 'A feedback summarizer. It reads through support tickets, groups feedback by theme, and prepares a product-ready brief.',
		icons: [Bot, FileText],
		count: '',
		categories: ['All', 'Support & Success', 'Data & Analytics'],
		headerIcon: Bot,
		headerIconColor: 'green',
		badge: 'New',
		footerIcon: FileText,
	},
	{
		title: 'Weekly Recap Agent',
		copy: 'A weekly recap agent. Every Friday it reviews tickets, meetings, and accomplishments, then writes a team update.',
		icons: [Users, CalendarDays],
		count: '+2',
		categories: ['All', 'Productivity & Ops'],
		headerIcon: CalendarDays,
		headerIconColor: 'purple',
		badge: 'Popular',
		footerIcon: CalendarDays,
	},
	{
		title: 'LinkedIn Outreach Expert',
		copy: 'Automates prospecting on LinkedIn. Identifies high-value targets matching your ICP, drafts custom connection requests, and schedules follow-up messages.',
		icons: [Users, Flame],
		count: '+3',
		categories: ['All', 'Sales & Outreach'],
	},
	{
		title: 'Metrics Analyst Bot',
		copy: 'Queries database tables, compiles visual performance dashboards, tracks monthly KPIs, and triggers alerts on anomaly detection.',
		icons: [FileText, PanelTop],
		count: '+1',
		categories: ['All', 'Data & Analytics', 'Research & Intelligence'],
	},
	{
		title: 'SEO Content Planner',
		copy: 'Researches high-traffic keywords, creates semantic content clusters, checks readability scores, and drafts SEO-optimized blog outlines.',
		icons: [FileText, Bot],
		count: '+4',
		categories: ['All', 'Marketing & Content', 'Research & Intelligence'],
	},
];
