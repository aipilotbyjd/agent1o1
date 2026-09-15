import { axiosClient } from '@/api/client';
import { unwrapKey } from '@/api/core';
import type { TApiResponse, TPaginationMeta } from '@/api/core';
import type {
	TArtifact,
	TArtifactListParams,
	TUploadArtifactDto,
	TUpdateArtifactAccessDto,
	TShareArtifactDto,
} from '@/types/artifact.type';
import { ArtifactEndpoints as E } from './artifacts.endpoints';

export const ArtifactService = {
	list: (ws: string, params?: TArtifactListParams, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<TArtifact[]> & { meta: TPaginationMeta }>(E.list(ws), { params, signal })
			.then((r) => ({ artifacts: r.data.data, meta: r.data.meta })),

	detail: (ws: string, id: string, signal?: AbortSignal) =>
		axiosClient
			.get<TApiResponse<{ artifact: TArtifact }>>(E.detail(ws, id), { signal })
			.then(unwrapKey<TArtifact>('artifact')),

	upload: (ws: string, payload: TUploadArtifactDto) => {
		const form = new FormData();
		form.append('file', payload.file);
		if (payload.filename) form.append('filename', payload.filename);
		if (payload.agent_id) form.append('agent_id', payload.agent_id);
		if (payload.group_id) form.append('group_id', payload.group_id);
		if (payload.metadata) form.append('metadata', JSON.stringify(payload.metadata));
		return axiosClient
			.post<TApiResponse<{ artifact: TArtifact }>>(E.create(ws), form)
			.then(unwrapKey<TArtifact>('artifact'));
	},

	remove: (ws: string, id: string) => axiosClient.delete(E.delete(ws, id)).then(() => undefined),

	downloadUrl: (ws: string, id: string) => E.download(ws, id),

	updateAccess: (ws: string, id: string, payload: TUpdateArtifactAccessDto) =>
		axiosClient
			.patch<TApiResponse<{ artifact: TArtifact }>>(E.updateAccess(ws, id), payload)
			.then(unwrapKey<TArtifact>('artifact')),

	addShare: (ws: string, id: string, payload: TShareArtifactDto) =>
		axiosClient
			.post<TApiResponse<{ artifact: TArtifact }>>(E.addShare(ws, id), payload)
			.then(unwrapKey<TArtifact>('artifact')),

	removeShare: (ws: string, id: string, userId: string) =>
		axiosClient.delete(E.removeShare(ws, id, userId)).then(() => undefined),

	/** Fetches the file as a blob and triggers a browser save — the
	 *  AgentBuilder expects this, `downloadUrl` alone isn't enough. */
	download: async (ws: string, id: string, filename: string) => {
		const response = await axiosClient.get(E.download(ws, id), { responseType: 'blob' });
		const url = URL.createObjectURL(response.data as Blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	},
};
