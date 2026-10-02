import { ReactNode, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppConfig } from '@/api/modules/app-config';
import { DEFAULT_BRAND } from '@/config/brand.default';
import BrandContext from './BrandContext';
import { applyBrandToI18n } from './brand.i18n';

/**
 * Serves the assistant's brand from `GET /app-config`, falling back to
 * `DEFAULT_BRAND` until it answers. Also pushes it into i18next and the
 * `--assistant-color` CSS variable, so a rename on the server changes text
 * and colour everywhere without a frontend deploy.
 */
export const BrandProvider = ({ children }: { children: ReactNode }) => {
	const { i18n } = useTranslation();
	const { data } = useAppConfig();
	const brand = useMemo(() => data?.brand ?? DEFAULT_BRAND, [data]);

	useEffect(() => {
		applyBrandToI18n(i18n, brand);
		document.documentElement.style.setProperty('--assistant-color', brand.color);
	}, [i18n, brand]);

	return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
};
