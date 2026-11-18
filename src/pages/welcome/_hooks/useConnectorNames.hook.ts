import { useCallback, useMemo } from 'react';
import { useConnectors } from '@/api/modules/connectors';
import { humanizeKey } from '../_helper/onboarding.helper';

/** Turns a connector key (`google_sheets`) into the app's name ("Google Sheets"). */
export const useConnectorNames = () => {
	const { data: connectors } = useConnectors();

	const names = useMemo(
		() => new Map((connectors ?? []).map((connector) => [connector.key, connector.name])),
		[connectors],
	);

	return useCallback((key: string) => names.get(key) ?? humanizeKey(key), [names]);
};
