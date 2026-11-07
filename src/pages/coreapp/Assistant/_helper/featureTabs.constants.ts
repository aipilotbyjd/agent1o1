export const FEATURE_TABS = ['situations', 'daily', 'inbox', 'prep'] as const;
export type TFeatureTab = (typeof FEATURE_TABS)[number];
