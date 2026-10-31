import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import { Check, Search, Sparkles, Cable, ShieldCheck, Grid } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { OutletContextType } from './_layouts/Apps.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { notify } from '@/api/core';
import { useWorkspaceContext } from '@/context/workspace';
import { useWorkspace } from '@/api/modules/workspaces';
import paths, { withWorkspace } from '@/Routes/paths';
import type {
	TConnectorCredential,
	TConnectorCredentialScope,
	TConnectorData,
} from '@/types/connector.type';
import { isConnectorUnavailable } from '@/types/connector.type';
import {
	useConnectors,
	useConnectorCredentials,
	useCreateConnectorCredential,
	useUpdateConnectorCredential,
	useDeleteConnectorCredential,
	useSetDefaultConnectorCredential,
	useConnectOAuthConnector,
	useTestConnectorCredential,
} from '@/api/modules/connectors';
import type { IAvailableApp, IConnectedApp } from './_types/apps.type';
import {
	buildCreateCredentialData,
	ALL_APPS_ICON,
	CONNECTED_ICON,
	catalogCategories,
	connectorToApp,
	createInitialFormValues,
	getCredentialFields,
	getRequiredFields,
	hasNoCredentialForm,
	isEmptyCredentialValue,
	isOAuthCredentialType,
	matchesCredentialForApp,
} from './_helper/connectorCatalog.helper';
import {
	collectAttentionItems,
	formatRelativeTime,
	type TAttentionItem,
} from './_helper/credentialHealth.helper';
import AccountsModal from './_partial/AccountsModal.partial';
import ConnectedCelebration from './_partial/ConnectedCelebration.partial';
import DisconnectDialog from './_partial/DisconnectDialog.partial';
import CredentialDetailModal from './_partial/CredentialDetailModal.partial';
import AppCard from './_partial/AppCard.partial';
import ConnectModal from './_partial/ConnectModal.partial';
import NeedsAttentionBanner from './_partial/NeedsAttentionBanner.partial';

const workspacePages = pages.workspace.subPages!;

const AppsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.workspace.subPages!.apps }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/** The URL is the source of truth for the workspace; the context covers the
	 *  first render, before the route param is available. */
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId, activeWorkspace } = useWorkspaceContext();
	const currentWorkspaceId = workspaceId || activeWorkspaceId;
	const { data: currentWorkspace } = useWorkspace(currentWorkspaceId);
	/** Mirrors the backend: `connector.manage` is granted to owners and admins only. */
	const workspaceRole = currentWorkspace?.role ?? activeWorkspace?.role;
	const canManageConnections = workspaceRole === 'owner' || workspaceRole === 'admin';

	const {
		data: credentialsData,
		isLoading: isCredentialsLoading,
		refetch: refetchCredentials,
	} = useConnectorCredentials(currentWorkspaceId);
	// The connector catalog is global rather than workspace-scoped, and cached
	// for half an hour, so it takes no params.
	const {
		data: credentialTypesData,
		isLoading: isCredentialTypesLoading,
		isError: isCredentialTypesError,
		refetch: refetchCredentialTypes,
	} = useConnectors();
	const createCredentialMutation = useCreateConnectorCredential(currentWorkspaceId);
	const updateCredentialMutation = useUpdateConnectorCredential(currentWorkspaceId);
	const deleteCredentialMutation = useDeleteConnectorCredential(currentWorkspaceId);
	const connectOAuthMutation = useConnectOAuthConnector(currentWorkspaceId);
	const setDefaultCredentialMutation = useSetDefaultConnectorCredential(currentWorkspaceId);
	// `test`, `share` and `refresh` have no endpoint on this backend; the
	// actions that used them are held back in DetailModalContent.

	const catalogApps = useMemo<IAvailableApp[]>(() => {
		if (credentialTypesData?.length) {
			return credentialTypesData.map(connectorToApp);
		}

		return [];
	}, [credentialTypesData]);

	// Dynamically compute apps based on credentials fetched from API
	const apps = useMemo((): IConnectedApp[] => {
		const credentials = credentialsData ?? [];

		return catalogApps.map((app) => {
			const matchingCredentials = credentials.filter((credential) =>
				matchesCredentialForApp(credential, app),
			);

			return {
				...app,
				isConnected: matchingCredentials.length > 0,
				isExpired:
					matchingCredentials.length > 0 &&
					matchingCredentials.every((credential) => credential.is_expired),
				credentials: matchingCredentials,
				isOAuth: isOAuthCredentialType(app.connector),
			};
		});
	}, [catalogApps, credentialsData]);

	const activeConnectionsCount = useMemo(() => {
		return apps.filter((app) => app.isConnected).length;
	}, [apps]);

	const connectedAccountsCount = useMemo(() => {
		return apps.reduce((total, app) => total + app.credentials.length, 0);
	}, [apps]);

	const totalIntegrationsCount = useMemo(() => {
		return catalogApps.length;
	}, [catalogApps.length]);

	const [searchQuery, setSearchQuery] = useState('');
	/** `All`, `Connected`, or a backend `ConnectorCategory` value. */
	const [selectedCategory, setSelectedCategory] = useState<string>('All');

	/** Cycles rather than opening a menu - one control, and the label always says
	 *  which order is active. */
	const [sortBy, setSortBy] = useState<'connected' | 'name'>('connected');
	const SORT_LABELS = { connected: 'Connected first', name: 'Name (A-Z)' };
	const SORT_ORDER = ['connected', 'name'] as const;

	// Modal States
	const [isConnectModalOpen, setIsConnectModalOpen] = useState(
		() => searchParams.get('connect') === 'true',
	);
	const [modalStep, setModalStep] = useState<1 | 2>(1);
	const [selectedAppForAuth, setSelectedAppForAuth] = useState<IAvailableApp | null>(null);
	const [modalSearch, setModalSearch] = useState('');
	const [isConnecting, setIsConnecting] = useState(false);

	const [credentialName, setCredentialName] = useState('');
	/** New on this backend: a credential is either shared with the workspace
	 *  ('team') or private to its creator ('personal'). */
	const [credentialScope, setCredentialScope] = useState<TConnectorCredentialScope>('team');
	const [credentialFormValues, setCredentialFormValues] = useState<TConnectorData>({});

	/** `?account=<id>` (e.g. from the "needs to be reconnected" notification) opens that account. */
	useEffect(() => {
		if (!searchParams.has('account')) return;
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('account');
		setSearchParams(nextParams, { replace: true });
	}, [searchParams, setSearchParams]);

	useEffect(() => {
		if (searchParams.get('connect') !== 'true') return;
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('connect');
		setSearchParams(nextParams, { replace: true });
	}, [searchParams, setSearchParams]);

	const [selectedCredentialIdForDetail, setSelectedCredentialIdForDetail] = useState<
		string | null
	>(() => searchParams.get('account'));
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(() => searchParams.has('account'));
	const [accountsAppId, setAccountsAppId] = useState<string | null>(null);
	/** Same-window OAuth return (no popup opener): `?oauth=success&type=<key>&credential_id=<id>`. */
	const [celebration, setCelebration] = useState<{
		appId: string;
		accountName?: string;
		credentialId?: string;
	} | null>(() => {
		const params = new URLSearchParams(window.location.search);
		const connectorKey = params.get('type');
		if (params.get('oauth') !== 'success' || !connectorKey) return null;
		return { appId: connectorKey, credentialId: params.get('credential_id') ?? undefined };
	});
	const celebrationApp = apps.find((app) => app.id === celebration?.appId) ?? null;
	const celebrationAccountName =
		celebration?.accountName ??
		celebrationApp?.credentials.find(
			(credential) => credential.id === celebration?.credentialId,
		)?.name ??
		'Your account';

	const testCredentialMutation = useTestConnectorCredential(currentWorkspaceId);
	const [testingId, setTestingId] = useState<string | null>(null);
	const [busyCredentialId, setBusyCredentialId] = useState<string | null>(null);
	const [disconnecting, setDisconnecting] = useState<TConnectorCredential | null>(null);
	const disconnectingApp = disconnecting
		? (apps.find((app) =>
				app.credentials.some((credential) => credential.id === disconnecting.id),
			) ?? null)
		: null;
	const attentionItems = useMemo(() => collectAttentionItems(apps), [apps]);
	const closeCelebration = useCallback(() => setCelebration(null), []);
	const accountsApp = apps.find((app) => app.id === accountsAppId && app.isConnected) ?? null;

	// Filter apps based on search & category
	const filteredApps = useMemo(() => {
		return apps
			.filter((app) => {
				const matchesSearch =
					app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					app.description.toLowerCase().includes(searchQuery.toLowerCase());

				const matchesCategory =
					selectedCategory === 'All' ||
					(selectedCategory === 'Connected' && app.isConnected) ||
					(selectedCategory !== 'Connected' && app.category === selectedCategory);

				return matchesSearch && matchesCategory;
			})
			.slice()
			.sort((a, b) => {
				if (sortBy === 'name') return a.name.localeCompare(b.name);
				return Number(b.isConnected) - Number(a.isConnected) || a.sortOrder - b.sortOrder;
			});
	}, [apps, searchQuery, selectedCategory, sortBy]);

	// Filter available apps inside modal
	const filteredAvailableApps = useMemo(() => {
		return apps.filter((app) => {
			const matchesSearch =
				app.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
				app.description.toLowerCase().includes(modalSearch.toLowerCase());
			return matchesSearch;
		});
	}, [apps, modalSearch]);

	const recommendedApps = useMemo(() => {
		const notConnected = apps.filter(
			(app) => !app.isConnected && !isConnectorUnavailable(app.connector),
		);
		return [...notConnected]
			.sort(
				(a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder,
			)
			.slice(0, 6);
	}, [apps]);

	const recentConnections = useMemo(() => {
		return apps
			.flatMap((app) => app.credentials.map((credential) => ({ app, credential })))
			.sort(
				(a, b) =>
					new Date(b.credential.created_at).getTime() -
					new Date(a.credential.created_at).getTime(),
			)
			.slice(0, 5);
	}, [apps]);

	const categoryCounts = useMemo(() => {
		const counts = catalogCategories(catalogApps)
			.map(({ id, label, icon }) => ({
				category: id,
				label,
				icon,
				count: catalogApps.filter((app) => app.category === id).length,
			}))
			.sort((a, b) => b.count - a.count);
		const max = Math.max(1, ...counts.map((entry) => entry.count));
		return counts.map((entry) => ({ ...entry, percent: (entry.count / max) * 100 }));
	}, [catalogApps]);

	const categoryTabs = useMemo(
		() => [
			{ id: 'All', label: 'All apps', icon: ALL_APPS_ICON },
			{ id: 'Connected', label: 'Connected', icon: CONNECTED_ICON },
			...catalogCategories(catalogApps),
		],
		[catalogApps],
	);

	const searchInputRef = useRef<HTMLInputElement>(null);

	const closeDetailModal = () => {
		setIsDetailModalOpen(false);
		setSelectedCredentialIdForDetail(null);
	};

	const handleTestCredential = async (credentialId: string) => {
		setTestingId(credentialId);
		try {
			const { result } = await testCredentialMutation.mutateAsync(credentialId);
			if (result.ok)
				notify.success(result.account ? `Working · ${result.account}` : result.message);
			else notify.error(result.message);
		} catch {
			// The query client has already toasted the failure.
		} finally {
			setTestingId(null);
		}
	};

	const handleSetDefaultCredential = async (credentialId: string) => {
		setBusyCredentialId(credentialId);
		try {
			await setDefaultCredentialMutation.mutateAsync(credentialId);
			notify.success('Set as the default account.');
		} catch {
			// The query client has already toasted the failure.
		} finally {
			setBusyCredentialId(null);
		}
	};

	const handleRenameCredential = async (credentialId: string, name: string) => {
		setBusyCredentialId(credentialId);
		try {
			await updateCredentialMutation.mutateAsync({ id: credentialId, body: { name } });
			notify.success('Account renamed.');
			return true;
		} catch {
			return false;
		} finally {
			setBusyCredentialId(null);
		}
	};

	/** Renews the same account's tokens, so anything pinned to it keeps working. */
	const handleReconnectCredential = async (credential: TConnectorCredential) => {
		const connector =
			credential.connector ??
			(credentialTypesData ?? []).find((entry) => entry.id === credential.connector_id);
		if (!connector) return;
		setBusyCredentialId(credential.id);
		try {
			await connectOAuthMutation.mutateAsync({
				connector_id: connector.id,
				name: credential.name,
				scope: credential.scope,
				credential_id: credential.id,
			});
			notify.success(`${credential.name} reconnected.`);
		} catch {
			// The query client has already toasted the failure.
		} finally {
			setBusyCredentialId(null);
		}
	};

	/** Opens the dialog that says what will break, and offers to move it first. */
	const handleDeleteCredential = (credential: TConnectorCredential) => {
		setDisconnecting(credential);
	};

	const confirmDisconnect = async (replaceWith?: string) => {
		if (!disconnecting) return;
		const credential = disconnecting;
		try {
			await deleteCredentialMutation.mutateAsync({ id: credential.id, replaceWith });
		} catch {
			return;
		}
		notify.success(
			replaceWith
				? `${credential.name} disconnected. Everything using it was moved.`
				: `${credential.name} disconnected.`,
		);
		setDisconnecting(null);
		if (selectedCredentialIdForDetail === credential.id) closeDetailModal();
	};

	const handleFixAttention = (item: TAttentionItem) => {
		if (item.attention.level === 'expired' && item.app.isOAuth) {
			void handleReconnectCredential(item.credential);
			return;
		}
		setSelectedCredentialIdForDetail(item.credential.id);
		setIsDetailModalOpen(true);
	};

	const closeConnectModal = () => {
		setIsConnectModalOpen(false);
		setModalStep(1);
		setSelectedAppForAuth(null);
		setModalSearch('');
	};
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				searchInputRef.current?.focus();
				return;
			}
			if (event.key !== 'Escape') return;
			if (isDetailModalOpen) {
				closeDetailModal();
			} else if (accountsAppId) {
				setAccountsAppId(null);
			} else if (isConnectModalOpen && !isConnecting) {
				closeConnectModal();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	});

	const handleConnectClick = (app: IAvailableApp) => {
		if (!app.connector) {
			notify.error('Credential catalog is not ready yet.');
			return;
		}
		if (isConnectorUnavailable(app.connector)) return;

		const existingCount = (credentialsData ?? []).filter((credential) =>
			matchesCredentialForApp(credential, app),
		).length;
		setSelectedAppForAuth(app);
		setCredentialName(
			existingCount > 0
				? `My ${app.name} Connection ${existingCount + 1}`
				: `My ${app.name} Connection`,
		);
		setCredentialScope('team');
		setCredentialFormValues(createInitialFormValues(app.connector));
		setModalStep(2);
	};

	const handleAuthorize = async () => {
		if (!selectedAppForAuth) return;
		setIsConnecting(true);

		try {
			const connector = selectedAppForAuth.connector;
			if (!connector) {
				notify.error('Credential catalog is not ready yet.');
				return;
			}

			if (isOAuthCredentialType(connector)) {
				await connectOAuthMutation.mutateAsync({
					connector_id: connector.id,
					name: credentialName.trim(),
					scope: credentialScope,
				});
			} else {
				const fields = getCredentialFields(connector);
				await createCredentialMutation.mutateAsync({
					connector_id: connector.id,
					name: credentialName.trim(),
					data: buildCreateCredentialData(fields, credentialFormValues),
					expires_at: null,
					scope: credentialScope,
				});
			}

			setCelebration({ appId: selectedAppForAuth.id, accountName: credentialName.trim() });
			setIsConnectModalOpen(false);
			setModalStep(1);
			setSelectedAppForAuth(null);
			setModalSearch('');
			setCredentialFormValues({});
		} catch (error) {
			console.error('Failed to create credential:', error);
		} finally {
			setIsConnecting(false);
		}
	};

	const handleToggleConnection = async (id: string) => {
		const credentials = credentialsData ?? [];
		const allPossibleApps = catalogApps;
		const appDetails = allPossibleApps.find((a) => a.id === id);
		const matchingCredentials = appDetails
			? credentials.filter((credential) => matchesCredentialForApp(credential, appDetails))
			: [];

		if (matchingCredentials.length > 0) {
			setAccountsAppId(id);
		} else if (appDetails) {
			openConnectForApp(appDetails, 0);
		}
	};

	const openConnectForApp = (appDetails: IAvailableApp, existingCount: number) => {
		if (!appDetails.connector) {
			notify.error('Credential catalog is not ready yet.');
			return;
		}
		if (isConnectorUnavailable(appDetails.connector)) return;

		setSelectedAppForAuth(appDetails);
		setCredentialName(
			existingCount > 0
				? `My ${appDetails.name} Connection ${existingCount + 1}`
				: `My ${appDetails.name} Connection`,
		);
		setCredentialScope('team');
		setCredentialFormValues(createInitialFormValues(appDetails.connector));
		setModalStep(2);
		setIsConnectModalOpen(true);
	};

	/** Clears the OAuth return params; the celebration itself was read from them on mount. */
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const oauthStatus = params.get('oauth');
		if (!oauthStatus) return;
		window.history.replaceState({}, '', window.location.pathname);
		if (oauthStatus === 'success') {
			void refetchCredentials();
			if (!params.get('type')) notify.success('App connected.');
		} else {
			notify.error(params.get('message') ?? 'OAuth authorization failed.');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectedCredentialFields = getCredentialFields(selectedAppForAuth?.connector);
	const selectedRequiredFields = getRequiredFields(selectedAppForAuth?.connector);
	const selectedAppUsesOAuth = isOAuthCredentialType(selectedAppForAuth?.connector);
	const selectedAppHasNoForm = hasNoCredentialForm(selectedAppForAuth?.connector);
	const canSubmitConnection =
		!selectedAppHasNoForm &&
		Boolean(credentialName.trim()) &&
		(selectedAppUsesOAuth ||
			selectedRequiredFields.every(
				(key) => !isEmptyCredentialValue(credentialFormValues[key]),
			));
	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			{/* Ambient decorative blur glows */}
			<div className='from-primary-400/5 to-primary-400/5 pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr blur-[120px]' />
			<div className='from-primary-500/5 to-primary-500/0 pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 md:p-10'>
				{/* Header panel */}
				<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
					<div>
						<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
							Apps
						</h1>
						<p className='text-primary-700 dark:text-primary-400 mt-1 text-[11px] font-extrabold tracking-widest uppercase'>
							Integrations Hub
						</p>
						<p className='mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400'>
							Manage your secure API keys and third-party app connections.
						</p>
					</div>

					<button
						onClick={() => setIsConnectModalOpen(true)}
						hidden={!canManageConnections}
						className='bg-primary-400 text-primary-950 shadow-primary-500/10 hover:bg-primary-500 hover:shadow-primary-500/20 flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold shadow-md transition-all hover:shadow-lg active:scale-95 dark:shadow-none'>
						<Cable size={14} />
						<span>Connect App</span>
					</button>
				</div>

				{/* Two-Column Grid Content */}
				<div className='grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12'>
					{/* Left Column (Main App Catalog) */}
					<div className='flex w-full flex-col gap-8 lg:col-span-9'>
						{attentionItems.length > 0 && (
							<NeedsAttentionBanner
								canManage={canManageConnections}
								items={attentionItems}
								busyId={busyCredentialId}
								onFix={handleFixAttention}
							/>
						)}

						{/* Stats overview row */}
						<div className='no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0'>
							{/* Card 1: Active Connections */}
							<div className='group hover:border-primary-500/30 relative flex w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto sm:p-6 dark:border-zinc-800/80 dark:bg-[#11131c]'>
								<Cable className='pointer-events-none absolute -top-4 -right-4 h-24 w-24 text-slate-900/[0.03] dark:text-white/[0.04]' />
								<div className='relative flex items-center gap-3'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'>
										<Cable size={20} className='stroke-[2.2px]' />
									</div>
									<span className='text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-400'>
										Active Connections
									</span>
								</div>
								<div className='relative mt-5'>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
											{isCredentialsLoading ? '…' : activeConnectionsCount}
										</span>
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
											connected
										</span>
									</div>
									<p className='mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
										{isCredentialsLoading
											? 'Loading accounts…'
											: activeConnectionsCount > 0
												? `${connectedAccountsCount} ${connectedAccountsCount === 1 ? 'account' : 'accounts'} across ${activeConnectionsCount} ${activeConnectionsCount === 1 ? 'app' : 'apps'}`
												: 'No apps connected yet'}
									</p>
								</div>
								<button
									onClick={() => setIsConnectModalOpen(true)}
									className='bg-primary-400 text-primary-950 hover:bg-primary-500 relative mt-5 h-9 w-full cursor-pointer rounded-xl text-[11px] font-extrabold transition-all active:scale-95'>
									Browse Apps
								</button>
							</div>

							{/* Card 2: Available Catalog */}
							<div className='group hover:border-primary-500/30 relative flex w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto sm:p-6 dark:border-zinc-800/80 dark:bg-[#11131c]'>
								<Grid className='pointer-events-none absolute -top-4 -right-4 h-24 w-24 text-slate-900/[0.03] dark:text-white/[0.04]' />
								<div className='relative flex items-center gap-3'>
									<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl'>
										<Grid size={20} className='stroke-[2.2px]' />
									</div>
									<span className='text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-400'>
										Available Catalog
									</span>
								</div>
								<div className='relative mt-5'>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
											{isCredentialTypesLoading
												? '…'
												: totalIntegrationsCount}
										</span>
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
											integrations
										</span>
									</div>
									<p className='mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
										{isCredentialTypesLoading
											? 'Loading catalog…'
											: `${Math.max(0, totalIntegrationsCount - activeConnectionsCount)} ready to connect`}
									</p>
								</div>
								<button
									onClick={() => setIsConnectModalOpen(true)}
									className='dark:text-zinc-350 relative mt-5 h-9 w-full cursor-pointer rounded-xl border border-slate-200 text-[11px] font-extrabold text-slate-600 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'>
									Explore Catalog
								</button>
							</div>

							{/* Card 3: Data Security */}
							<div className='group hover:border-primary-500/30 relative flex w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-auto sm:p-6 dark:border-zinc-800/80 dark:bg-[#11131c]'>
								<ShieldCheck className='pointer-events-none absolute -top-4 -right-4 h-24 w-24 text-slate-900/[0.03] dark:text-white/[0.04]' />
								<div className='relative flex items-center gap-3'>
									<div className='bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl'>
										<ShieldCheck size={20} className='stroke-[2.2px]' />
									</div>
									<span className='text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-400'>
										Data Security
									</span>
								</div>
								<div className='relative mt-5'>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
											AES-256
										</span>
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>
											encrypted
										</span>
									</div>
									<div className='mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500'>
										<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
										<span>Encrypted at rest, never shown again</span>
									</div>
								</div>
								<button
									type='button'
									onClick={() =>
										window.open(
											'https://docs.agent1o1.com',
											'_blank',
											'noopener,noreferrer',
										)
									}
									className='dark:text-zinc-350 relative mt-5 h-9 w-full cursor-pointer rounded-xl border border-slate-200 text-[11px] font-extrabold text-slate-600 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'>
									Learn More
								</button>
							</div>
						</div>

						{canManageConnections && recommendedApps.length > 0 && (
							<div className='w-full text-left'>
								<div className='mb-4 flex items-center gap-2'>
									<Sparkles size={14} className='text-primary-500' />
									<h2 className='text-slate-450 text-xs font-extrabold tracking-wider uppercase dark:text-zinc-500'>
										Recommended For You
									</h2>
								</div>

								<div className='grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6'>
									{recommendedApps.map((rec) => (
										<button
											key={rec.id}
											type='button'
											aria-label={`Connect ${rec.name}`}
											onClick={() => openConnectForApp(rec, 0)}
											className='group/rec hover:border-primary-400/35 flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/50 bg-white/70 p-3 text-left shadow-2xs transition-all hover:shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60'>
											<div
												className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white'
												style={{ backgroundColor: rec.color }}>
												<rec.icon className='h-4 w-4' />
											</div>
											<div className='min-w-0'>
												<p className='group-hover/rec:text-primary-700 truncate text-[11px] font-extrabold text-slate-900 transition-colors dark:text-white'>
													{rec.name}
												</p>
												<p className='truncate text-[9px] font-semibold text-slate-400 dark:text-zinc-500'>
													{rec.categoryLabel}
												</p>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Search & Categories Filter Bar */}
						<div className='flex w-full flex-col gap-4'>
							<div className='group relative flex-1'>
								<Search className='group-focus-within:text-primary-700 absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 dark:text-zinc-500' />
								<input
									ref={searchInputRef}
									type='search'
									aria-label='Search integrations'
									placeholder='Search integrations...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='dark:placeholder:text-zinc-650 focus:border-primary-400/80 focus:ring-primary-400/10 dark:focus:border-primary-500 dark:focus:ring-primary-500/15 block h-12 w-full rounded-2xl border border-slate-200/60 bg-white pr-14 pl-12 text-xs font-bold text-slate-900 shadow-sm transition-all duration-200 outline-none placeholder:text-slate-400 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100'
								/>
								<div className='pointer-events-none absolute top-3.5 right-4 hidden items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400 shadow-2xs sm:flex dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500'>
									⌘K
								</div>
							</div>

							{/* Categories & Sort */}
							<div className='flex w-full items-center gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800/40'>
								<div className='no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 md:pb-0'>
									{categoryTabs.map((cat) => {
										const isActive = selectedCategory === cat.id;
										return (
											<button
												key={cat.id}
												type='button'
												onClick={() => setSelectedCategory(cat.id)}
												className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs transition-all duration-200 ${
													isActive
														? 'border-primary-400 bg-primary-400 text-primary-950 border font-extrabold shadow-sm'
														: 'border border-slate-200/60 bg-white font-bold text-slate-600 shadow-xs hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/20'
												}`}>
												<cat.icon className='h-3.5 w-3.5 shrink-0' />
												<span>{cat.label}</span>
												{cat.id === 'Connected' &&
													activeConnectionsCount > 0 && (
														<span
															className={`rounded-full px-1.5 text-[10px] font-black ${isActive ? 'bg-primary-950/10' : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
															{activeConnectionsCount}
														</span>
													)}
											</button>
										);
									})}
								</div>

								<button
									type='button'
									title='Change sort order'
									onClick={() =>
										setSortBy(
											(current) =>
												SORT_ORDER[
													(SORT_ORDER.indexOf(current) + 1) %
														SORT_ORDER.length
												],
										)
									}
									className='text-primary-700 flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white px-3.5 text-xs font-extrabold shadow-xs transition-all hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-[#11131c]'>
									<span className='hidden sm:inline'>Sort:</span>
									<span>{SORT_LABELS[sortBy]}</span>
								</button>
							</div>
						</div>

						{/* Main Apps Grid List */}
						{isCredentialTypesLoading ? (
							<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
								{Array.from({ length: 6 }).map((_, index) => (
									<div
										key={index}
										className='h-52 animate-pulse rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40'>
										<div className='h-11 w-11 rounded-xl bg-slate-200 dark:bg-zinc-800' />
										<div className='mt-6 h-5 w-1/2 rounded bg-slate-200 dark:bg-zinc-800' />
										<div className='mt-3 h-3 w-4/5 rounded bg-slate-200 dark:bg-zinc-800' />
									</div>
								))}
							</div>
						) : isCredentialTypesError ? (
							<div className='rounded-[24px] border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-500/20 dark:bg-zinc-900/50'>
								<h2 className='text-sm font-black text-slate-900 dark:text-white'>
									Unable to load integrations
								</h2>
								<p className='mx-auto mt-2 max-w-md text-xs font-semibold text-slate-500 dark:text-zinc-400'>
									The credential catalog API did not respond successfully.
								</p>
								<button
									type='button'
									onClick={() => void refetchCredentialTypes()}
									className='bg-primary-400 text-primary-950 mt-5 h-10 cursor-pointer rounded-xl px-5 text-xs font-bold shadow-md transition-all active:scale-95'>
									Retry
								</button>
							</div>
						) : filteredApps.length === 0 ? (
							<div className='rounded-[24px] border border-slate-200/60 bg-white p-8 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50'>
								<h2 className='text-sm font-black text-slate-900 dark:text-white'>
									No integrations found
								</h2>
								<p className='mx-auto mt-2 max-w-md text-xs font-semibold text-slate-500 dark:text-zinc-400'>
									Try a different search or filter option.
								</p>
								{(searchQuery || selectedCategory !== 'All') && (
									<button
										type='button'
										onClick={() => {
											setSearchQuery('');
											setSelectedCategory('All');
										}}
										className='mt-5 h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
										Clear filters
									</button>
								)}
							</div>
						) : (
							<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
								<AnimatePresence mode='popLayout'>
									{filteredApps.map((app) => (
										<AppCard
											key={app.id}
											app={app}
											canManage={canManageConnections}
											isBusy={
												createCredentialMutation.isPending ||
												deleteCredentialMutation.isPending ||
												connectOAuthMutation.isPending
											}
											onAction={() => handleToggleConnection(app.id)}
										/>
									))}
								</AnimatePresence>
							</div>
						)}
					</div>

					{/* Right Column (Sidebar Widgets) */}
					<div className='flex w-full flex-col gap-6 text-left lg:col-span-3'>
						{/* Widget 1: Recently Connected */}
						<div className='rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#11131c]'>
							<div className='mb-4.5 flex items-center justify-between'>
								<h3 className='text-xs font-extrabold tracking-wider text-slate-800 uppercase dark:text-zinc-200'>
									Recently Connected
								</h3>
								<button
									type='button'
									onClick={() =>
										navigate(
											withWorkspace(
												workspacePages.trail.to,
												currentWorkspaceId,
											),
										)
									}
									className='text-primary-700 cursor-pointer text-[10px] font-bold hover:underline'>
									View all
								</button>
							</div>

							{recentConnections.length === 0 ? (
								<p className='text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
									Accounts you connect will show up here.
								</p>
							) : (
								<div className='space-y-1'>
									{recentConnections.map(({ app, credential }) => (
										<button
											key={credential.id}
											type='button'
											onClick={() => {
												setSelectedCredentialIdForDetail(credential.id);
												setIsDetailModalOpen(true);
											}}
											className='-mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40'>
											<div className='flex min-w-0 items-center gap-2.5'>
												<div
													className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white'
													style={{ backgroundColor: app.color }}>
													<app.icon className='h-3.5 w-3.5' />
												</div>
												<div className='min-w-0'>
													<p className='truncate leading-tight font-bold text-slate-800 dark:text-zinc-200'>
														{credential.name}
													</p>
													<p className='mt-0.5 truncate text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
														{credential.account_label ?? app.name} ·{' '}
														{formatRelativeTime(credential.created_at)}
													</p>
												</div>
											</div>
											<div
												className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${credential.is_expired ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10'}`}>
												{credential.is_expired ? (
													<span className='text-[10px] font-black'>
														!
													</span>
												) : (
													<Check size={11} className='stroke-[3px]' />
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Widget 2: Unlock More Power rocket banner */}
						<div className='border-primary-100 from-primary-400/10 via-primary-400/5 dark:border-primary-900/10 dark:from-primary-400/5 relative overflow-hidden rounded-[24px] border bg-gradient-to-br to-transparent p-5 shadow-xs dark:to-transparent'>
							<div className='pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 opacity-20 select-none'>
								<Sparkles size={64} className='text-primary-700' />
							</div>
							<h3 className='text-primary-950 dark:text-primary-400 text-xs font-extrabold tracking-wider uppercase'>
								Unlock More Power
							</h3>
							<p className='mt-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
								Connect more apps to automate workflows and boost agent
								productivity.
							</p>
							<button
								onClick={() => setIsConnectModalOpen(true)}
								className='bg-primary-400 text-primary-950 hover:bg-primary-500 mt-4 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 text-[10px] font-extrabold shadow-xs transition-all active:scale-95'>
								<span>Explore Catalog</span>
								<span>→</span>
							</button>
						</div>

						{/* Widget 3: Top Categories */}
						<div className='rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#11131c]'>
							<h3 className='mb-4 text-xs font-extrabold tracking-wider text-slate-800 uppercase dark:text-zinc-200'>
								Top Categories
							</h3>

							<div className='space-y-1 text-[11px] font-bold'>
								{categoryCounts.map(
									({ category, label, icon: CategoryIcon, count, percent }) => (
										<button
											key={category}
											type='button'
											aria-label={`Show ${label} apps (${count})`}
											onClick={() => setSelectedCategory(category)}
											className={`-mx-2 flex w-[calc(100%+1rem)] cursor-pointer flex-col gap-1.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40 ${selectedCategory === category ? 'bg-slate-50 dark:bg-zinc-800/40' : ''}`}>
											<div className='dark:text-zinc-350 flex w-full items-center justify-between text-slate-700'>
												<span className='flex items-center gap-2'>
													<CategoryIcon className='text-primary-600 dark:text-primary-400 h-3.5 w-3.5' />
													{label}
												</span>
												<span className='text-slate-400 dark:text-zinc-500'>
													{count}
												</span>
											</div>
											<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800'>
												<div
													className='bg-primary-400 h-1.5 rounded-full'
													style={{ width: `${percent}%` }}
												/>
											</div>
										</button>
									),
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Connection Popup Dialog Overlay */}
			<AnimatePresence>
				{isConnectModalOpen && (
					<ConnectModal
						canManageConnections={canManageConnections}
						canSubmitConnection={canSubmitConnection}
						closeConnectModal={closeConnectModal}
						credentialFormValues={credentialFormValues}
						credentialName={credentialName}
						credentialScope={credentialScope}
						filteredAvailableApps={filteredAvailableApps}
						handleAuthorize={handleAuthorize}
						handleConnectClick={handleConnectClick}
						isConnecting={isConnecting}
						modalSearch={modalSearch}
						modalStep={modalStep}
						selectedAppForAuth={selectedAppForAuth}
						selectedAppHasNoForm={selectedAppHasNoForm}
						selectedAppUsesOAuth={selectedAppUsesOAuth}
						selectedCredentialFields={selectedCredentialFields}
						selectedRequiredFields={selectedRequiredFields}
						setCredentialFormValues={setCredentialFormValues}
						setCredentialName={setCredentialName}
						setCredentialScope={setCredentialScope}
						setModalSearch={setModalSearch}
						setModalStep={setModalStep}
						totalIntegrationsCount={totalIntegrationsCount}
						isCredentialTypesLoading={isCredentialTypesLoading}
						isCredentialTypesError={isCredentialTypesError}
						refetchCredentialTypes={refetchCredentialTypes}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{accountsApp && (
					<div
						role='presentation'
						onClick={(event) => {
							if (event.target === event.currentTarget) setAccountsAppId(null);
						}}
						className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 font-sans text-slate-950 backdrop-blur-xs dark:bg-black/60 dark:text-zinc-50'>
						<AccountsModal
							app={accountsApp}
							canManage={canManageConnections}
							testingId={testingId}
							busyId={busyCredentialId}
							onClose={() => setAccountsAppId(null)}
							onSelect={(credentialId) => {
								setSelectedCredentialIdForDetail(credentialId);
								setIsDetailModalOpen(true);
							}}
							onAdd={() => {
								setAccountsAppId(null);
								openConnectForApp(accountsApp, accountsApp.credentials.length);
							}}
							onTest={(credentialId) => void handleTestCredential(credentialId)}
							onSetDefault={(credentialId) =>
								void handleSetDefaultCredential(credentialId)
							}
							onRename={handleRenameCredential}
							onDelete={(credential) => void handleDeleteCredential(credential)}
							onReconnect={(credential) => void handleReconnectCredential(credential)}
						/>
					</div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{celebration && celebrationApp && (
					<ConnectedCelebration
						app={celebrationApp}
						accountName={celebrationAccountName}
						onClose={closeCelebration}
						onBuildWorkflow={() => navigate(paths.newPlaybook(currentWorkspaceId))}
						onOpenAgents={() => navigate(paths.agents(currentWorkspaceId))}
						onViewAccounts={() => {
							setCelebration(null);
							setAccountsAppId(celebrationApp.id);
						}}
					/>
				)}
			</AnimatePresence>

			{/* Credential Details Dialog Overlay */}
			<AnimatePresence>
				{isDetailModalOpen && selectedCredentialIdForDetail && (
					<div
						role='presentation'
						onClick={(event) => {
							if (event.target !== event.currentTarget) return;
							setIsDetailModalOpen(false);
							setSelectedCredentialIdForDetail(null);
						}}
						className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 font-sans text-slate-950 backdrop-blur-xs dark:bg-black/60 dark:text-zinc-50'>
						<CredentialDetailModal
							activeWorkspaceId={currentWorkspaceId}
							credentialId={selectedCredentialIdForDetail}
							connectors={credentialTypesData ?? []}
							apps={apps}
							closeLabel={accountsApp ? 'Back' : 'Close'}
							onClose={closeDetailModal}
							onDelete={(credential) => void handleDeleteCredential(credential)}
							onReconnect={(credential) => void handleReconnectCredential(credential)}
							onTest={(credentialId) => void handleTestCredential(credentialId)}
							canManage={canManageConnections}
							isTesting={testingId === selectedCredentialIdForDetail}
							onUpdate={async (id, body) => {
								await updateCredentialMutation.mutateAsync({
									id,
									body,
								});
								notify.success('Connection updated.');
							}}
							onSetDefault={(credentialId) =>
								void handleSetDefaultCredential(credentialId)
							}
							isDeleting={deleteCredentialMutation.isPending}
							isUpdating={updateCredentialMutation.isPending}
							isReconnecting={busyCredentialId === selectedCredentialIdForDetail}
							isSettingDefault={setDefaultCredentialMutation.isPending}
						/>
					</div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{disconnecting && disconnectingApp && (
					<DisconnectDialog
						workspaceId={currentWorkspaceId}
						app={disconnectingApp}
						credential={disconnecting}
						isDeleting={deleteCredentialMutation.isPending}
						onCancel={() => setDisconnecting(null)}
						onConfirm={(replaceWith) => void confirmDisconnect(replaceWith)}
					/>
				)}
			</AnimatePresence>
		</Container>
	);
};

export default AppsListPage;
