import { SetStateAction, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { readDraftFiles, writeDraftFiles } from '@/utils/draftFiles.util';

const NO_FILES: File[] = [];

const sameFile = (a: File, b: File) =>
	a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** Files staged in a composer that survive a reload, one list per key: the
 *  companion of `useComposerDraft`. They load asynchronously, so a key starts
 *  empty for a moment. A null key keeps the files only in state. */
const useDraftFiles = (key: string | null) => {
	const [state, setState] = useState<{ key: string | null; files: File[] }>({ key, files: [] });
	const files = state.key === key ? state.files : NO_FILES;

	useEffect(() => {
		if (!key) return;
		let cancelled = false;
		void readDraftFiles(key).then((stored) => {
			if (cancelled || stored.length === 0) return;
			// Files picked while the stored ones were loading are kept alongside them.
			setState((current) => {
				const picked = current.key === key ? current.files : [];
				const merged = [
					...stored.filter((file) => !picked.some((item) => sameFile(item, file))),
					...picked,
				];
				return { key, files: merged };
			});
		});
		return () => {
			cancelled = true;
		};
	}, [key]);

	// A late update lands in the chat that is open now, as in `useComposerDraft`.
	const latestRef = useRef(files);
	const keyRef = useRef(key);
	useLayoutEffect(() => {
		latestRef.current = files;
		keyRef.current = key;
	}, [files, key]);

	const setFiles = useCallback((action: SetStateAction<File[]>) => {
		const value = typeof action === 'function' ? action(latestRef.current) : action;
		latestRef.current = value;
		setState({ key: keyRef.current, files: value });
		if (keyRef.current) void writeDraftFiles(keyRef.current, value);
	}, []);

	return [files, setFiles] as const;
};

export default useDraftFiles;
