import { useQuery } from '@tanstack/react-query';
import { AppConfigService } from './app-config.service';
import { appConfigKeys } from './app-config.keys';

/** Public config (the assistant brand). The server caches it for 5 minutes;
 *  a `brand.changed` broadcast invalidates it sooner. */
export const useAppConfig = () =>
	useQuery({
		queryKey: appConfigKeys.root,
		queryFn: ({ signal }) => AppConfigService.show(signal),
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});
