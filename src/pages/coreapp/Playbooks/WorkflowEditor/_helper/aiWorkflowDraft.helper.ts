export type TAiWorkflowDraft = {
	name: string;
	defKeys: string[];
	summary: string;
};

const fallbackPrompt = 'AI generated workflow';

export const getAiWorkflowDraft = (prompt: string): TAiWorkflowDraft => {
	const trimmedPrompt = prompt.trim();
	const lower = trimmedPrompt.toLowerCase();

	if (lower.includes('slack') || lower.includes('notify')) {
		return {
			name: trimmedPrompt || 'Classify and notify',
			defKeys: ['input.ask', 'ai.chat', 'int.slack', 'output.display'],
			summary:
				'Capture context, use AI to prepare the message, notify Slack, then show output.',
		};
	}

	if (lower.includes('scrape') || lower.includes('website') || lower.includes('url')) {
		return {
			name: trimmedPrompt || 'Scrape and summarize',
			defKeys: ['input.ask', 'scrape.url', 'ai.chat', 'output.display'],
			summary:
				'Ask for a URL, scrape page content, summarize it with AI, then return output.',
		};
	}

	if (lower.includes('extract') || lower.includes('json') || lower.includes('schema')) {
		return {
			name: trimmedPrompt || 'Extract structured data',
			defKeys: ['input.ask', 'ai.extract', 'output.display'],
			summary:
				'Collect source text, extract structured JSON, then display the extracted data.',
		};
	}

	return {
		name: trimmedPrompt || fallbackPrompt,
		defKeys: ['input.ask', 'ai.chat', 'output.display'],
		summary: 'Collect an input, process it with AI, then return the generated response.',
	};
};
