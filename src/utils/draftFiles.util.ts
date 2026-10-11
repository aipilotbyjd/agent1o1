/** Files staged in a chat composer, parked in IndexedDB so they survive a reload.
 *  localStorage only holds strings; IndexedDB stores `File`s as they are. */

const DB_NAME = 'agent1o1-drafts';
const STORE = 'files';
/** A draft nobody came back to in this long is dropped, so files don't pile up. */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

type TDraftFilesRecord = { files: File[]; savedAt: number };

let dbPromise: Promise<IDBDatabase> | null = null;

const purgeStale = (db: IDBDatabase) => {
	const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
	const cursorRequest = store.openCursor();
	cursorRequest.onsuccess = () => {
		const cursor = cursorRequest.result;
		if (!cursor) return;
		const record = cursor.value as TDraftFilesRecord;
		if (Date.now() - record.savedAt > MAX_AGE_MS) cursor.delete();
		cursor.continue();
	};
};

/** Rejects in private windows and with site data blocked; callers treat that as no drafts. */
const openDb = () => {
	dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE);
		request.onsuccess = () => {
			purgeStale(request.result);
			resolve(request.result);
		};
		request.onerror = () => reject(request.error);
	}).catch((error) => {
		dbPromise = null;
		throw error;
	});
	return dbPromise;
};

const run = async <T>(
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore) => IDBRequest<T>,
) => {
	const db = await openDb();
	return new Promise<T>((resolve, reject) => {
		const request = operation(db.transaction(STORE, mode).objectStore(STORE));
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
};

export const readDraftFiles = async (key: string): Promise<File[]> => {
	try {
		const record = await run<TDraftFilesRecord | undefined>('readonly', (store) =>
			store.get(key),
		);
		return record?.files ?? [];
	} catch {
		return [];
	}
};

export const removeDraftFiles = async (key: string) => {
	try {
		await run('readwrite', (store) => store.delete(key));
	} catch {
		// Storage blocked — nothing was parked.
	}
};

/** An empty list removes the record rather than storing it. */
export const writeDraftFiles = async (key: string, files: File[]) => {
	if (files.length === 0) return removeDraftFiles(key);
	try {
		const record: TDraftFilesRecord = { files, savedAt: Date.now() };
		await run('readwrite', (store) => store.put(record, key));
	} catch {
		// Quota or blocked storage — the files stay staged in memory.
	}
};
