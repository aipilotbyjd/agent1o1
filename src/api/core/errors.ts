export class ApiError extends Error {
	constructor(
		public readonly status: number | undefined,
		message: string,
		public readonly fields?: Record<string, string[]>,
	) {
		super(message);
		this.name = 'ApiError';
	}

	field(name: string): string | undefined {
		return this.fields?.[name]?.[0];
	}

	fieldErrors(): Record<string, string> {
		if (!this.fields) return {};
		const result: Record<string, string> = {};
		for (const [field, messages] of Object.entries(this.fields)) {
			if (messages.length > 0) result[field] = messages[0];
		}
		return result;
	}

	static is(e: unknown): e is ApiError {
		return e instanceof ApiError;
	}
}
