import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Plug, SlidersHorizontal } from 'lucide-react';
import { useAssistantApps } from '@/api/modules/assistant';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';

interface IAppsPanelProps {
	workspaceId: string;
	onOpenPermissions: () => void;
}

/** The apps the assistant can work in for this member, and through which account. */
const AppsPanelPartial = ({ workspaceId, onOpenPermissions }: IAppsPanelProps) => {
	const { t } = useTranslation();
	const { resolvePath } = useResolvePath();
	const { data: apps = [], isLoading } = useAssistantApps(workspaceId);

	const connected = apps.filter((app) => app.connected);
	const others = apps.filter((app) => !app.connected);

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between px-2'>
				<p className='text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
					{t('assistant.appsTitle')}
				</p>
				<button
					type='button'
					onClick={onOpenPermissions}
					title={t('assistant.permissions')}
					aria-label={t('assistant.permissions')}
					className='text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
					<SlidersHorizontal className='h-4 w-4' />
				</button>
			</div>

			{!isLoading && connected.length === 0 && (
				<p className='px-2 text-xs text-zinc-500'>{t('assistant.noApps')}</p>
			)}

			<ul className='flex flex-col gap-1'>
				{connected.map((app) => (
					<li
						key={app.key}
						className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm'>
						<CheckCircle2 className='h-4 w-4 shrink-0 text-emerald-500' />
						<span className='min-w-0 flex-1'>
							<span className='block truncate font-medium text-zinc-800 dark:text-zinc-100'>
								{app.name}
							</span>
							<span className='block truncate text-[11px] text-zinc-500'>
								{app.shared
									? t('assistant.sharedAccount', { account: app.account })
									: app.account}
							</span>
						</span>
					</li>
				))}
			</ul>

			{others.length > 0 && (
				<Link
					to={resolvePath(pages.workspace.subPages!.apps.to)}
					className='inline-flex items-center gap-2 px-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
					<Plug className='h-3.5 w-3.5' />
					{t('assistant.connectMore', { count: others.length })}
				</Link>
			)}
		</div>
	);
};

export default AppsPanelPartial;
