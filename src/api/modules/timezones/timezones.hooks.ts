import { useQuery } from '@tanstack/react-query';
import { TimezoneService } from './timezones.service';
import { timezoneKeys } from './timezones.keys';

/** Every timezone the backend accepts. Offsets only move with daylight saving, so an hour is fresh enough. */
export const useTimezones = () =>
	useQuery({
		queryKey: timezoneKeys.root,
		queryFn: ({ signal }) => TimezoneService.list(signal),
		staleTime: 60 * 60 * 1000,
	});
