import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/context/realtime/useRealtime';
import { appConfigKeys } from '@/api/modules/app-config';
import type { TBrand } from '@/types/brand.type';

/** Mirrors `App\Events\Assistant\BrandChanged`. */
const BRAND_CHANNEL = 'app-config';
const BRAND_CHANGED_EVENT = '.brand.changed';

/**
 * Applies a server-side rename (`php artisan assistant:brand-refresh`) to an
 * open tab immediately. Renders nothing; mounted inside `RealtimeProvider`.
 */
export const BrandRealtimeSync = () => {
	const { echo } = useRealtime();
	const qc = useQueryClient();

	useEffect(() => {
		if (!echo) return undefined;

		echo.channel(BRAND_CHANNEL).listen(BRAND_CHANGED_EVENT, (event: { brand: TBrand }) => {
			qc.setQueryData(appConfigKeys.root, { brand: event.brand });
		});

		return () => echo.leaveChannel(BRAND_CHANNEL);
	}, [echo, qc]);

	return null;
};
