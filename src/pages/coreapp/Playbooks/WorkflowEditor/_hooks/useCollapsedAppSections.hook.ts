import { useCallback, useState } from 'react';

const STORAGE_KEY = 'workflow-editor:app-section-fold';

/** Sections open before the user has folded or unfolded anything: the rest start folded so a long list stays short. */
const OPEN_BY_DEFAULT = 3;

/** Section id to `true` when the user folded it, `false` when they opened it. */
type TFoldChoices = Record<string, boolean>;

const readChoices = (): TFoldChoices => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored ? (JSON.parse(stored) as TFoldChoices) : {};
	} catch {
		return {};
	}
};

/** Which Apps-panel sections are folded: the user's own choice, remembered in this browser, else the default for its position. */
export const useCollapsedAppSections = () => {
	const [choices, setChoices] = useState<TFoldChoices>(readChoices);

	const isCollapsed = useCallback(
		(sectionId: string, position: number) => choices[sectionId] ?? position >= OPEN_BY_DEFAULT,
		[choices],
	);

	const setCollapsed = useCallback((sectionId: string, collapsed: boolean) => {
		setChoices((current) => {
			const next = { ...current, [sectionId]: collapsed };
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			} catch {
				// Private mode or a full quota: the fold still works for this visit.
			}
			return next;
		});
	}, []);

	return { isCollapsed, setCollapsed };
};
