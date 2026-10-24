import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TCommunicationPreferences } from '@/types/announcement.type';
import { CommunicationPreferenceEndpoints as E } from './communication-preferences.endpoints';

export const CommunicationPreferenceService = {
	get: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TCommunicationPreferences>>(E.root, { signal })
			.then(unwrap<TCommunicationPreferences>),

	update: (payload: TCommunicationPreferences) =>
		axiosClient
			.patch<TApiResponse<TCommunicationPreferences>>(E.root, payload)
			.then(unwrap<TCommunicationPreferences>),
};
