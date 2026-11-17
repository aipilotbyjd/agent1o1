import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import Checkbox from '@/components/form/Checkbox';
import { categoryIcon } from '@/components/notifications/notificationMeta';
import type {
	TNotificationCategory,
	TNotificationPreferenceChange,
} from '@/types/notification.type';
import { resolveSetting, type TStoredSetting } from './resolveSetting';

type TProps = {
	categories: TNotificationCategory[];
	stored: Map<string, TStoredSetting>;
	disabled?: boolean;
	onChange: (change: TNotificationPreferenceChange) => void;
};

const Column = ({ children }: { children: ReactNode }) => (
	<div className='flex w-14 justify-center'>{children}</div>
);

/**
 * Category sections of events with In-app / Email / Digest switches, and a
 * row per category that sets every event in it at once.
 */
const PreferenceMatrix = ({ categories, stored, disabled, onChange }: TProps) => (
	<div className='space-y-8'>
		<div className='flex items-center justify-end gap-2 pr-5 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
			<span className='w-14 text-center'>In-app</span>
			<span className='w-14 text-center'>Email</span>
			<span className='w-14 text-center'>Daily digest</span>
		</div>

		{categories.map((category) => {
			const Icon = categoryIcon(category.key);
			const events = category.events.filter((entry) => entry.configurable || entry.mandatory);
			if (events.length === 0) return null;

			const configurable = events.filter((entry) => entry.configurable);
			const resolved = configurable.map((entry) =>
				resolveSetting(entry, category.preference_key, stored),
			);
			const all = (field: keyof TStoredSetting) =>
				resolved.length > 0 && resolved.every((setting) => setting[field]);

			const setCategory = (field: keyof TStoredSetting, value: boolean) =>
				onChange({
					key: category.preference_key,
					in_app: field === 'in_app' ? value : all('in_app'),
					email: field === 'email' ? value : all('email'),
					email_digest:
						field === 'email_digest'
							? value
							: field === 'email' && !value
								? false
								: all('email_digest'),
				});

			return (
				<section key={category.key}>
					<div className='mb-3 flex items-center gap-2'>
						<Icon size={15} className='text-zinc-400 dark:text-zinc-500' />
						<h3 className='text-xs font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
							{category.label}
						</h3>
					</div>
					<div className='overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
						{configurable.length > 1 && (
							<div className='flex items-center gap-2 bg-zinc-50/70 px-5 py-3 dark:bg-zinc-950/30'>
								<p className='min-w-0 flex-1 text-xs font-bold text-zinc-500 dark:text-zinc-400'>
									Everything in {category.label.toLowerCase()}
								</p>
								{(['in_app', 'email', 'email_digest'] as const).map((field) => (
									<Column key={field}>
										<Checkbox
											variant='switch'
											checked={all(field)}
											disabled={
												disabled ||
												(field === 'email_digest' && !all('email'))
											}
											onChange={(e) => setCategory(field, e.target.checked)}
											aria-label={`${field === 'in_app' ? 'In-app' : field === 'email' ? 'Email' : 'Daily digest'} for every ${category.label} notification`}
										/>
									</Column>
								))}
							</div>
						)}
						{events.map((entry) => {
							const setting = resolveSetting(entry, category.preference_key, stored);
							const locked = entry.mandatory;
							const save = (field: keyof TStoredSetting, value: boolean) =>
								onChange({
									key: entry.key,
									in_app: field === 'in_app' ? value : setting.in_app,
									email: field === 'email' ? value : setting.email,
									email_digest:
										field === 'email_digest'
											? value
											: field === 'email' && !value
												? false
												: setting.email_digest,
								});

							return (
								<div
									key={entry.key}
									className='flex items-center gap-2 border-t border-zinc-100 px-5 py-4 first:border-t-0 dark:border-zinc-800'>
									<div className='min-w-0 flex-1'>
										<p className='flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100'>
											{entry.label}
											{locked && (
												<Lock
													size={12}
													className='text-zinc-400'
													aria-label='Always sent'
												/>
											)}
										</p>
										<p className='mt-0.5 text-xs font-medium text-zinc-400 dark:text-zinc-500'>
											{entry.description}
											{locked && ' Always sent.'}
										</p>
									</div>
									<Column>
										<Checkbox
											variant='switch'
											checked={setting.in_app}
											disabled={disabled || locked}
											onChange={(e) => save('in_app', e.target.checked)}
											aria-label={`In-app notifications for ${entry.label}`}
										/>
									</Column>
									<Column>
										<Checkbox
											variant='switch'
											checked={setting.email}
											disabled={disabled || locked}
											onChange={(e) => save('email', e.target.checked)}
											aria-label={`Email notifications for ${entry.label}`}
										/>
									</Column>
									<Column>
										<Checkbox
											variant='switch'
											checked={setting.email && setting.email_digest}
											disabled={disabled || locked || !setting.email}
											onChange={(e) => save('email_digest', e.target.checked)}
											aria-label={`Send ${entry.label} emails in a daily digest`}
										/>
									</Column>
								</div>
							);
						})}
					</div>
				</section>
			);
		})}
	</div>
);

export default PreferenceMatrix;
