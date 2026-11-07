import { ReactNode, useEffect, useMemo } from 'react';
import { useAppConfig } from '@/api/modules/app-config';
import { DEFAULT_BRAND } from '@/config/brand.default';
import BrandContext from './BrandContext';

/**
 * Serves the assistant's brand from `GET /app-config`, falling back to
 * `DEFAULT_BRAND` until it answers. Also sets the `--assistant-color` CSS
 * variable, so a rename on the server changes text and colour everywhere
 * without a frontend deploy.
 */
export const BrandProvider = ({ children }: { children: ReactNode }) => {
	const { data } = useAppConfig();
	const brand = useMemo(() => data?.brand ?? DEFAULT_BRAND, [data]);

	useEffect(() => {
		document.documentElement.style.setProperty('--assistant-color', brand.color);
	}, [brand]);

	return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
};
