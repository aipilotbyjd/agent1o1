import { Bot, CalendarDays, FileText, Flame, PanelTop, Users, Zap, Star } from 'lucide-react';
import type { TAgentTemplate } from '../_types/agentBuilder.type';

/**
 * Models available to agents, cheapest/fastest first.
 *
 * Most entries route through the 'anyapi' provider (App\Ai\AnyApiProvider),
 * with model ids vendor-prefixed OpenRouter-style ('openai/…', 'anthropic/…',
 * 'google/…'), per config('ai.providers.anyapi.models').
 *
 * DeepSeek entries route through 'digitalocean' (DigitalOcean Model Access
 * Keys / Gradient AI Platform inference) instead — ids match DigitalOcean's
 * model catalog exactly. Requires a configured DigitalOcean model access key
 * on the backend.
 */
export const agentModelOptions: {
	id: string;
	provider: 'anyapi' | 'digitalocean';
	label: string;
	tier: string;
	description: string;
}[] = [
	{
		id: 'openai/gpt-4o-mini',
		provider: 'anyapi',
		label: 'GPT-4o Mini',
		tier: 'Very cheap',
		description: "OpenAI's lowest-cost model. Best for simple, high-volume tasks where cost matters most.",
	},
	{
		id: 'google/gemini-2.0-flash-lite',
		provider: 'anyapi',
		label: 'Gemini 2.0 Flash Lite',
		tier: 'Very cheap',
		description: "Google's lowest-cost model. Good for simple, high-volume tasks.",
	},
	{
		id: 'deepseek/deepseek-chat',
		provider: 'anyapi',
		label: 'DeepSeek Chat',
		tier: 'Very cheap',
		description: 'DeepSeek-V3. Extremely low cost per token, strong for coding and reasoning tasks.',
	},
	{
		id: 'deepseek-3.2',
		provider: 'digitalocean',
		label: 'DeepSeek 3.2',
		tier: 'Very cheap',
		description: 'DeepSeek 3.2 via DigitalOcean Model Access Keys. Low cost, strong general-purpose reasoning.',
	},
	{
		id: 'deepseek-r1-distill-llama-70b',
		provider: 'digitalocean',
		label: 'DeepSeek R1 Distill Llama 70B',
		tier: 'Cheap',
		description:
			'DeepSeek R1 reasoning distilled onto Llama 70B via DigitalOcean. Good balance of reasoning quality and cost.',
	},
	{
		id: 'deepseek-4-flash',
		provider: 'digitalocean',
		label: 'DeepSeek V4 Flash',
		tier: 'Fast & cheap',
		description: 'DeepSeek V4 Flash via DigitalOcean Model Access Keys. Optimized for low-latency responses.',
	},
	{
		id: 'deepseek-v4-pro',
		provider: 'digitalocean',
		label: 'DeepSeek V4 Pro',
		tier: 'Most capable',
		description: 'DeepSeek V4 Pro via DigitalOcean Model Access Keys. Highest-capability DeepSeek model.',
	},
	{
		id: 'moonshotai/kimi-k2',
		provider: 'anyapi',
		label: 'Kimi K2',
		tier: 'Cheap',
		description: "Moonshot AI's Kimi K2. Large context window at a low cost.",
	},
	{
		id: 'anthropic/claude-haiku-4-5-20251001',
		provider: 'anyapi',
		label: 'Haiku 4.5',
		tier: 'Fast & cheap',
		description: 'Best for high-volume, simple tasks. Lowest-cost Claude model.',
	},
	{
		id: 'anthropic/claude-sonnet-5',
		provider: 'anyapi',
		label: 'Sonnet 5',
		tier: 'Balanced',
		description: 'Strong all-round reasoning at a moderate cost. Good default.',
	},
	{
		id: 'anthropic/claude-opus-4-8',
		provider: 'anyapi',
		label: 'Opus 4.8',
		tier: 'Most capable',
		description: 'Best for complex, high-stakes tasks. Highest cost per message.',
	},
];

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
