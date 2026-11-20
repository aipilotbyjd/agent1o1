export declare const buildSecurityHeaders: (
	env: Record<string, string | undefined>,
) => Record<string, string>;

export declare const toNetlifyHeaders: (headers: Record<string, string>) => string;
