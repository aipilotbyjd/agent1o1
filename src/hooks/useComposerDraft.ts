import { SetStateAction, useCallback, useLayoutEffect, useRef, useState } from 'react';
import safeStorage from '@/utils/safeStorage.util';

export const readComposerDraft = (key: string) => safeStorage.get(key) ?? '';

/** A blank draft is removed rather than stored, so old keys don't pile up. */
export const writeComposerDraft = (key: string, value: string) => {
	if (value.trim()) safeStorage.set(key, value);
	else safeStorage.remove(key);
};

/** Composer text that survives a reload. Each key holds its own draft: when the
 *  key changes, the draft saved under the new key is loaded. A null key keeps the
 *  draft only in state. */
const useComposerDraft = (key: string | null) => {
	const [draft, setDraftState] = useState(() => (key ? readComposerDraft(key) : ''));
	const [loadedKey, setLoadedKey] = useState(key);
	if (loadedKey !== key) {
		setLoadedKey(key);
		setDraftState(key ? readComposerDraft(key) : '');
	}

	// Functional updates resolve against the latest text, even one set this render,
	// and a late update (a voice transcript) lands in the chat that is open now.
	const latestRef = useRef(draft);
	const keyRef = useRef(key);
	useLayoutEffect(() => {
		latestRef.current = draft;
		keyRef.current = key;
	}, [draft, key]);

	const setDraft = useCallback((action: SetStateAction<string>) => {
		const value = typeof action === 'function' ? action(latestRef.current) : action;
		latestRef.current = value;
		setDraftState(value);
		if (keyRef.current) writeComposerDraft(keyRef.current, value);
	}, []);

	return [draft, setDraft] as const;
};

export default useComposerDraft;
