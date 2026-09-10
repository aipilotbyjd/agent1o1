import { LockKeyhole, ArrowLeft } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import classNames from 'classnames';
import Aside, { AsideBody } from '@/components/layout/Aside';
import Icon from '@/components/icon/Icon';
import { TIcons } from '@/types/icons.type';
import pages from '@/Routes/pages';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import useAsideStatus from '@/hooks/useAsideStatus';

const SectionTitle = ({ children }: { children: string }) => {
	const { asideStatus } = useAsideStatus();
	if (!asideStatus) return null;
	return <div className='mb-2 px-2 text-xs font-bold text-zinc-500'>{children}</div>;
};

const SettingsNavItem = ({ to, icon, text }: { to: string; icon: TIcons; text: string }) => {
	const { asideStatus } = useAsideStatus();
	return (
		<NavLink
			to={to}
			end
			className={({ isActive }) =>
				classNames(
					'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-zinc-500 transition hover:text-zinc-950 dark:hover:text-white',
					{
						'bg-primary-400/10 text-primary-500 dark:text-primary-400': isActive,
						'hover:bg-zinc-100 dark:hover:bg-white/5': !isActive,
						'justify-center': !asideStatus,
					},
				)
			}>
			<Icon icon={icon} className='shrink-0 text-lg' />
			{asideStatus && <span className='min-w-0 truncate'>{text}</span>}
		</NavLink>
	);
};

const LockedNavItem = ({ label }: { label: string }) => {
	const { asideStatus } = useAsideStatus();
	return (
		<div
			className={classNames(
				'flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-semibold text-zinc-400 opacity-50',
				{ 'justify-center': !asideStatus },
			)}>
			<LockKeyhole size={18} className='shrink-0' />
			{asideStatus && <span className='min-w-0 truncate'>{label}</span>}
		</div>
	);
};

const SettingsAsideTemplate = () => {
	const { asideStatus } = useAsideStatus();
	const navigate = useNavigate();

	return (
		<Aside className='bg-white dark:!bg-bg-sidebar'>
			<AsideHeaderPart />
			<AsideBody className='[&>div:first-child]:from-white dark:[&>div:first-child]:from-bg-sidebar [&>div:last-child]:from-white dark:[&>div:last-child]:from-bg-sidebar'>
				<button
					type='button'
					onClick={() => navigate(pages.app.subPages.workflows.to)}
					className={classNames(
						'mb-5 flex h-10 items-center gap-3 rounded-lg px-2 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100 dark:text-white dark:hover:bg-white/5',
						{ 'justify-center': !asideStatus },
					)}>
					<ArrowLeft size={18} />
					{asideStatus && <span>Go back</span>}
				</button>

				<div className='space-y-7'>
					<section>
						<SectionTitle>Account</SectionTitle>
						<div className='space-y-1'>
							<SettingsNavItem {...pages.settings.subPages.profile} />
							<SettingsNavItem {...pages.settings.subPages.secrets} />
						</div>
					</section>

					<section>
						<SectionTitle>Plan & Credits</SectionTitle>
						<div className='space-y-1'>
							<SettingsNavItem {...pages.settings.subPages.plan} />
						</div>
					</section>

					<section>
						<SectionTitle>Organization</SectionTitle>
						<div className='space-y-1'>
							<SettingsNavItem {...pages.settings.subPages.workspace} />
							{pages.onboarding.subPages?.workspaceList && (
								<SettingsNavItem {...pages.onboarding.subPages.workspaceList} />
							)}
							<SettingsNavItem {...pages.settings.subPages.members} />
							<SettingsNavItem {...pages.settings.subPages.environments} />
						</div>
					</section>

					<section>
						<SectionTitle>Notifications</SectionTitle>
						<div className='space-y-1'>
							<SettingsNavItem {...pages.settings.subPages.notifications} />
							<SettingsNavItem {...pages.settings.subPages.notificationChannels} />
						</div>
					</section>

				</div>
			</AsideBody>
		</Aside>
	);
};

export default SettingsAsideTemplate;
