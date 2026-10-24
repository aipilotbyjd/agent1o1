import { useMemo } from 'react';
import { useSecrets } from '@/api/modules/secrets';
import { useEditorWorkspaceId } from './useEditorWorkspaceId.hook';

/**
 * The workspace's secrets and variables, for picking and checking
 * `{{ secrets.KEY }}` references. Names only for secrets: the list endpoint
 * never sends a secret's value. `isReady` stays false until the list has
 * loaded, so a reference isn't flagged as missing while it's still on its way.
 */
export const useEditorSecrets = () => {
	const ws = useEditorWorkspaceId();
	const { data, isSuccess } = useSecrets(ws);

	return useMemo(() => {
		const secrets = data ?? [];
		return {
			secrets,
			keys: new Set(secrets.map((secret) => secret.key)),
			byKey: new Map(secrets.map((secret) => [secret.key, secret])),
			isReady: isSuccess,
		};
	}, [data, isSuccess]);
};
