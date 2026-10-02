import { useTranslation } from 'react-i18next';

const TABS = ['situations', 'daily', 'inbox', 'prep'] as const;

/** Background features (docs/ASSISTANT_PLAN.md §5–6). Names come from the brand. */
const FeatureTabsPartial = () => {
	const { t } = useTranslation();

	return (
		<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
			{TABS.map((tab) => (
				<div
					key={tab}
					className='rounded-2xl border border-dashed border-zinc-200 p-4 dark:border-white/10'>
					<p className='text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
						{t(`assistant.tabs.${tab}`)}
					</p>
					<p className='mt-1 text-xs text-zinc-500'>{t('assistant.comingSoon')}</p>
				</div>
			))}
		</div>
	);
};

export default FeatureTabsPartial;
