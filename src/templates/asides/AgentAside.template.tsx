import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
	ArrowLeft,
	Plus,
	Folder,
	Sparkles,
	Mail,
	MessageSquare,
	Globe,
	Search,
	ListFilter,
	MoreVertical,
	Bot,
} from 'lucide-react';
import Icon from '@/components/icon/Icon';
import Aside, { AsideBody, AsideFooter } from '@/components/layout/Aside';
import useAsideStatus from '@/hooks/useAsideStatus';
import { useAuth } from '@/context/authContext';
import classNames from 'classnames';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import GlobalSearch from '@/templates/search/GlobalSearch.template';

const AppAsideTemplate = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { asideStatus, closeAside } = useAsideStatus();
	const { userData } = useAuth();
	const [recentSearch, setRecentSearch] = useState('');

	return (
		<Aside className='border-e border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950'>
			{/* Sidebar Header */}
			<div className='flex h-14 items-center justify-between border-b border-zinc-100 px-4 dark:border-zinc-800/80'>
				<div className='flex items-center gap-2'>
					{/* Logo */}
					<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary-400 text-primary-950'>
						<Bot size={16} className='fill-current' />
					</div>
					{asideStatus && (
						<span className='text-sm font-black tracking-tight text-zinc-950 dark:text-white'>
							agent101
						</span>
					)}
				</div>
				{asideStatus && (
					<div className='flex items-center gap-2.5'>
						<button
							onClick={() => useGlobalSearchStore.getState().open()}
							className='text-zinc-400 hover:text-zinc-950 dark:hover:text-white'>
							<Search size={15} />
						</button>
						<button
							onClick={closeAside}
							title='Collapse sidebar'
							className='text-zinc-400 hover:text-zinc-950 dark:hover:text-white'>
							<svg
								width='16'
								height='16'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.5'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='m11 17-5-5 5-5M18 17l-5-5 5-5' />
							</svg>
						</button>
					</div>
				)}
			</div>

			<AsideBody className='flex flex-col gap-4 py-4'>
				{/* Go Back button */}
				<button
					onClick={() => navigate('/agents')}
					className='flex items-center gap-2.5 px-3 py-1 text-xs font-bold text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white'>
					<ArrowLeft size={15} />
					{asideStatus && <span>Go back</span>}
				</button>

				{/* New Chat Button */}
				<div className='px-3'>
					<button className='flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2 text-xs font-black text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						<Plus size={14} />
						{asideStatus && <span>New Chat</span>}
					</button>
				</div>

				{/* Navigation Items */}
				<div className='flex flex-col gap-1 px-3'>
					<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50/80 dark:text-zinc-300 dark:hover:bg-zinc-900'>
						<Folder size={15} className='text-zinc-450 dark:text-zinc-500' />
						{asideStatus && <span>Files Generated</span>}
					</button>
					<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50/80 dark:text-zinc-300 dark:hover:bg-zinc-900'>
						<Sparkles size={15} className='text-zinc-455 dark:text-zinc-500' />
						{asideStatus && <span>Reflections</span>}
					</button>
				</div>

				{/* External Channels */}
				<div className='px-3'>
					{asideStatus && (
						<h4 className='px-3 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
							External Channels
						</h4>
					)}
					<div className='mt-2 flex flex-col gap-1'>
						<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-650 transition hover:bg-zinc-50/80 dark:text-zinc-400 dark:hover:bg-zinc-900'>
							<Mail size={14} />
							{asideStatus && <span>Email</span>}
						</button>
						<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-650 transition hover:bg-zinc-50/80 dark:text-zinc-400 dark:hover:bg-zinc-900'>
							<Icon icon='Slack' className='text-zinc-500 hover:text-zinc-950 dark:hover:text-white' style={{ fontSize: '14px' }} />
							{asideStatus && <span>Slack</span>}
						</button>
						<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-650 transition hover:bg-zinc-50/80 dark:text-zinc-400 dark:hover:bg-zinc-900'>
							<MessageSquare size={14} />
							{asideStatus && <span>Microsoft Teams</span>}
						</button>
						<button className='flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-zinc-650 transition hover:bg-zinc-50/80 dark:text-zinc-400 dark:hover:bg-zinc-900'>
							<Globe size={14} />
							{asideStatus && <span>Hosted Page</span>}
						</button>
					</div>
				</div>

				{/* Recents */}
				<div className='px-3'>
					{asideStatus && (
						<h4 className='px-3 text-[10px] font-black tracking-wider text-zinc-400 uppercase dark:text-zinc-500'>
							Recents
						</h4>
					)}
					{asideStatus && (
						<div className='mt-2 px-3'>
							<div className='relative flex items-center rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60'>
								<input
									type='text'
									placeholder='Search'
									value={recentSearch}
									onChange={(e) => setRecentSearch(e.target.value)}
									className='w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none border-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500'
								/>
								<ListFilter size={13} className='text-zinc-400' />
							</div>
						</div>
					)}
					{/* Scrollable list content placeholder */}
					{asideStatus && (
						<div className='mx-3 mt-3 h-24 overflow-y-auto rounded-xl border border-dashed border-zinc-200 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/10' />
					)}
				</div>
			</AsideBody>

			{/* Sidebar Footer */}
			<AsideFooter className='border-t border-zinc-100 p-4 dark:border-zinc-800/80'>
				{asideStatus && (
					<div className='mb-4 flex flex-col gap-2'>
						<div className='flex items-center justify-between text-[10px] font-black text-zinc-550 dark:text-zinc-400'>
							<span>Credits Remaining</span>
							<span>5.0k of 5.0k</span>
						</div>
						{/* Progress bar */}
						<div className='h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800'>
							<div className='h-2 rounded-full bg-primary-400' style={{ width: '100%' }} />
						</div>
						{/* Upgrade Plan Button */}
						<button
							onClick={() => navigate('/settings/plan')}
							className='mt-1 flex w-full items-center justify-center rounded-xl bg-primary-400 py-2 text-xs font-black text-primary-950 shadow-md shadow-primary-500/20 transition hover:bg-primary-500 active:scale-95 dark:shadow-none'>
							Upgrade Plan
						</button>
					</div>
				)}

				{/* Profile Panel */}
				<div className='flex items-center justify-between rounded-xl bg-zinc-50/50 p-2.5 dark:bg-zinc-900/40'>
					<div className='flex items-center gap-3 min-w-0'>
						{/* User avatar */}
						<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-400 text-xs font-black text-primary-950'>
							{userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
						</div>
						{asideStatus && (
							<div className='truncate text-left'>
								<div className='truncate text-xs font-bold text-zinc-950 dark:text-white'>
									{userData?.name || 'Amaan'}
								</div>
								<div className='text-[10px] text-zinc-450 dark:text-zinc-500'>
									{userData?.role || 'Member'}
								</div>
							</div>
						)}
					</div>
					{asideStatus && (
						<button className='text-zinc-400 hover:text-zinc-950 dark:hover:text-white'>
							<MoreVertical size={15} />
						</button>
					)}
				</div>
			</AsideFooter>
			<GlobalSearch />
		</Aside>
	);
};

export default AppAsideTemplate;
