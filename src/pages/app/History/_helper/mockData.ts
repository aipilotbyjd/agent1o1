import { Bot, MessageSquare, Sparkles, Workflow } from 'lucide-react';
import type { IHistoryItem } from '../_types/history.types';

export const mockHistoryData: IHistoryItem[] = [
	{
		id: 'chat-1',
		title: 'Skill Creation',
		type: 'Chat',
		timestamp: 'May 13, 2026 • 9:00 PM',
		credits: 27,
		status: 'Complete',
		icon: Bot,
		chatTranscript: [
			{
				sender: 'user',
				text: 'Create a skill that pulls data from Slack and puts it in a Google Sheet.',
			},
			{
				sender: 'agent',
				text: "Sure! Let's build a slack-sheets integration workflow. Analyzing Slack APIs...",
			},
			{
				sender: 'agent',
				text: 'Added node `slack.listen_channels` and `google.append_rows`. Testing connection... Success!',
			},
		],
	},
	{
		id: 'chat-2',
		title: 'Skill Creator Planning',
		type: 'Chat',
		timestamp: 'May 13, 2026 • 11:14 AM',
		credits: 27,
		status: 'Complete',
		icon: Sparkles,
		chatTranscript: [
			{ sender: 'user', text: 'Summarize the design documents for the new agent workspace.' },
			{
				sender: 'agent',
				text: 'Reading files under `/workspace/docs/`... Found 3 markdown files.',
			},
			{
				sender: 'agent',
				text: 'Summary completed: Workspace uses glassmorphism and organic glows. Added steps: 1. Workspace setup, 2. Add pre-configured modules.',
			},
		],
	},
	{
		id: 'chat-3',
		title: 'Skill Creation',
		type: 'Chat',
		timestamp: 'May 13, 2026 • 10:53 AM',
		credits: 27,
		status: 'Complete',
		icon: MessageSquare,
		chatTranscript: [
			{ sender: 'user', text: 'Can you help me setup a classifier for support tickets?' },
			{
				sender: 'agent',
				text: "Sure! Let's configure a LLM bug classifier. Setting up classification prompt...",
			},
			{ sender: 'agent', text: 'Created Bug Classifier skill successfully.' },
		],
	},
	{
		id: 'run-1',
		title: 'Spreadsheet Analyst Setup',
		type: 'Workflow run',
		timestamp: 'May 9, 2026 • 10:09 PM',
		credits: 148,
		status: 'Complete',
		icon: Workflow,
		chatTranscript: [
			{ sender: 'user', text: 'Analyze our sales spreadsheet and build a summary report.' },
			{ sender: 'agent', text: 'Opening `Sales_Q1_2026.xlsx`... Reading 250 rows.' },
			{
				sender: 'agent',
				text: 'Generated Q1 Sales report. Success rate: 98.7%. Saved output as `Q1_Summary.pdf`.',
			},
		],
	},
	{
		id: 'chat-4',
		title: 'Lead Enrichment Pipeline',
		type: 'Workflow run',
		timestamp: 'May 8, 2026 • 2:15 PM',
		credits: 85,
		status: 'Complete',
		icon: Workflow,
		chatTranscript: [
			{ sender: 'user', text: 'Run the lead enrichment flow for new signups.' },
			{ sender: 'agent', text: 'Processing 45 new email leads. Enriching via Apollo API...' },
			{
				sender: 'agent',
				text: 'Completed enrichment. 42 profiles updated, 3 flagged. Logged report to Salesforce.',
			},
		],
	},
	{
		id: 'chat-5',
		title: 'GitHub Issues Classifier',
		type: 'Chat',
		timestamp: 'May 7, 2026 • 4:30 PM',
		credits: 12,
		status: 'Reviewed',
		icon: Bot,
		chatTranscript: [
			{ sender: 'user', text: 'Label recent repository issues.' },
			{ sender: 'agent', text: 'Fetching open issues from repository... Found 8 issues.' },
			{
				sender: 'agent',
				text: 'Labeled 5 as bugs, 2 as enhancements, and 1 as question. Sent Slack notification.',
			},
		],
	},
	{
		id: 'run-2',
		title: 'Database Backup Sync',
		type: 'Workflow run',
		timestamp: 'May 5, 2026 • 1:05 AM',
		credits: 220,
		status: 'Complete',
		icon: Workflow,
		chatTranscript: [
			{ sender: 'user', text: 'Backup production database to AWS S3.' },
			{
				sender: 'agent',
				text: 'Connecting to database instance... Creating snapshot backup.',
			},
			{
				sender: 'agent',
				text: 'Syncing snapshot to S3 bucket `agent1o1-db-backups`... Upload successful (1.2 GB).',
			},
		],
	},
	{
		id: 'chat-6',
		title: 'Email Campaign Sender',
		type: 'Chat',
		timestamp: 'May 3, 2026 • 6:12 PM',
		credits: 18,
		status: 'Failed',
		icon: MessageSquare,
		chatTranscript: [
			{ sender: 'user', text: 'Dispatch the weekly newsletters.' },
			{ sender: 'agent', text: 'Compiling subscriber list... Found 1,200 contacts.' },
			{
				sender: 'agent',
				text: 'Failed to send newsletters: Mailgun API rate limit exceeded. Retrying scheduled at midnight.',
			},
		],
	},
];
