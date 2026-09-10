import { createResource } from '@/api/core';
import { SecretService } from './secrets.service';
import { secretKeys } from './secrets.keys';

const Secrets = createResource({
	service: SecretService,
	keys: secretKeys,
	label: { singular: 'Secret', plural: 'Secrets' },
});

export const useSecrets = Secrets.useList;
export const useSecret = Secrets.useDetail;
export const useCreateSecret = Secrets.useCreate;
export const useUpdateSecret = Secrets.useUpdate;
export const useDeleteSecret = Secrets.useDelete;
