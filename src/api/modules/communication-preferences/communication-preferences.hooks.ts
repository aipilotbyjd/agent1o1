import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TCommunicationPreferences } from '@/types/announcement.type';
import { CommunicationPreferenceService } from './communication-preferences.service';
import { communicationPreferenceKeys } from './communication-preferences.keys';

export const useCommunicationPreferences = () =>
	useQuery({
		queryKey: communicationPreferenceKeys.all,
		queryFn: ({ signal }) => CommunicationPreferenceService.get(signal),
	});

export const useUpdateCommunicationPreferences = () => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCommunicationPreferences) =>
			CommunicationPreferenceService.update(payload),
		onSuccess: (data) => qc.setQueryData(communicationPreferenceKeys.all, data),
		meta: { errorMessage: 'Failed to save your email preference' },
	});
};
