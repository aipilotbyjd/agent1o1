import type { TColors } from '@/types/colors.type';
import type { TChangelogCategory } from '@/types/changelog.type';

export const CHANGELOG_CATEGORIES: { value: TChangelogCategory; label: string; color: TColors }[] =
	[
		{ value: 'feature', label: 'New feature', color: 'emerald' },
		{ value: 'improvement', label: 'Improvement', color: 'sky' },
		{ value: 'fix', label: 'Fix', color: 'zinc' },
		{ value: 'security', label: 'Security', color: 'violet' },
		{ value: 'deprecation', label: 'Deprecation', color: 'amber' },
		{ value: 'breaking', label: 'Breaking change', color: 'red' },
	];

export const categoryMeta = (category: TChangelogCategory) =>
	CHANGELOG_CATEGORIES.find((item) => item.value === category) ?? CHANGELOG_CATEGORIES[0];
