import type { TNodeDefinition } from '../_types/node.type';

export const NODE_CATALOG: TNodeDefinition[] = [
	{
		key: 'trigger.google_drive',
		category: 'trigger',
		label: 'Google Drive Folder Reader',
		description:
			'Read the content from a Google Drive folder and outputs a list of files, for Google Docs/Sheets/Slides, the output is the URL instead',
		icon: 'GD',
		color: 'blue',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'files', name: 'files', type: 'list' }],
		fields: [
			{
				key: 'folder',
				label: 'Folder',
				kind: 'picker',
				pickerLabel: 'Pick Folder',
				help: 'The Google Drive folder ID to read from.',
			},
			{
				key: 'use_link',
				label: 'Use Link?',
				kind: 'toggle',
				default: false,
				advanced: true,
			},
		],
		requiresCredential: true,
		supportsLoopMode: true,
	},
	{
		key: 'trigger.google_form_responses',
		category: 'trigger',
		label: 'Google Form Responses Reader',
		description: 'Read responses from a Google Form.',
		icon: 'GF',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [
			{
				key: 'form',
				label: 'Form',
				kind: 'text',
				help: 'Pick a Google Form to read responses from.',
			},
			{
				key: 'use_link',
				label: 'Use Link?',
				kind: 'toggle',
				default: false,
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.hubspot_list',
		category: 'trigger',
		label: 'HubSpot List Reader',
		description:
			'Load data from HubSpot lists. Supports lists of Contacts, Companies, Deals, Tickets, Orders, or Carts. Outputs can include various properties depending on the object type.',
		icon: 'HL',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [
			{
				key: 'object_type',
				label: 'Object Type',
				kind: 'select',
				placeholder: 'Select an option',
				options: [
					{ label: 'Contacts', value: 'contacts' },
					{ label: 'Companies', value: 'companies' },
				],
			},
			{
				key: 'limit',
				label: 'Number of Objects',
				kind: 'text',
				default: '10 (Leave empty to read all objects)',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.airtable_reader',
		category: 'trigger',
		label: 'Airtable Reader',
		description:
			'Read data from an Airtable base. Note: If activating as trigger, Timestamp column must be selected.',
		icon: 'AR',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [
			{
				key: 'base',
				label: 'Base',
				kind: 'select',
				placeholder: 'Select an option',
				options: [],
			},
		],
	},
	{
		key: 'trigger.zendesk_ticket',
		category: 'trigger',
		label: 'Zendesk Ticket Reader',
		description:
			'Load in Ticket data from Zendesk. Outputs can include Ticket type, priority, status, subject, and other metadata.',
		icon: 'ZT',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.linear_issue',
		category: 'trigger',
		label: 'Linear Issue Reader',
		description: 'Read issues from your Linear workspace based on various filters.',
		icon: 'LI',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.jira_issue',
		category: 'trigger',
		label: 'Jira Issue Reader',
		description: 'Read issues from your Jira projects based on various filters.',
		icon: 'JI',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.typeform_submission',
		category: 'trigger',
		label: 'Typeform Submission Reader',
		description: 'Read the responses of a Typeform form.',
		icon: 'TF',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.incident_io',
		category: 'trigger',
		label: 'Incident.io Incidents Reader',
		description:
			'Read and monitor incidents from incident.io. Supports filtering by status, severity, and mode.',
		icon: 'II',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.parallel_web_monitor',
		category: 'trigger',
		label: 'Parallel Web Monitor',
		description:
			'Monitor the web for material changes relevant to a query. This node is designed to be used as a trigger.',
		icon: 'PW',
		color: 'purple',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [],
		requiresCredential: true,
	},
	{
		key: 'trigger.google_sheets',
		category: 'trigger',
		label: 'Google Sheets Reader',
		description:
			'Read the content from a Google Sheets file and outputs a list of the data in each column. Note: Your Google Sheet must have column headers.',
		icon: 'GS',
		color: 'green',
		inputs: [],
		outputs: [{ id: 'rows', name: 'rows', type: 'list' }],
		fields: [
			{
				key: 'spreadsheet_id',
				label: 'Link',
				kind: 'text',
				placeholder: 'https://docs.google.com/spreadsheets/d/...',
				help: 'Enter the full Google Sheets link.',
			},
			{
				key: 'use_link',
				label: 'Use Link?',
				kind: 'toggle',
				default: true,
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.google_calendar',
		category: 'trigger',
		label: 'Google Calendar Event Reader',
		description: 'Read Google Calendar events by choosing a time frame.',
		icon: 'GC',
		color: 'blue',
		inputs: [],
		outputs: [{ id: 'events', name: 'events', type: 'list' }],
		fields: [
			{
				key: 'calendar_id',
				label: 'Calendar ID',
				kind: 'text',
				default: 'primary',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.gmail',
		category: 'trigger',
		label: 'Gmail Reader',
		description:
			'Read all unread emails from your Gmail folder (standard inbox is the default).',
		icon: 'GM',
		color: 'red',
		inputs: [],
		outputs: [{ id: 'emails', name: 'emails', type: 'list' }],
		fields: [
			{
				key: 'folder',
				label: 'Folder',
				kind: 'text',
				default: 'INBOX',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.slack_message',
		category: 'trigger',
		label: 'Slack Message Reader',
		description: 'Read the last n Slack messages from a specified channel.',
		icon: 'SL',
		color: 'purple',
		inputs: [],
		outputs: [{ id: 'messages', name: 'messages', type: 'list' }],
		fields: [
			{
				key: 'channel',
				label: 'Channel',
				kind: 'text',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.teams_message',
		category: 'trigger',
		label: 'Teams Message Reader',
		description: 'Read the last n Teams messages from a specified channel.',
		icon: 'TM',
		color: 'indigo',
		inputs: [],
		outputs: [{ id: 'messages', name: 'messages', type: 'list' }],
		fields: [
			{
				key: 'channel',
				label: 'Channel',
				kind: 'text',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'trigger.time',
		category: 'trigger',
		label: 'Create a Time Trigger',
		description: 'Schedule your flow to run at specified times.',
		icon: 'TM',
		color: 'pink',
		inputs: [],
		outputs: [{ id: 'time', name: 'trigger_time', type: 'string' }],
		fields: [
			{
				key: 'cron',
				label: 'Cron Expression',
				kind: 'text',
				default: '0 9 * * *',
			},
		],
	},
	{
		key: 'trigger.webhook',
		category: 'trigger',
		label: 'Webhook Trigger',
		description: 'Start the workflow from a signed inbound webhook.',
		icon: 'WH',
		color: 'emerald',
		inputs: [],
		outputs: [{ id: 'payload', name: 'payload', type: 'json' }],
		fields: [
			{
				key: 'method',
				label: 'Method',
				kind: 'select',
				default: 'POST',
				options: ['POST', 'PUT', 'PATCH'].map((method) => ({
					label: method,
					value: method,
				})),
				help: 'HTTP method accepted by this trigger.',
			},
			{
				key: 'path',
				label: 'Path',
				kind: 'text',
				default: '/lead-intake',
				help: 'Public webhook path generated for this workflow.',
			},
		],
	},
	{
		key: 'input.ask',
		category: 'input',
		label: 'Ask Input',
		description: 'Prompt for text when the workflow runs.',
		icon: 'Q',
		color: 'sky',
		inputs: [],
		outputs: [{ id: 'value', name: 'value', type: 'string' }],
		fields: [
			{
				key: 'label',
				label: 'Question',
				kind: 'text',
				default: 'What should we process?',
				help: 'The text prompt shown to users when the workflow runs.',
			},
			{
				key: 'required',
				label: 'Required',
				kind: 'toggle',
				default: true,
				help: 'Whether the user must provide a value before continuing.',
			},
		],
	},
	{
		key: 'input.file',
		category: 'input',
		label: 'File Input',
		description: 'Accept a CSV, PDF, image, or other file.',
		icon: 'F',
		color: 'sky',
		inputs: [],
		outputs: [{ id: 'file', name: 'file', type: 'file' }],
		fields: [
			{
				key: 'accept',
				label: 'Accepted types',
				kind: 'text',
				default: '.pdf,.csv,image/*',
				help: 'File extensions or MIME types (e.g., .pdf,.csv,image/*).',
			},
		],
	},
	{
		key: 'ai.agent',
		category: 'ai',
		label: 'AI Agent',
		description: 'Plan, call tools, and return a structured decision.',
		icon: 'AI',
		color: 'violet',
		inputs: [{ id: 'context', name: 'context', type: 'any' }],
		outputs: [
			{ id: 'decision', name: 'decision', type: 'json' },
			{ id: 'trace', name: 'trace', type: 'string' },
		],
		fields: [
			{
				key: 'goal',
				label: 'Agent goal',
				kind: 'longtext',
				rows: 5,
				required: true,
				supportsVariables: true,
				default:
					'Classify the incoming request, enrich the context, and choose the next action.',
				help: 'Describe the job the agent should complete.',
			},
			{
				key: 'model',
				label: 'Model',
				kind: 'model',
				default: 'gpt-5-mini',
				help: 'Model used for planning and tool calls.',
				options: [
					{ label: 'GPT-5 mini', value: 'gpt-5-mini' },
					{ label: 'GPT-5', value: 'gpt-5' },
					{ label: 'Claude Sonnet', value: 'claude-sonnet' },
				],
			},
		],
	},
	{
		key: 'ai.chat',
		category: 'ai',
		label: 'Ask AI',
		description: 'Run a single LLM prompt over the incoming context.',
		icon: 'AI',
		color: 'violet',
		inputs: [{ id: 'in', name: 'context', type: 'any' }],
		outputs: [{ id: 'out', name: 'response', type: 'string' }],
		fields: [
			{
				key: 'model',
				label: 'Model',
				kind: 'model',
				default: 'gpt-4o-mini',
				help: 'Select the AI model to use for this request.',
				options: [
					{ label: 'GPT-4o mini', value: 'gpt-4o-mini' },
					{ label: 'GPT-4o', value: 'gpt-4o' },
					{ label: 'Claude Sonnet', value: 'claude-sonnet' },
					{ label: 'Gemini Pro', value: 'gemini-pro' },
				],
			},
			{
				key: 'prompt',
				label: 'Prompt',
				kind: 'longtext',
				rows: 6,
				required: true,
				supportsVariables: true,
				help: 'Write your prompt here. Use {{variable}} syntax to inject values from previous nodes.',
				placeholder: 'Use {{Ask Input.value}} and return a concise answer.',
			},
			{
				key: 'temperature',
				label: 'Temperature',
				kind: 'number',
				default: 0.4,
				help: 'Controls randomness: lower = more deterministic, higher = more creative.',
			},
		],
	},
	{
		key: 'ai.extract',
		category: 'extract',
		label: 'Extract Data',
		description: 'Extract structured JSON using a schema.',
		icon: '{}',
		color: 'fuchsia',
		inputs: [{ id: 'text', name: 'text', type: 'string' }],
		outputs: [{ id: 'data', name: 'data', type: 'json' }],
		fields: [
			{
				key: 'schema',
				label: 'Schema',
				kind: 'code',
				rows: 7,
				required: true,
				help: 'JSON schema describing the structure to extract (e.g., {"name": "string", "value": "number"}).',
			},
			{
				key: 'model',
				label: 'Model',
				kind: 'model',
				default: 'gpt-4o-mini',
				help: 'AI model for extracting structured data.',
			},
		],
	},
	{
		key: 'scrape.url',
		category: 'scrape',
		label: 'Website Scraper',
		description: 'Fetch a page and return clean markdown.',
		icon: 'W',
		color: 'emerald',
		inputs: [{ id: 'url', name: 'url', type: 'string' }],
		outputs: [{ id: 'content', name: 'content', type: 'string' }],
		fields: [
			{
				key: 'url',
				label: 'URL',
				kind: 'text',
				required: true,
				supportsVariables: true,
				help: 'Enter the full URL to scrape. Variables like {{Ask Input.value}} are supported.',
			},
			{
				key: 'waitFor',
				label: 'Wait for selector',
				kind: 'text',
				help: 'Optional CSS selector to wait for before extracting content.',
			},
		],
	},
	{
		key: 'data.database',
		category: 'storage',
		label: 'Database',
		description: 'Read, insert, or upsert records in a connected data store.',
		icon: 'DB',
		color: 'cyan',
		inputs: [{ id: 'record', name: 'record', type: 'json' }],
		outputs: [{ id: 'result', name: 'result', type: 'json' }],
		fields: [
			{
				key: 'operation',
				label: 'Operation',
				kind: 'select',
				default: 'upsert',
				options: ['select', 'insert', 'upsert', 'delete'].map((operation) => ({
					label: operation,
					value: operation,
				})),
				help: 'Database action to perform.',
			},
			{
				key: 'table',
				label: 'Table',
				kind: 'text',
				default: 'qualified_leads',
				help: 'Target table or collection.',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'data.http',
		category: 'data',
		label: 'HTTP Request',
		description: 'Call a REST endpoint and return JSON.',
		icon: 'API',
		color: 'amber',
		inputs: [{ id: 'body', name: 'body', type: 'any' }],
		outputs: [{ id: 'response', name: 'response', type: 'json' }],
		fields: [
			{
				key: 'method',
				label: 'Method',
				kind: 'select',
				default: 'GET',
				help: 'HTTP method for the request.',
				options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => ({
					label: method,
					value: method,
				})),
			},
			{
				key: 'url',
				label: 'URL',
				kind: 'text',
				required: true,
				supportsVariables: true,
				help: 'Request URL. Variables like {{Ask Input.value}} are supported.',
			},
			{
				key: 'headers',
				label: 'Headers',
				kind: 'kv',
				help: 'Key-value pairs for request headers.',
			},
			{
				key: 'body',
				label: 'Body',
				kind: 'code',
				rows: 5,
				help: 'Request body as JSON. Use for POST/PUT requests.',
			},
		],
	},
	{
		key: 'logic.condition',
		category: 'logic',
		label: 'Condition',
		description: 'Route data into true or false branches.',
		icon: 'IF',
		color: 'rose',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [
			{ id: 'true', name: 'true', type: 'any' },
			{ id: 'false', name: 'false', type: 'any' },
		],
		fields: [
			{
				key: 'expression',
				label: 'Expression',
				kind: 'text',
				default: 'lead.score >= 80',
				required: true,
				help: 'Expression evaluated against the incoming payload.',
			},
		],
	},
	{
		key: 'logic.if',
		category: 'logic',
		label: 'If / Else',
		description: 'Branch based on a boolean expression.',
		icon: 'IF',
		color: 'rose',
		inputs: [{ id: 'in', name: 'value', type: 'any' }],
		outputs: [
			{ id: 'true', name: 'true', type: 'any' },
			{ id: 'false', name: 'false', type: 'any' },
		],
		fields: [
			{
				key: 'expression',
				label: 'Condition',
				kind: 'text',
				required: true,
				help: 'JavaScript expression to evaluate (e.g., value > 10).',
			},
		],
	},
	{
		key: 'utility.delay',
		category: 'utility',
		label: 'Delay',
		description: 'Pause execution for a fixed or dynamic duration.',
		icon: 'DE',
		color: 'amber',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [
			{
				key: 'duration',
				label: 'Duration',
				kind: 'number',
				default: 5,
				help: 'Delay duration before continuing.',
			},
			{
				key: 'unit',
				label: 'Unit',
				kind: 'select',
				default: 'minutes',
				options: ['seconds', 'minutes', 'hours', 'days'].map((unit) => ({
					label: unit,
					value: unit,
				})),
				help: 'Time unit for the delay.',
			},
		],
	},
	{
		key: 'utility.code',
		category: 'utility',
		label: 'Code',
		description: 'Run custom JavaScript to transform incoming data.',
		icon: '{}',
		color: 'zinc',
		inputs: [{ id: 'in', name: 'input', type: 'any' }],
		outputs: [{ id: 'out', name: 'output', type: 'any' }],
		fields: [
			{
				key: 'code',
				label: 'JavaScript',
				kind: 'code',
				rows: 8,
				default: '// `input` = upstream output, `items` = all inputs\nreturn input;',
				help: 'Write JS that returns the node output. `input`, `items` and `$json` are available.',
			},
		],
	},
	{
		key: 'loop.each',
		category: 'loop',
		label: 'Loop List',
		description: 'Iterate over every item in a list.',
		icon: 'LO',
		color: 'indigo',
		inputs: [{ id: 'items', name: 'items', type: 'list' }],
		outputs: [{ id: 'item', name: 'item', type: 'any' }],
		fields: [
			{
				key: 'concurrency',
				label: 'Concurrency',
				kind: 'number',
				default: 5,
				help: 'Number of items to process simultaneously.',
			},
		],
		supportsLoopMode: true,
	},
	{
		key: 'int.slack',
		category: 'integration',
		label: 'Send Slack',
		description: 'Send a message to a Slack channel.',
		icon: 'SL',
		color: 'cyan',
		inputs: [{ id: 'message', name: 'message', type: 'string' }],
		outputs: [{ id: 'sent', name: 'sent', type: 'boolean' }],
		fields: [
			{
				key: 'credential_id',
				label: 'Credential',
				kind: 'credential',
				credentialType: 'slack',
				required: true,
				help: 'Select a connected Slack credential for authentication.',
			},
			{
				key: 'channel',
				label: 'Channel',
				kind: 'text',
				required: true,
				help: 'Slack channel name (e.g., #general or @username for DMs).',
			},
			{
				key: 'message',
				label: 'Message',
				kind: 'longtext',
				supportsVariables: true,
				help: 'Message content. Supports markdown and {{variable}} syntax.',
			},
		],
		requiresCredential: true,
	},
	{
		key: 'output.display',
		category: 'output',
		label: 'Output',
		description: 'Return a final workflow result.',
		icon: 'OUT',
		color: 'green',
		inputs: [{ id: 'value', name: 'value', type: 'any' }],
		outputs: [],
		fields: [
			{
				key: 'name',
				label: 'Output name',
				kind: 'text',
				default: 'result',
				help: 'Programmatic name for this output in your workflow.',
			},
			{
				key: 'type',
				label: 'Type',
				kind: 'select',
				default: 'any',
				help: 'Data type for the output value.',
				options: [
					{ label: 'Text', value: 'string' },
					{ label: 'List', value: 'list' },
					{ label: 'JSON', value: 'json' },
					{ label: 'Any', value: 'any' },
				],
			},
		],
	},
	{
		key: 'note.sticky',
		category: 'note',
		label: 'Sticky Note',
		description: 'Document assumptions and instructions on the canvas.',
		icon: 'N',
		color: 'zinc',
		inputs: [],
		outputs: [],
		fields: [
			{
				key: 'content',
				label: 'Note',
				kind: 'longtext',
				rows: 5,
				help: 'Add documentation directly on your workflow canvas.',
			},
		],
	},
];

export const NODE_CATALOG_MAP = Object.fromEntries(
	NODE_CATALOG.map((node) => [node.key, node]),
) as Record<string, TNodeDefinition>;

export const getNodeDefinition = (
	defKey: string,
	runtimeDefinition?: TNodeDefinition,
): TNodeDefinition | undefined => {
	const rawDef = runtimeDefinition ?? NODE_CATALOG_MAP[defKey];
	if (!rawDef) return undefined;

	if (rawDef.requiresCredential) {
		const hasCredentialField = rawDef.fields.some(
			(f) => f.kind === 'credential' || f.key === 'credential_id',
		);
		if (!hasCredentialField) {
			let credentialType = 'google';
			const key = defKey.toLowerCase();
			if (key.includes('slack')) credentialType = 'slack';
			else if (key.includes('google_drive') || key.includes('google-drive'))
				credentialType = 'google_drive';
			else if (key.includes('google_sheets') || key.includes('google-sheets'))
				credentialType = 'google_sheets';
			else if (key.includes('google_calendar') || key.includes('google-calendar'))
				credentialType = 'google_calendar';
			else if (key.includes('gmail')) credentialType = 'gmail';
			else if (key.includes('hubspot')) credentialType = 'hubspot';
			else if (key.includes('zendesk')) credentialType = 'zendesk';
			else if (key.includes('linear')) credentialType = 'linear';
			else if (key.includes('jira')) credentialType = 'jira';
			else if (key.includes('typeform')) credentialType = 'typeform';
			else if (key.includes('incident_io') || key.includes('incidentio'))
				credentialType = 'incident_io';
			else if (key.includes('teams')) credentialType = 'microsoft_teams';

			return {
				...rawDef,
				fields: [
					{
						key: 'credential_id',
						label: 'Credential',
						kind: 'credential' as const,
						credentialType,
						required: true,
						help: `Select a connected ${credentialType} credential.`,
					},
					...rawDef.fields,
				],
			};
		}
	}

	return rawDef;
};
