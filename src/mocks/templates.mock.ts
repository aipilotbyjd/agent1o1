export const MOCK_AGENT_TEMPLATES = [
	{
		id: 'agt-uuid-1',
		name: 'Customer Support Agent',
		slug: 'customer-support-agent',
		description: 'Handles tier-1 customer support queries, answers FAQs, and opens tickets.',
		category: 'support',
		icon: 'chat-bubble-left-ellipsis',
		color: '#3B82F6',
		tags: ['support', 'bot', 'customer', 'faq'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect your FAQ database and ticketing system credentials.',
		is_featured: true,
		usage_count: 154,
		system_prompt:
			'You are a helpful customer support assistant. Answer queries politely, resolve FAQs, and open tickets when necessary.',
		llm_settings: {
			temperature: 0.3,
			max_tokens: 1024,
			max_steps: 10,
			timeout_seconds: 120,
		},
		tool_configs: [
			{ type: 'function', name: 'search_faq', description: 'Search the FAQ database' },
			{
				type: 'function',
				name: 'create_support_ticket',
				description: 'Create a support ticket in Zendesk',
			},
		],
		example_conversations: [
			{
				user: 'How do I reset my password?',
				assistant:
					'You can reset your password by going to the Settings page and clicking on the "Reset Password" link, or by clicking "Forgot Password" on the login screen.',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-2',
		name: 'Refund Handler',
		slug: 'refund-handler',
		description:
			'Processes refund requests according to company policy, checks order details, and triggers Stripe refunds.',
		category: 'support',
		icon: 'receipt-refund',
		color: '#6366F1',
		tags: ['support', 'refund', 'stripe', 'billing'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect your Stripe credential and database access to lookup orders.',
		is_featured: false,
		usage_count: 42,
		system_prompt:
			'You are a Refund Handler assistant. Validate refund requests against company policy and process Stripe refunds.',
		llm_settings: {
			temperature: 0.2,
			max_tokens: 1024,
			max_steps: 8,
			timeout_seconds: 180,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'get_order_details',
				description: 'Retrieve order details from the database',
			},
			{
				type: 'function',
				name: 'process_stripe_refund',
				description: 'Trigger a refund in Stripe',
			},
		],
		example_conversations: [
			{
				user: 'I want a refund for order #12345.',
				assistant:
					'Let me check the details for order #12345 to see if it is eligible for a refund.',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-3',
		name: 'Lead Qualifier',
		slug: 'lead-qualifier',
		description:
			'Qualifies inbound leads using the BANT framework, scores them, and updates your CRM.',
		category: 'sales',
		icon: 'funnel',
		color: '#10B981',
		tags: ['sales', 'lead', 'crm', 'qualification'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect your CRM and calendar tools.',
		is_featured: true,
		usage_count: 87,
		system_prompt:
			'You are a sales development representative (SDR) responsible for qualifying inbound leads using the BANT framework.',
		llm_settings: {
			temperature: 0.4,
			max_tokens: 1024,
			max_steps: 12,
			timeout_seconds: 180,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'update_crm_lead',
				description: 'Update lead record in CRM with score and notes',
			},
			{
				type: 'function',
				name: 'schedule_call',
				description: 'Schedule a discovery call with the prospect',
			},
		],
		example_conversations: [
			{
				user: "Hi, I'm interested in your product.",
				assistant:
					"Great to hear from you! I'd love to learn more about what you're looking for. What challenge are you hoping to solve?",
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-4',
		name: 'Demo Scheduler',
		slug: 'demo-scheduler',
		description:
			'Schedules product demos for qualified leads by coordinating calendar availability.',
		category: 'sales',
		icon: 'calendar',
		color: '#F59E0B',
		tags: ['sales', 'calendar', 'scheduling', 'demo'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-haiku-4-5-20251001',
		instructions: 'Connect your Google Calendar or Outlook Calendar credential.',
		is_featured: false,
		usage_count: 29,
		system_prompt:
			'You are a Demo Scheduler agent. Check availability and book demo slots for leads.',
		llm_settings: {
			temperature: 0.1,
			max_tokens: 512,
			max_steps: 6,
			timeout_seconds: 90,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'list_available_slots',
				description: 'List open demo slots in Google Calendar',
			},
			{ type: 'function', name: 'book_slot', description: 'Book a demo slot for a lead' },
		],
		example_conversations: [
			{
				user: 'Can I book a demo for next Tuesday afternoon?',
				assistant:
					'I have openings on Tuesday at 2:00 PM and 4:00 PM UTC. Which works best for you?',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-5',
		name: 'Incident Commander',
		slug: 'incident-commander',
		description:
			'Coordinates incident response, pages on-call engineers, and writes incident summaries.',
		category: 'devops',
		icon: 'shield-exclamation',
		color: '#EF4444',
		tags: ['devops', 'incident', 'alert', 'pagerduty'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect PagerDuty and Slack credentials to coordinate alerts.',
		is_featured: true,
		usage_count: 95,
		system_prompt:
			'You are an Incident Commander. Act quickly to coordinate resolution, page the appropriate teams, and log details.',
		llm_settings: {
			temperature: 0.2,
			max_tokens: 2048,
			max_steps: 15,
			timeout_seconds: 300,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'page_on_call',
				description: 'Page the on-call engineer via PagerDuty',
			},
			{
				type: 'function',
				name: 'post_slack_update',
				description: 'Post an update to the incident Slack channel',
			},
		],
		example_conversations: [
			{
				user: 'Production is down with 500 errors!',
				assistant:
					'Acknowledged. Paging the on-call DevOps team and opening an incident Slack room now.',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-6',
		name: 'Deploy Assistant',
		slug: 'deploy-assistant',
		description:
			'Assists with software deployments, runs smoke tests, and triggers rollbacks if metrics spike.',
		category: 'devops',
		icon: 'rocket',
		color: '#8B5CF6',
		tags: ['devops', 'deploy', 'kubernetes', 'github-actions'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect your GitHub and monitoring tool credentials.',
		is_featured: false,
		usage_count: 38,
		system_prompt:
			'You are a Deploy Assistant. Monitor deploy health, verify metrics, and execute rollbacks if anomalies are found.',
		llm_settings: {
			temperature: 0.1,
			max_tokens: 1024,
			max_steps: 10,
			timeout_seconds: 240,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'trigger_github_action',
				description: 'Trigger a deployment workflow on GitHub',
			},
			{
				type: 'function',
				name: 'get_datadog_metrics',
				description: 'Fetch system error rates from Datadog',
			},
		],
		example_conversations: [
			{
				user: 'Deploy version v2.1.0 to staging.',
				assistant:
					'Starting the deployment of v2.1.0 to staging. I will monitor health metrics for the next 5 minutes.',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-7',
		name: 'SQL Assistant',
		slug: 'sql-assistant',
		description:
			'Translates natural language questions into safe, optimized SQL queries and explains the results.',
		category: 'data',
		icon: 'circle-stack',
		color: '#06B6D4',
		tags: ['data', 'sql', 'database', 'analytics'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect your database credentials (read-only recommended).',
		is_featured: true,
		usage_count: 112,
		system_prompt:
			'You are a SQL Assistant. Convert user queries into SQL and explain the logic clearly. Do not execute destructive queries.',
		llm_settings: {
			temperature: 0.1,
			max_tokens: 1500,
			max_steps: 5,
			timeout_seconds: 120,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'get_table_schema',
				description: 'Retrieve table schema details',
			},
			{
				type: 'function',
				name: 'run_read_only_query',
				description: 'Run a read-only SQL query on the database',
			},
		],
		example_conversations: [
			{
				user: 'Find the top 5 customers by revenue.',
				assistant:
					'Here is the SQL query to find the top 5 customers: `SELECT name, total_revenue FROM customers ORDER BY total_revenue DESC LIMIT 5`',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-8',
		name: 'Blog Writer',
		slug: 'blog-writer',
		description: 'Drafts SEO-optimized blog posts, suggests outlines, and edits copy for tone.',
		category: 'creative',
		icon: 'pencil-square',
		color: '#EC4899',
		tags: ['creative', 'writing', 'seo', 'blog'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-opus-4-8',
		instructions: 'No tools required. Configure target keywords and audience style.',
		is_featured: true,
		usage_count: 67,
		system_prompt:
			'You are a professional Blog Writer. Write engaging, SEO-friendly content according to guidelines.',
		llm_settings: {
			temperature: 0.7,
			max_tokens: 4096,
			max_steps: 5,
			timeout_seconds: 300,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'search_keywords',
				description: 'Search for trending keywords',
			},
		],
		example_conversations: [
			{
				user: 'Write a short intro about AI agents.',
				assistant:
					"Artificial Intelligence agents are transforming how we work by automating complex multi-step workflows. Here's a look at how they work...",
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'agt-uuid-9',
		name: 'Social Media Manager',
		slug: 'social-media-manager',
		description:
			'Creates social media copy, drafts threads, and schedules posts for Twitter and LinkedIn.',
		category: 'creative',
		icon: 'share',
		color: '#3B82F6',
		tags: ['creative', 'social-media', 'copywriting', 'buffer'],
		avatar_url: null,
		llm_provider: 'anthropic',
		llm_model: 'claude-sonnet-4-6',
		instructions: 'Connect Buffer or HootSuite to publish directly.',
		is_featured: false,
		usage_count: 45,
		system_prompt:
			'You are a Social Media Manager. Write engaging copy suited for specific platforms like Twitter or LinkedIn.',
		llm_settings: {
			temperature: 0.6,
			max_tokens: 1024,
			max_steps: 8,
			timeout_seconds: 120,
		},
		tool_configs: [
			{
				type: 'function',
				name: 'schedule_social_post',
				description: 'Schedule a post on Buffer',
			},
		],
		example_conversations: [
			{
				user: 'Create a tweet about our new templates release.',
				assistant:
					'🚀 Unleash the power of automation! We just launched our brand new Templates System. Browse pre-built workflows and deploy agents in seconds. Learn more at agent1o1.com/templates',
			},
		],
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
];

export const MOCK_TEMPLATE_COLLECTIONS = [
	{
		id: 'col-uuid-1',
		name: 'Customer Success Starter Kit',
		slug: 'customer-success-starter-kit',
		description:
			'Everything you need to handle support and onboarding. Includes support automation agents and welcoming workflows.',
		icon: 'chat-bubble-bottom-center-text',
		color: '#3B82F6',
		thumbnail_url: null,
		items: [
			{
				type: 'agent',
				template_id: 'agt-uuid-1',
				note: 'Customer Support Agent handles general support tickets and FAQs',
			},
			{
				type: 'agent',
				template_id: 'agt-uuid-2',
				note: 'Refund Handler checks order status and processes refunds via Stripe',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9ec-7613-888a-2c8c4be9ccba',
				note: 'Slack Notification on Webhook sends alerts when customers contact support',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da0b-719e-8683-7d50db96925f',
				note: 'New User Welcome Email triggers immediately on user registration',
			},
		],
		item_count: 4,
		is_featured: true,
		usage_count: 42,
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'col-uuid-2',
		name: 'DevOps Starter Kit',
		slug: 'devops-starter-kit',
		description:
			'A complete DevOps automation bundle: incident management, deployment workflows, and uptime monitoring.',
		icon: 'server-stack',
		color: '#DC2626',
		thumbnail_url: null,
		items: [
			{
				type: 'agent',
				template_id: 'agt-uuid-5',
				note: 'Incident Commander coordinates response and pages on-call teams',
			},
			{
				type: 'agent',
				template_id: 'agt-uuid-6',
				note: 'Deploy Assistant manages deployments and monitors error metrics',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9f2-7217-8f06-d0b89100fcc4',
				note: 'CI/CD Deployment Notifier broadcasts status logs',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da06-7290-91db-59c75c674d1b',
				note: 'Uptime Monitor Alert pings endpoints and notifies slack on outage',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da02-7351-b4e1-6e3bf94241e9',
				note: 'Database Backup Reminder flags missed nightly backups',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da0d-707b-b875-6560efcc6f19',
				note: 'Multi-Channel Error Alert broadcasts critical logs to Slack & Email',
			},
		],
		item_count: 6,
		is_featured: true,
		usage_count: 34,
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'col-uuid-3',
		name: 'Content Machine',
		slug: 'content-machine',
		description:
			'Create high-converting copy and scale marketing efforts with AI-driven blog and social media generation.',
		icon: 'document-text',
		color: '#EC4899',
		thumbnail_url: null,
		items: [
			{
				type: 'agent',
				template_id: 'agt-uuid-8',
				note: 'Blog Writer drafts longform SEO posts',
			},
			{
				type: 'agent',
				template_id: 'agt-uuid-9',
				note: 'Social Media Manager writes platforms-specific announcements',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9f5-7151-80fc-32028141f41e',
				note: 'GitHub Issue to Slack posts issue logs to copywriters channel',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9fb-71e8-acc2-9978caf7f630',
				note: 'Weekly Digest Email sends scheduled summaries of published content',
			},
		],
		item_count: 4,
		is_featured: true,
		usage_count: 28,
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'col-uuid-4',
		name: 'Sales Acceleration Bundle',
		slug: 'sales-acceleration-bundle',
		description:
			'Close deals faster by qualifying leads automatically, enriching customer profiles, and syncing payments.',
		icon: 'currency-dollar',
		color: '#10B981',
		thumbnail_url: null,
		items: [
			{
				type: 'agent',
				template_id: 'agt-uuid-3',
				note: 'Lead Qualifier qualifies inbound prospects',
			},
			{
				type: 'agent',
				template_id: 'agt-uuid-4',
				note: 'Demo Scheduler books qualified prospects directly into the sales calendar',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9fe-73f1-b9f1-d9fa7fe1d1b5',
				note: 'Stripe Payment to CRM maps transactions to customer profiles',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da04-73a8-ab02-cbf89a8e6c16',
				note: 'Lead Enrichment Pipeline parses social data for inbound emails',
			},
		],
		item_count: 4,
		is_featured: false,
		usage_count: 19,
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
	{
		id: 'col-uuid-5',
		name: 'Data & Analytics Stack',
		slug: 'data-analytics-stack',
		description:
			'Ingest raw form submissions, sync files on a schedule, and answer insights questions with natural SQL translation.',
		icon: 'chart-bar',
		color: '#06B6D4',
		thumbnail_url: null,
		items: [
			{
				type: 'agent',
				template_id: 'agt-uuid-7',
				note: 'SQL Assistant generates read-only database insights',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9f8-718f-92be-f69b2d15849b',
				note: 'Form Submission to Google Sheets records inbound data',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-da08-70c4-96d4-bb2fb53c10f5',
				note: 'CSV to Database Import bulk inserts parsed files',
			},
			{
				type: 'workflow',
				template_id: '019e8eee-d9ee-7149-abab-bffcba0aa713',
				note: 'Scheduled Data Sync moves records every night',
			},
		],
		item_count: 4,
		is_featured: false,
		usage_count: 12,
		created_at: '2026-06-06T00:00:00.000000Z',
		updated_at: '2026-06-06T00:00:00.000000Z',
	},
];
