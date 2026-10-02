import type { i18n as TI18n } from 'i18next';
import type { TBrand } from '@/types/brand.type';

/** Custom i18next event `useTranslation` re-renders on (see `react.bindI18n`
 *  in `i18n.ts`), so a rename reaches already-mounted text. */
export const BRAND_CHANGED_EVENT = 'brandChanged';

/**
 * The brand as i18next interpolation defaults: every translation can say
 * `{{assistantName}}` without the component passing it in.
 */
export const brandVariables = (brand: TBrand) => ({
	assistantName: brand.name,
	assistantTagline: brand.tagline,
	assistantDaily: brand.features.daily,
	assistantInbox: brand.features.inbox,
	assistantPrep: brand.features.meeting_prep,
	assistantSituations: brand.features.situations,
	assistantEmail: brand.email,
});

export const applyBrandToI18n = (i18n: TI18n, brand: TBrand) => {
	i18n.options.interpolation = {
		...i18n.options.interpolation,
		defaultVariables: {
			...i18n.options.interpolation?.defaultVariables,
			...brandVariables(brand),
		},
	};
	i18n.emit(BRAND_CHANGED_EVENT);
};
