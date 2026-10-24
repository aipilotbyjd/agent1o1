import { Mail } from 'lucide-react';
import {
	useCommunicationPreferences,
	useUpdateCommunicationPreferences,
} from '@/api/modules/communication-preferences';
import Checkbox from '@/components/form/Checkbox';

/**
 * The member's own choice about product news and offers. It follows them
 * across workspaces, and service messages (incidents, security, billing
 * problems) still reach them either way, which the copy says.
 */
const MarketingEmailPreference = () => {
	const { data, isLoading } = useCommunicationPreferences();
	const update = useUpdateCommunicationPreferences();

	return (
		<section className='mt-8'>
			<div className='mb-3 flex items-center gap-2'>
				<Mail size={15} className='text-zinc-400 dark:text-zinc-500' />
				<h3 className='text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
					Product emails
				</h3>
			</div>
			<div className='flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-700 dark:bg-zinc-900'>
				<div className='min-w-0 flex-1'>
					<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
						News and offers
					</p>
					<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
						Product updates and occasional offers. Messages about your account, such as
						service incidents, are always sent.
					</p>
				</div>
				<Checkbox
					variant='switch'
					checked={data?.marketing_emails ?? true}
					disabled={isLoading || update.isPending}
					onChange={(e) => update.mutate({ marketing_emails: e.target.checked })}
					aria-label='Receive news and offers by email'
				/>
			</div>
		</section>
	);
};

export default MarketingEmailPreference;
