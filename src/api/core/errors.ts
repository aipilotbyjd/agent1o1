// ============================================================
// API Error
// ------------------------------------------------------------
// Typed error class for every API failure. The normalize-error
// interceptor rejects with an instance of this class, so anything
// that catches an API error can rely on this shape.
// ============================================================
export class ApiError extends Error {
	constructor(
		public readonly status: number | undefined,
		message: string,
		public readonly fields?: Record<string, string[]>,
	) {
		super(message);
		this.name = 'ApiError';
	}

	/** First validation message for a specific field. */
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

	get isAuth(): boolean {
		return this.status === 401;
	}

	get isValidation(): boolean {
		return this.status === 422;
	}

	get isServer(): boolean {
		return !!this.status && this.status >= 500;
	}

	static is(e: unknown): e is ApiError {
		return e instanceof ApiError;
	}
}
