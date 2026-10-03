import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TAppConfig } from '@/types/brand.type';
import { AppConfigEndpoints as E } from './app-config.endpoints';

export const AppConfigService = {
	show: (signal?: AbortSignal) =>
		axiosClient.get<TApiResponse<TAppConfig>>(E.show, { signal }).then(unwrap<TAppConfig>),
};
