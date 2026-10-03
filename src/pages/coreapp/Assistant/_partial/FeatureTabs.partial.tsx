import classNames from 'classnames';
import SituationsTabPartial from './SituationsTab.partial';
import DailyTabPartial from './DailyTab.partial';
import MeetingsTabPartial from './MeetingsTab.partial';
import InboxTabPartial from './InboxTab.partial';
import { useBrand } from '@/context/brand';

export const FEATURE_TABS = ['situations', 'daily', 'inbox', 'prep'] as const;
export type TFeatureTab = (typeof FEATURE_TABS)[number];

const AVAILABLE: TFeatureTab[] = ['situations', 'daily', 'inbox', 'prep'];

interface IFeatureTabsProps {
	workspaceId: string;
	active: TFeatureTab;
	onChange: (tab: TFeatureTab) => void;
	onOpenSession: (sessionId: string) => void;
}

/** The assistant's background features under the chat box. Names come from the brand. */
const FeatureTabsPartial = ({
	workspaceId,
	active,
	onChange,
	onOpenSession,
}: IFeatureTabsProps) => {
	const brand = useBrand();
	const labels: Record<TFeatureTab, string> = {
		situations: brand.features.situations,
		daily: brand.features.daily,
		inbox: brand.features.inbox,
		prep: brand.features.meeting_prep,
	};

	return (
		<div className='flex flex-col gap-4'>
			<div
				role='tablist'
				className='flex gap-1 border-b border-zinc-200 dark:border-white/10'>
				{FEATURE_TABS.map((tab) => {
					const available = AVAILABLE.includes(tab);
					return (
						<button
							key={tab}
							type='button'
							role='tab'
							aria-selected={active === tab}
							disabled={!available}
							onClick={() => onChange(tab)}
							title={available ? undefined : 'Coming soon'}
							className={classNames(
								'-mb-px border-b-2 px-3 py-2 text-sm',
								active === tab
									? 'border-assistant font-semibold text-zinc-900 dark:text-white'
									: 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
								!available && 'cursor-not-allowed opacity-50',
							)}>
							{labels[tab]}
						</button>
					);
				})}
			</div>
			{active === 'situations' && (
				<SituationsTabPartial workspaceId={workspaceId} onOpenSession={onOpenSession} />
			)}
			{active === 'daily' && <DailyTabPartial workspaceId={workspaceId} />}
			{active === 'inbox' && (
				<InboxTabPartial workspaceId={workspaceId} onOpenSession={onOpenSession} />
			)}
			{active === 'prep' && <MeetingsTabPartial workspaceId={workspaceId} />}
		</div>
	);
};

export default FeatureTabsPartial;
