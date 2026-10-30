import { useCallback, useEffect, useMemo } from 'react';
import { useNodeCategories, usePinNodeCategory } from '@/api/modules/catalog';

/** Where pins lived before they were kept on the account. */
const LEGACY_STORAGE_KEY = 'workflow-editor:pinned-apps';

let legacyImportStarted = false;

const readLegacyPins = (): string[] => {
	try {
		const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
		return stored ? (JSON.parse(stored) as string[]) : [];
	} catch {
		return [];
	}
};

/**
 * Apps the user starred. They live on the account, so they follow the user to
 * another browser or device. Pins saved in this browser before that are sent up once.
 */
export const usePinnedApps = () => {
	const { data: categories } = useNodeCategories();
	const { mutate } = usePinNodeCategory();

	const apps = useMemo(
		() => (categories ?? []).filter((category) => category.kind === 'app'),
		[categories],
	);
	const pinned = useMemo(
		() => apps.filter((app) => app.is_pinned).map((app) => app.slug),
		[apps],
	);

	useEffect(() => {
		if (legacyImportStarted || apps.length === 0) return;
		legacyImportStarted = true;

		const legacy = readLegacyPins();
		apps.filter((app) => legacy.includes(app.slug) && !app.is_pinned).forEach((app) =>
			mutate({ id: app.id, isPinned: true }),
		);

		try {
			localStorage.removeItem(LEGACY_STORAGE_KEY);
		} catch {
			// Nothing to clean up if storage is unavailable.
		}
	}, [apps, mutate]);

	const toggle = useCallback(
		(appSlug: string) => {
			const app = apps.find((candidate) => candidate.slug === appSlug);
			if (app) mutate({ id: app.id, isPinned: !app.is_pinned });
		},
		[apps, mutate],
	);

	return { pinned, isPinned: (appSlug: string) => pinned.includes(appSlug), toggle };
};
