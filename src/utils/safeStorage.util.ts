type TStorageArea = 'local' | 'session';

/** Even reading `window.localStorage` throws in private windows and with site data blocked. */
const area = (kind: TStorageArea): Storage =>
	kind === 'session' ? window.sessionStorage : window.localStorage;

/** Browser storage that never throws: reads fall back to null, writes report whether they landed. */
const safeStorage = {
	get: (key: string, kind: TStorageArea = 'local'): string | null => {
		try {
			return area(kind).getItem(key);
		} catch {
			return null;
		}
	},
	set: (key: string, value: string, kind: TStorageArea = 'local'): boolean => {
		try {
			area(kind).setItem(key, value);
			return true;
		} catch {
			return false;
		}
	},
	remove: (key: string, kind: TStorageArea = 'local'): void => {
		try {
			area(kind).removeItem(key);
		} catch {
			// Storage blocked — nothing to remove.
		}
	},
};

export default safeStorage;
