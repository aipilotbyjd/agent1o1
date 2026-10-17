/** How many items a step returned: a list's length, one for any other value. */
export const countItems = (value: unknown) =>
	Array.isArray(value) ? value.length : value === undefined || value === null ? 0 : 1;

export const formatDuration = (ms: number) =>
	ms < 1 ? '<1ms' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);

const firstMessage = (body: unknown): string | undefined => {
	if (typeof body === 'string') return body.trim().slice(0, 300) || undefined;
	if (!isRecord(body)) return undefined;
	for (const key of ['message', 'error', 'error_description', 'detail', 'title', 'errors']) {
		const value = body[key];
		const found = Array.isArray(value) ? firstMessage(value[0]) : firstMessage(value);
		if (found) return found;
	}
	return undefined;
};

/**
 * A step that completed but returned an HTTP error response (`{status, headers, body}`
 * with a 4xx/5xx status). The engine counts the request as done; the call still failed.
 */
export const getHttpFailure = (output: unknown): { status: number; message?: string } | null => {
	if (!isRecord(output) || !('headers' in output || 'body' in output)) return null;
	const status = Number(output.status ?? output.status_code ?? output.statusCode);
	if (!Number.isInteger(status) || status < 400 || status > 599) return null;
	return { status, message: firstMessage(output.body) };
};
