import type { TAiProvider } from '@/types/ai-provider.type';

export type TKeyFormatHint =
	| { kind: 'other-provider'; provider: TAiProvider }
	| { kind: 'unexpected-prefix'; prefix: string }
	| null;

/**
 * A quick look at a pasted key before it's sent anywhere: does it look like
 * it belongs to a different provider (an `sk-ant-` key under OpenAI), or
 * not start the way this provider's keys do? Longer prefixes are checked
 * first, since `sk-` alone also begins Anthropic and OpenRouter keys.
 */
export const keyFormatHint = (
	apiKey: string,
	selected: TAiProvider | undefined,
	providers: TAiProvider[],
): TKeyFormatHint => {
	const key = apiKey.trim();
	if (!selected || key.length < 6) return null;

	const owner = [...providers]
		.filter((p) => p.key_prefix)
		.sort((a, b) => (b.key_prefix?.length ?? 0) - (a.key_prefix?.length ?? 0))
		.find((p) => key.startsWith(p.key_prefix!));

	// Several providers share a prefix (OpenAI and DeepSeek both use `sk-`):
	// a key that fits the selected provider's prefix just as well is fine.
	const fitsSelectedAsWell =
		!!selected.key_prefix &&
		key.startsWith(selected.key_prefix) &&
		selected.key_prefix.length >= (owner?.key_prefix?.length ?? 0);

	if (owner && owner.key !== selected.key && !fitsSelectedAsWell) {
		return { kind: 'other-provider', provider: owner };
	}

	if (selected.key_prefix && !key.startsWith(selected.key_prefix)) {
		return { kind: 'unexpected-prefix', prefix: selected.key_prefix };
	}

	return null;
};

/**
 * "Paste any key": which providers a key could belong to, judged by its
 * prefix alone. Only the providers sharing the longest matching prefix are
 * returned (an `sk-ant-` key is Anthropic's, not OpenAI's), so the result is
 * one provider when the key says whose it is, several when the prefix is
 * shared (`sk-`: OpenAI or DeepSeek), and none when it has no known shape.
 */
export const detectKeyProviders = (apiKey: string, providers: TAiProvider[]): TAiProvider[] => {
	const key = apiKey.trim();
	if (key.length < 6) return [];

	const matches = providers.filter((p) => p.key_prefix && key.startsWith(p.key_prefix));
	const longest = Math.max(0, ...matches.map((p) => p.key_prefix!.length));

	return matches.filter((p) => p.key_prefix!.length === longest);
};
