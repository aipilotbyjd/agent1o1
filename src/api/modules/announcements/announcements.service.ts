import { axiosClient } from '@/api/client';
import { unwrap } from '@/api/core';
import type { TApiResponse } from '@/api/core';
import type { TAnnouncementsPayload } from '@/types/announcement.type';
import { AnnouncementEndpoints as E } from './announcements.endpoints';

export const AnnouncementService = {
	list: (signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TAnnouncementsPayload>>(E.list, { signal })
			.then(unwrap<TAnnouncementsPayload>),

	dismiss: (id: string) => axiosClient.post(E.dismiss(id)).then(() => undefined),
};
