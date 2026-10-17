import { useCallback, useState } from 'react';
import safeStorage from '@/utils/safeStorage.util';

const MAX_RECENT = 5;

const read = (key: string): string[] => {
	try {
		const value = JSON.parse(safeStorage.get(key) ?? '[]');
		return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
	} catch {
		return [];
	}
};

/**
 * A member's starred and recently picked models, kept in this browser:
 * a convenience, so losing it (private window, cleared data) costs nothing.
 */
const useModelPrefs = (userKey: string) => {
	const favoritesKey = `model-picker:favorites:${userKey}`;
	const recentKey = `model-picker:recent:${userKey}`;
	const [favorites, setFavorites] = useState<string[]>(() => read(favoritesKey));
	const [recent, setRecent] = useState<string[]>(() => read(recentKey));

	const toggleFavorite = useCallback(
		(slug: string) =>
			setFavorites((prev) => {
				const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
				safeStorage.set(favoritesKey, JSON.stringify(next));
				return next;
			}),
		[favoritesKey],
	);

	const markUsed = useCallback(
		(slug: string) =>
			setRecent((prev) => {
				const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT);
				safeStorage.set(recentKey, JSON.stringify(next));
				return next;
			}),
		[recentKey],
	);

	return { favorites, recent, toggleFavorite, markUsed };
};

export default useModelPrefs;
