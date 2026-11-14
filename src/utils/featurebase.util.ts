/** Public Featurebase board where users suggest and vote on features. Set VITE_FEATUREBASE_URL to override, or to an empty string to hide the links. */
export const FEATUREBASE_URL: string =
	import.meta.env.VITE_FEATUREBASE_URL ?? 'https://agent1o1.featurebase.app/';

export const openFeatureBoard = (): void => {
	if (!FEATUREBASE_URL) return;
	window.open(FEATUREBASE_URL, '_blank', 'noopener,noreferrer');
};
