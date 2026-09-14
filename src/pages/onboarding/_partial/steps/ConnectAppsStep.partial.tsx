import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';
import { CONNECTOR_APPS } from '../../_helper/onboarding.constants';
import BrandLogo from '../shared/BrandLogo.partial';
import type { IApp } from '../../_types/onboarding.type';

const ConnectAppsStep = () => {
	const { state, dispatch } = useOnboardingStore();
	const { appSearch, connectedApps } = state;

	const connectedAppCredits = useMemo(() => connectedApps.length * 250, [connectedApps]);

	const filteredApps = CONNECTOR_APPS.filter(
		(app) =>
			app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
			app.category.toLowerCase().includes(appSearch.toLowerCase()),
	);

	const startAppAuth = (app: IApp) => {
		if (connectedApps.includes(app.name)) return;
		dispatch({
			type: 'SET_FIELD',
			payload: { authSuccess: false, workspaceInput: '', selectedAppForAuth: app },
		});
	};

	return (
		<>
			<div>
				<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
					Give your agent its tools
				</h1>
				<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>
					Plug in the apps your team already uses — your agent will start connecting the
					dots right away.
				</p>
			</div>

			<div className='flex gap-2'>
				<div className='relative flex-1'>
					<Search className='absolute top-3 left-3 h-4 w-4 text-slate-400' />
					<input
						type='text'
						placeholder='Search apps to connect...'
						value={appSearch}
						onChange={(e) =>
							dispatch({ type: 'SET_FIELD', payload: { appSearch: e.target.value } })
						}
						className='h-10 w-full rounded-xl border border-slate-200/90 bg-white/50 pr-4 pl-9 text-xs font-semibold transition-all outline-none focus:border-primary-500 dark:border-zinc-800 dark:bg-zinc-950/40'
					/>
				</div>
				<div className='flex items-center rounded-xl border border-slate-200 bg-white/50 px-3 text-xs font-bold text-slate-500 dark:border-zinc-800'>
					{connectedAppCredits}/2000 creds
				</div>
			</div>

			<div className='no-scrollbar max-h-[220px] space-y-2 overflow-y-auto pr-1'>
				{filteredApps.map((app) => {
					const isConnected = connectedApps.includes(app.name);
					return (
						<div
							key={app.name}
							className={`flex items-center justify-between rounded-xl border p-3 ${isConnected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-100 bg-white/40 dark:border-zinc-800/80 dark:bg-zinc-950/20'}`}>
							<div className='flex items-center gap-3'>
								<BrandLogo name={app.name} className='h-8 w-8' />
								<div>
									<p className='text-xs font-bold text-slate-900 dark:text-zinc-50'>
										{app.name}
									</p>
									<p className='text-[10px] text-slate-400'>{app.description}</p>
								</div>
							</div>
							<button
								disabled={isConnected}
								onClick={() => startAppAuth(app)}
								className={`flex h-7 items-center justify-center rounded-lg px-3 text-xs font-black transition-all ${
									isConnected
										? 'border border-emerald-500/20 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400'
										: 'bg-slate-900 text-white hover:opacity-90 active:scale-95 dark:bg-zinc-100 dark:text-slate-950'
								}`}>
								{isConnected ? 'Connected' : 'Connect'}
							</button>
						</div>
					);
				})}
			</div>
		</>
	);
};

export default ConnectAppsStep;
