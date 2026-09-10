import type { AxiosResponse } from 'axios';
import type { TApiResponse } from '@/types/api.type';

// ============================================================
// Envelope
// ------------------------------------------------------------
// Peels the `{ success, message, data }` envelope so callers see
// only the typed payload. If a resource nests its payload one level
// deeper (e.g. `{ data: { artifact: {...} } }`), unwrap here and
// reshape in that module's service — never assume every endpoint
// follows the same nesting.
// ============================================================
export const unwrap = <T>(res: AxiosResponse<TApiResponse<T>>): T => res.data.data;

/** Peels `{ data: { [key]: T } }` — the shape most Internal V1 resource
 *  endpoints actually return (`{ workflow: {...} }`, `{ agents: [...] }`),
 *  rather than the bare payload `unwrap` expects. */
export const unwrapKey =
	<T>(key: string) =>
	(res: AxiosResponse<TApiResponse<Record<string, T>>>): T =>
		res.data.data[key];
