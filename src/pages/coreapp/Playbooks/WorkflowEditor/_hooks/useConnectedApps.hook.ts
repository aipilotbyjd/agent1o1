import { useMemo } from 'react';
import { useConnectorCredentials } from '@/api/modules/connectors';

/** Keys of the connectors this workspace holds a live credential for — an app category's slug is its connector key. */
export const useConnectedApps = (workspaceId: string) => {
	const { data: credentials } = useConnectorCredentials(workspaceId);

	return useMemo(
		() =>
			new Set(
				(credentials ?? [])
					.filter((credential) => !credential.is_expired && credential.connector)
					.map((credential) => credential.connector!.key),
			),
		[credentials],
	);
};
