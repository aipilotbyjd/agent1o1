import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TTimezone } from '@/types/timezone.type';
import { TimezoneEndpoints as E } from './timezones.endpoints';

export const TimezoneService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ timezones: TTimezone[] }>>(E.list, { signal })
			.then(unwrapKey<TTimezone[]>('timezones')),
};
