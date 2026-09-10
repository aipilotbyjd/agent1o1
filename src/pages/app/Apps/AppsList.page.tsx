import { useState, useMemo, useEffect, type ReactNode, type SVGProps } from 'react';
import { useOutletContext, useSearchParams } from 'react-router';
import {
	Calendar,
	Check,
	ChevronDown,
	Cloud,
	Database,
	FileSpreadsheet,
	FileText,
	Key,
	Mail,
	Search,
	Sparkles,
	X as CloseIcon,
	Cable,
	ShieldCheck,
	Megaphone,
	Users,
	Grid,
	type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutletContextType } from './_layouts/Apps.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { notify } from '@/api/core';
import { useWorkspaceContext } from '@/context/workspace';
import { useConfirm } from '@/context/confirm';
import {
	MASKED_CREDENTIAL_VALUE,
	type ICredential,
	type ICredentialDetail,
	type IUpdateCredentialDto,
	type TCredentialData,
	type TCredentialDataValue,
} from '@/types/credential.type';
import type { TCredentialFieldSchema, TCredentialType } from '@/types/credentialType.type';
import {
	useCredentials,
	useCredential,
	useCreateCredential,
	useUpdateCredential,
	useTestCredential,
	useDeleteCredential,
	useConnectOAuthCredential,
	useShareCredential,
} from '@/api/modules/credentials';
import { useCredentialTypes } from '@/api/modules/credential-types';

type SvgIconComponent = LucideIcon | ((props: SVGProps<SVGSVGElement>) => ReactNode);

const GithubIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z'
		/>
	</svg>
);

const XIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
	</svg>
);

const MicrosoftIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox='0 0 24 24' fill='currentColor' {...props}>
		<path d='M0 0h11.4v11.4H0V0zm12.6 0H24v11.4H12.6V0zM0 12.6h11.4V24H0V12.6zm12.6 0H24V24H12.6V12.6z' />
	</svg>
);

interface IAvailableApp {
	id: string;
	name: string;
	description: string;
	icon: SvgIconComponent;
	color: string;
	isPremium?: boolean;
	category: 'Productivity' | 'Developer' | 'Marketing' | 'Collaboration';
	credentialType?: TCredentialType;
	credentialTypeAliases?: string[];
	credentials?: ICredential[];
}

const API_KEY_FIELD_FALLBACK: TCredentialFieldSchema = {
	type: 'string',
	label: 'API Key',
	secret: true,
	placeholder: 'sk-...',
};

const integrationOverrides: Record<
	string,
	Partial<Pick<IAvailableApp, 'icon' | 'color' | 'category' | 'name' | 'description'>>
> = {
	twitter_oauth2: { icon: XIcon, color: '#000000', name: 'X', category: 'Marketing' },
	github: { icon: GithubIcon, color: '#181717', category: 'Developer' },
	github_oauth2: { icon: GithubIcon, color: '#181717', category: 'Developer' },
	microsoft_oauth2: {
		icon: MicrosoftIcon,
		color: '#F25022',
		name: 'Microsoft',
		category: 'Productivity',
	},
	google_oauth2: { icon: Cloud, color: '#4285F4', name: 'Google', category: 'Productivity' },
	google_sheets: { icon: FileSpreadsheet, color: '#0F9D58', category: 'Productivity' },
	gmail: { icon: Mail, color: '#EA4335', category: 'Productivity' },
	google_drive: { icon: Cloud, color: '#34A853', category: 'Collaboration' },
	google_calendar: { icon: Calendar, color: '#4285F4', category: 'Productivity' },
	openai: { icon: Sparkles, color: '#10A37F', category: 'Developer' },
	perplexity: { icon: Sparkles, color: '#19A1B2', category: 'Developer' },
	postgres: { icon: Database, color: '#336791', category: 'Developer' },
	mysql: { icon: Database, color: '#00758F', category: 'Developer' },
	mongodb: { icon: Database, color: '#47A248', category: 'Developer' },
	redis: { icon: Database, color: '#DC382D', category: 'Developer' },
	airtable: { icon: Grid, color: '#18BFFF', category: 'Productivity' },
	notion: { icon: FileText, color: '#000000', category: 'Productivity' },
	slack: { icon: Users, color: '#4A154B', category: 'Collaboration' },
	discord: { icon: Users, color: '#5865F2', category: 'Collaboration' },
	hubspot: { icon: Megaphone, color: '#FF7A59', category: 'Marketing' },
	mailchimp: { icon: Megaphone, color: '#FFE01B', category: 'Marketing' },
};

const inferCategory = (type: string): IAvailableApp['category'] => {
	if (
		[
			'github',
			'gitlab',
			'jira',
			'linear',
			'pagerduty',
			'datadog',
			'sentry',
			'openai',
			'anthropic',
			'google_ai',
			'azure_openai',
			'groq',
			'huggingface',
			'mistral',
			'cohere',
			'perplexity',
			'postgres',
			'mysql',
			'mongodb',
			'redis',
			'elasticsearch',
			'supabase',
			'http_header_auth',
			'http_basic_auth',
			'http_query_auth',
		].some((key) => type.includes(key))
	) {
		return 'Developer';
	}

	if (
		['hubspot', 'mailchimp', 'brevo', 'twitter', 'linkedin', 'salesforce'].some((key) =>
			type.includes(key),
		)
	) {
		return 'Marketing';
	}

	if (
		['slack', 'discord', 'teams', 'dropbox', 'drive', 'cloudinary'].some((key) =>
			type.includes(key),
		)
	) {
		return 'Collaboration';
	}

	return 'Productivity';
};

const credentialTypeToApp = (credentialType: TCredentialType): IAvailableApp => {
	const override = integrationOverrides[credentialType.type] ?? {};

	return {
		id: credentialType.type,
		name: override.name ?? credentialType.name,
		description: override.description ?? credentialType.description,
		icon: override.icon ?? Key,
		color: override.color ?? credentialType.color ?? '#6D28D9',
		category: override.category ?? inferCategory(credentialType.type),
		credentialType,
		credentialTypeAliases: [credentialType.type],
	};
};

const getAppCredentialAliases = (app: Pick<IAvailableApp, 'id' | 'credentialTypeAliases'>) => [
	app.id.toLowerCase(),
	...(app.credentialTypeAliases ?? []),
];

const matchesCredentialForApp = (credential: ICredential, app: IAvailableApp) => {
	const aliases = getAppCredentialAliases(app);
	const provider = (credential.provider || '').toLowerCase();
	const credentialName = credential.name.toLowerCase();
	const type = credential.type.toLowerCase();

	return aliases.some((alias) => {
		const normalized = alias.toLowerCase();
		return (
			type === normalized ||
			provider === normalized ||
			credentialName === normalized ||
			credentialName.includes(normalized.split('_').join(' '))
		);
	});
};

const isOAuthCredentialType = (credentialType?: TCredentialType | null) =>
	Boolean(credentialType?.oauth_config);

const getCredentialFields = (credentialType?: TCredentialType | null) =>
	credentialType?.fields_schema?.properties ?? {
		api_key: API_KEY_FIELD_FALLBACK,
	};

const getRequiredFields = (credentialType?: TCredentialType | null) =>
	credentialType?.fields_schema?.required ?? ['api_key'];

const isEmptyCredentialValue = (value: TCredentialDataValue | undefined) =>
	value === undefined || value === null || value === '';

const coerceCredentialFieldValue = (
	field: TCredentialFieldSchema,
	value: TCredentialDataValue | undefined,
): TCredentialDataValue | undefined => {
	if (field.type === 'boolean') return Boolean(value);
	if (isEmptyCredentialValue(value)) return undefined;
	if (field.type === 'number') {
		const numberValue = Number(value);
		return Number.isFinite(numberValue) ? numberValue : undefined;
	}
	return String(value);
};

const buildCreateCredentialData = (
	fields: Record<string, TCredentialFieldSchema>,
	formValues: TCredentialData,
) => {
	const data: TCredentialData = {};

	for (const [key, field] of Object.entries(fields)) {
		const value = coerceCredentialFieldValue(field, formValues[key]);
		if (value !== undefined) data[key] = value;
	}

	return data;
};

const buildEditCredentialData = (
	fields: Record<string, TCredentialFieldSchema>,
	formValues: TCredentialData,
) => {
	const data: TCredentialData = {};

	for (const [key, field] of Object.entries(fields)) {
		const value = formValues[key];
		if (field.secret && isEmptyCredentialValue(value)) {
			data[key] = MASKED_CREDENTIAL_VALUE;
			continue;
		}

		const coercedValue = coerceCredentialFieldValue(field, value);
		if (coercedValue !== undefined) data[key] = coercedValue;
	}

	return data;
};

const createInitialFormValues = (credentialType?: TCredentialType | null) =>
	Object.fromEntries(
		Object.entries(getCredentialFields(credentialType)).map(([key, field]) => [
			key,
			field.type === 'boolean' ? false : '',
		]),
	) as TCredentialData;

const createEditFormValues = (
	credential: ICredentialDetail,
	credentialType?: TCredentialType | null,
) =>
	Object.fromEntries(
		Object.entries(getCredentialFields(credentialType)).map(([key, field]) => [
			key,
			field.secret ? '' : (credential.data[key] ?? ''),
		]),
	) as TCredentialData;

const AppsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const [searchParams, setSearchParams] = useSearchParams();

	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.app.subPages.apps }]} />);
		return () => setHeaderLeft(undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const { activeWorkspaceId } = useWorkspaceContext();
	const { confirm } = useConfirm();
	const { data: credentialsData, refetch: refetchCredentials } = useCredentials(
		activeWorkspaceId,
		{ per_page: 100 },
	);
	const {
		data: credentialTypesData,
		isLoading: isCredentialTypesLoading,
		isError: isCredentialTypesError,
		refetch: refetchCredentialTypes,
	} = useCredentialTypes({ per_page: 100 });
	const createCredentialMutation = useCreateCredential(activeWorkspaceId);
	const updateCredentialMutation = useUpdateCredential(activeWorkspaceId);
	const testCredentialMutation = useTestCredential(activeWorkspaceId);
	const deleteCredentialMutation = useDeleteCredential(activeWorkspaceId);
	const connectOAuthMutation = useConnectOAuthCredential(activeWorkspaceId);
	const shareCredentialMutation = useShareCredential(activeWorkspaceId);

	const catalogApps = useMemo<IAvailableApp[]>(() => {
		if (credentialTypesData?.length) {
			return credentialTypesData.map(credentialTypeToApp);
		}

		return [];
	}, [credentialTypesData]);

	// Dynamically compute apps based on credentials fetched from API
	const apps = useMemo(() => {
		const credentials = credentialsData ?? [];

		return catalogApps.map((app) => {
			const matchingCredentials = credentials.filter((credential) =>
				matchesCredentialForApp(credential, app),
			);

			// Mock rating, installs, and tag info to match visual screenshot
			let rating = 4.8;
			let reviews = 312;
			let installs = '5k+';
			let subBadge: string = app.category;
			let tags: string[] = [app.category];
			let isPopular = false;

			if (app.id.includes('openai')) {
				rating = 4.9;
				reviews = 1205;
				installs = '25k+';
				subBadge = 'AI Model';
				tags = ['AI', 'Developer'];
				isPopular = true;
			} else if (app.id.includes('cloudinary')) {
				rating = 4.9;
				reviews = 1200;
				installs = '12k+';
				subBadge = 'Media Storage';
				tags = ['Media', 'Storage'];
			} else if (app.id.includes('discord')) {
				rating = 4.8;
				reviews = 892;
				installs = '8k+';
				subBadge = 'Communication';
				tags = ['Community'];
				isPopular = true;
			} else if (app.id.includes('slack')) {
				rating = 4.9;
				reviews = 1845;
				installs = '30k+';
				subBadge = 'Communication';
				tags = ['Chat', 'Team'];
				isPopular = true;
			} else if (app.id.includes('gmail') || app.id.includes('mail')) {
				rating = 4.7;
				reviews = 984;
				installs = '15k+';
				subBadge = 'Email';
				tags = ['Email', 'Marketing'];
			} else if (app.id.includes('stripe')) {
				rating = 4.9;
				reviews = 1432;
				installs = '20k+';
				subBadge = 'Payments';
				tags = ['Finance'];
			} else if (app.id.includes('notion')) {
				rating = 4.8;
				reviews = 952;
				installs = '18k+';
				subBadge = 'Productivity';
				tags = ['Notes', 'Database'];
			}

			return {
				...app,
				isConnected: matchingCredentials.length > 0,
				credentials: matchingCredentials,
				rating,
				reviews,
				installs,
				subBadge,
				tags,
				isPopular,
				isNew: app.id.includes('oauth2') || app.id.includes('sheets'),
				isOAuth: isOAuthCredentialType(app.credentialType),
			};
		});
	}, [catalogApps, credentialsData]);

	const activeConnectionsCount = useMemo(() => {
		return apps.filter((app) => app.isConnected).length;
	}, [apps]);

	const totalIntegrationsCount = useMemo(() => {
		return catalogApps.length;
	}, [catalogApps.length]);

	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<
		'All' | 'Connected' | 'Productivity' | 'Developer' | 'Marketing' | 'Collaboration'
	>('All');

	// Modal States
	const [isConnectModalOpen, setIsConnectModalOpen] = useState(
		() => searchParams.get('connect') === 'true',
	);
	const [modalStep, setModalStep] = useState<1 | 2>(1);
	const [selectedAppForAuth, setSelectedAppForAuth] = useState<IAvailableApp | null>(null);
	const [modalSearch, setModalSearch] = useState('');
	const [isConnecting, setIsConnecting] = useState(false);

	const [credentialName, setCredentialName] = useState('');
	const [credentialFormValues, setCredentialFormValues] = useState<TCredentialData>({});

	useEffect(() => {
		if (searchParams.get('connect') !== 'true') return;
		const nextParams = new URLSearchParams(searchParams);
		nextParams.delete('connect');
		setSearchParams(nextParams, { replace: true });
	}, [searchParams, setSearchParams]);

	const [selectedCredentialIdForDetail, setSelectedCredentialIdForDetail] = useState<
		string | null
	>(null);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

	// Filter apps based on search & category
	const filteredApps = useMemo(() => {
		return apps.filter((app) => {
			const matchesSearch =
				app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.description.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesCategory =
				selectedCategory === 'All' ||
				(selectedCategory === 'Connected' && app.isConnected) ||
				(selectedCategory !== 'Connected' && app.category === selectedCategory);

			return matchesSearch && matchesCategory;
		});
	}, [apps, searchQuery, selectedCategory]);

	// Filter available apps inside modal
	const filteredAvailableApps = useMemo(() => {
		return catalogApps.filter((app) => {
			const matchesSearch =
				app.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
				app.description.toLowerCase().includes(modalSearch.toLowerCase());
			return matchesSearch;
		});
	}, [catalogApps, modalSearch]);

	const handleConnectClick = (app: IAvailableApp) => {
		if (!app.credentialType) {
			notify.error('Credential catalog is not ready yet.');
			return;
		}

		setSelectedAppForAuth(app);
		setCredentialName(`My ${app.name} Connection`);
		setCredentialFormValues(createInitialFormValues(app.credentialType));
		setModalStep(2);
	};

	const handleAuthorize = async () => {
		if (!selectedAppForAuth) return;
		setIsConnecting(true);

		try {
			const credentialType = selectedAppForAuth.credentialType;
			if (!credentialType) {
				notify.error('Credential catalog is not ready yet.');
				return;
			}

			if (isOAuthCredentialType(credentialType) && credentialType) {
				await connectOAuthMutation.mutateAsync({
					credentialType: credentialType.type,
				});
			} else {
				const fields = getCredentialFields(credentialType);
				await createCredentialMutation.mutateAsync({
					name: credentialName.trim(),
					type: credentialType.type,
					credential_type_id: credentialType.id,
					data: buildCreateCredentialData(fields, credentialFormValues),
					expires_at: null,
				});
			}
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

		const isCurrentlyConnected = matchingCredentials.length > 0;

		try {
			if (isCurrentlyConnected) {
				// Instead of immediately deleting, open the Detail Modal!
				setSelectedCredentialIdForDetail(matchingCredentials[0].id);
				setIsDetailModalOpen(true);
			} else {
				// Connect: find the app details, select it, and open modal to Step 2
				if (appDetails) {
					if (!appDetails.credentialType) {
						notify.error('Credential catalog is not ready yet.');
						return;
					}

					setSelectedAppForAuth(appDetails);
					setCredentialName(`My ${appDetails.name} Connection`);
					setCredentialFormValues(createInitialFormValues(appDetails.credentialType));
					setModalStep(2);
					setIsConnectModalOpen(true);
				}
			}
		} catch (error) {
			console.error('Failed to toggle connection:', error);
		}
	};

	useEffect(() => {
		// Handle same-window OAuth return: /apps?oauth=success&type=github_oauth2&...
		const params = new URLSearchParams(window.location.search);
		const oauthStatus = params.get('oauth');
		if (oauthStatus) {
			window.history.replaceState({}, '', window.location.pathname);
			if (oauthStatus === 'success') {
				const type = params.get('type') ?? params.get('credential_type') ?? 'Integration';
				void refetchCredentials();
				notify.success(
					`${type.replace(/_oauth2|_/gi, ' ').trim()} connected successfully!`,
				);
			} else {
				notify.error(params.get('message') ?? 'OAuth authorization failed.');
			}
			return;
		}

		// Handle popup/new-tab OAuth return via postMessage → sessionStorage fallback
		const stored = sessionStorage.getItem('oauth_result');
		if (!stored) return;
		sessionStorage.removeItem('oauth_result');
		try {
			const result = JSON.parse(stored) as {
				success: boolean;
				credentialType?: string;
				error?: string;
			};
			if (result.success) {
				void refetchCredentials();
				if (result.credentialType)
					notify.success(
						`${result.credentialType.replace(/_oauth2|_/gi, ' ').trim()} connected!`,
					);
			} else {
				notify.error(result.error ?? 'OAuth authorization failed.');
			}
		} catch {
			void refetchCredentials();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectedCredentialFields = getCredentialFields(selectedAppForAuth?.credentialType);
	const selectedRequiredFields = getRequiredFields(selectedAppForAuth?.credentialType);
	const selectedAppUsesOAuth = isOAuthCredentialType(selectedAppForAuth?.credentialType);
	const canSubmitConnection =
		Boolean(credentialName.trim()) &&
		(selectedAppUsesOAuth ||
			selectedRequiredFields.every(
				(key) => !isEmptyCredentialValue(credentialFormValues[key]),
			));
	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#f8f9fc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			{/* Ambient decorative blur glows */}
			<div className='pointer-events-none absolute top-[-10%] right-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-primary-400/5 to-primary-400/5 blur-[120px]' />
			<div className='pointer-events-none absolute bottom-[-10%] left-[-10%] -z-10 h-[45%] w-[45%] rounded-full bg-gradient-to-br from-primary-500/5 to-primary-500/0 blur-[120px]' />

			<div className='mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 md:p-10'>
				{/* Header panel */}
				<div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
					<div>
						<h1 className='text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
							Apps
						</h1>
						<p className='mt-1 text-[11px] font-extrabold tracking-widest text-primary-700 uppercase dark:text-primary-400'>
							Integrations Hub
						</p>
						<p className='mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400'>
							Manage your secure API keys and third-party app connections.
						</p>
					</div>

					<button
						onClick={() => setIsConnectModalOpen(true)}
						className='flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-400 px-5 text-xs font-bold text-primary-950 shadow-md shadow-primary-500/10 transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/20 active:scale-95 dark:shadow-none'>
						<Sparkles size={14} className='animate-pulse' />
						<span>Connect App</span>
						<ChevronDown size={14} />
					</button>
				</div>

				{/* Two-Column Grid Content */}
				<div className='grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-12'>
					{/* Left Column (Main App Catalog) */}
					<div className='flex w-full flex-col gap-8 lg:col-span-9'>
						{/* Stats overview row */}
						<div className='grid grid-cols-1 gap-5 sm:grid-cols-3'>
							{/* Card 1: Active Connections */}
							<div className='group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-lg dark:border-zinc-800/80 dark:bg-[#11131c]'>
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
											{activeConnectionsCount}
										</span>
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>connected</span>
									</div>
									<p className='mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
										{activeConnectionsCount > 0
											? 'Apps linked to your workspace'
											: 'No apps connected yet'}
									</p>
								</div>
								<button
									onClick={() => setIsConnectModalOpen(true)}
									className='relative mt-5 h-9 w-full cursor-pointer rounded-xl bg-primary-400 text-[11px] font-extrabold text-primary-950 transition-all hover:bg-primary-500 active:scale-95'>
									Browse Apps
								</button>
							</div>

							{/* Card 2: Available Catalog */}
							<div className='group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-lg dark:border-zinc-800/80 dark:bg-[#11131c]'>
								<Grid className='pointer-events-none absolute -top-4 -right-4 h-24 w-24 text-slate-900/[0.03] dark:text-white/[0.04]' />
								<div className='relative flex items-center gap-3'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'>
										<Grid size={20} className='stroke-[2.2px]' />
									</div>
									<span className='text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-zinc-400'>
										Available Catalog
									</span>
								</div>
								<div className='relative mt-5'>
									<div className='flex items-baseline gap-1.5'>
										<span className='text-4xl font-black tracking-tight text-slate-900 dark:text-white'>
											{isCredentialTypesLoading ? '…' : `${totalIntegrationsCount}+`}
										</span>
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>integrations</span>
									</div>
									<p className='mt-1.5 text-[11px] font-semibold text-slate-400 dark:text-zinc-500'>
										New apps added weekly
									</p>
								</div>
								<button
									onClick={() => setIsConnectModalOpen(true)}
									className='relative mt-5 h-9 w-full cursor-pointer rounded-xl border border-slate-200 text-[11px] font-extrabold text-slate-600 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-800/40'>
									Explore Catalog
								</button>
							</div>

							{/* Card 3: Data Security */}
							<div className='group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-lg dark:border-zinc-800/80 dark:bg-[#11131c]'>
								<ShieldCheck className='pointer-events-none absolute -top-4 -right-4 h-24 w-24 text-slate-900/[0.03] dark:text-white/[0.04]' />
								<div className='relative flex items-center gap-3'>
									<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'>
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
										<span className='text-xs font-semibold text-slate-400 dark:text-zinc-500'>encrypted</span>
									</div>
									<div className='mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500'>
										<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
										<span>End-to-end credential safety</span>
									</div>
								</div>
								<button
									onClick={() =>
										alert(
											'Credentials are securely stored and encrypted in Transit & at Rest using military-grade AES-256.',
										)
									}
									className='relative mt-5 h-9 w-full cursor-pointer rounded-xl border border-slate-200 text-[11px] font-extrabold text-slate-600 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-800/40'>
									Learn More
								</button>
							</div>
						</div>

						{/* Recommended For You Section */}
						<div className='w-full text-left'>
							<div className='mb-4 flex items-center gap-2'>
										<Sparkles size={14} className='text-primary-500' />
										<h2 className='text-slate-450 text-xs font-extrabold tracking-wider uppercase dark:text-zinc-500'>
											Recommended For You
										</h2>
							</div>

							<div className='grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-6'>
								{[
									{
										name: 'OpenAI',
										category: 'AI',
										color: '#10a37f',
										logoBg: 'bg-emerald-50 text-emerald-600',
									},
									{
										name: 'Stripe',
										category: 'Payments',
										color: '#635bff',
										logoBg: 'bg-primary-50 text-primary-600',
									},
									{
										name: 'Slack',
										category: 'Communication',
										color: '#4a154b',
										logoBg: 'bg-primary-50 text-primary-600',
									},
									{
										name: 'Gmail',
										category: 'Email',
										color: '#ea4335',
										logoBg: 'bg-red-50 text-red-600',
									},
									{
										name: 'Discord',
										category: 'Community',
										color: '#5865f2',
										logoBg: 'bg-blue-50 text-blue-600',
									},
									{
										name: 'Notion',
										category: 'Productivity',
										color: '#000000',
										logoBg: 'bg-zinc-100 text-zinc-900',
									},
								].map((rec) => (
									<div
										key={rec.name}
										onClick={() => setIsConnectModalOpen(true)}
										className='group/rec flex cursor-pointer items-center gap-2.5 rounded-2xl border border-slate-200/50 bg-white/70 p-3 shadow-2xs transition-all hover:border-primary-400/35 hover:shadow-xs dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60'>
										<div
											className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold text-white'
											style={{ backgroundColor: rec.color }}>
											{rec.name[0]}
										</div>
										<div className='min-w-0 text-left'>
											<p className='truncate text-[11px] font-extrabold text-slate-900 transition-colors group-hover/rec:text-primary-700 dark:text-white'>
												{rec.name}
											</p>
											<p className='truncate text-[9px] font-semibold text-slate-400 dark:text-zinc-500'>
												{rec.category}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Search & Categories Filter Bar */}
						<div className='flex w-full flex-col gap-4'>
							<div className='group relative flex-1'>
								<Search className='absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400 transition-colors duration-200 group-focus-within:text-primary-700 dark:text-zinc-500' />
								<input
									type='search'
									aria-label='Search integrations'
									placeholder='Search integrations...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className='dark:placeholder:text-zinc-650 block h-12 w-full rounded-2xl border border-slate-200/60 bg-white pr-14 pl-12 text-xs font-bold text-slate-900 shadow-sm transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-primary-400/80 focus:ring-4 focus:ring-primary-400/10 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
								/>
								<div className='pointer-events-none absolute top-3.5 right-4 hidden items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-400 shadow-2xs sm:flex dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-500'>
									⌘K
								</div>
							</div>

							{/* Categories & Sort */}
							<div className='flex w-full flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-zinc-800/40'>
								<div className='no-scrollbar flex shrink-0 gap-2 overflow-x-auto pb-1 md:pb-0'>
									{(
										[
											{ id: 'All', label: 'Popular', emoji: '🔥' },
											{ id: 'Connected', label: 'Recommended', emoji: '⭐' },
											{
												id: 'ConnectedOnly',
												label: 'Connected',
												emoji: '🔗',
											},
											{
												id: 'Productivity',
												label: 'Productivity',
												emoji: '💼',
											},
											{ id: 'Developer', label: 'Developer', emoji: '🛠️' },
											{ id: 'Marketing', label: 'Marketing', emoji: '📢' },
											{
												id: 'Collaboration',
												label: 'Collaboration',
												emoji: '👥',
											},
										] as const
									).map((cat) => {
										// Map ConnectedOnly to Connected view state
										const isActive =
											selectedCategory ===
											(cat.id === 'ConnectedOnly' ? 'Connected' : cat.id);
										return (
											<button
												key={cat.id}
												type='button'
												onClick={() => {
													if (cat.id === 'ConnectedOnly') {
														setSelectedCategory('Connected');
													} else {
														setSelectedCategory(cat.id);
													}
												}}
												className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-xs transition-all duration-200 ${
													isActive
														? 'border border-primary-400 bg-primary-400 font-extrabold text-primary-950 shadow-sm'
														: 'border border-slate-200/60 bg-white font-bold text-slate-600 shadow-xs hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-[#11131c] dark:text-zinc-400 dark:hover:bg-zinc-800/20'
												}`}>
												<span>{cat.emoji}</span>
												<span>{cat.label}</span>
											</button>
										);
									})}
								</div>

								<button
									onClick={() => alert('Sorting updated.')}
									className='flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white px-3.5 text-xs font-extrabold text-primary-700 shadow-xs transition-all hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-[#11131c]'>
									<span>Sort: Popular</span>
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
									className='mt-5 h-10 cursor-pointer rounded-xl bg-primary-400 px-5 text-xs font-bold text-primary-950 shadow-md transition-all active:scale-95'>
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
							</div>
						) : (
							<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'>
								<AnimatePresence mode='popLayout'>
									{filteredApps.map((app) => {
										const IconComponent = app.icon;
										return (
											<motion.article
												key={app.id}
												layout
												initial={{ opacity: 0, scale: 0.96, y: 10 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.96, y: 10 }}
												whileHover={{ y: -6 }}
												transition={{ type: 'spring', stiffness: 350, damping: 25 }}
												className='group relative flex min-h-[248px] flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary-500/30 hover:shadow-lg dark:border-zinc-800/80 dark:bg-[#11131c] dark:hover:border-primary-500/30'>
												{/* Brand glow */}
												<div
													className='pointer-events-none absolute -inset-px -z-10 rounded-3xl opacity-0 blur-md transition-all duration-500 group-hover:opacity-10'
													style={{
														background: `radial-gradient(circle at 30% 0%, ${app.color} 0%, transparent 70%)`,
													}}
												/>

												{/* Header: icon + status */}
												<div className='flex items-start justify-between gap-3'>
													<div
														className='relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner transition-transform duration-300 group-hover:scale-105'
														style={{ backgroundColor: app.color }}>
														<IconComponent className='h-7 w-7 text-white' />
													</div>
													<div className='flex items-center gap-2'>
														{app.isConnected && (
															<span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400'>
																<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
																Active
															</span>
														)}
														<span className='rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-700/50 dark:bg-zinc-800 dark:text-zinc-400'>
															{app.subBadge}
														</span>
													</div>
												</div>

												{/* Name + badges */}
												<div className='mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5'>
													<h3 className='truncate text-base font-extrabold text-slate-900 dark:text-white'>
														{app.name}
													</h3>
													{app.isOAuth && (
														<span className='rounded border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[9px] font-bold text-primary-600 dark:border-primary-900/30 dark:bg-primary-950/20 dark:text-primary-400'>
															OAuth
														</span>
													)}
													{app.isPopular && (
														<span className='rounded border border-red-100/50 bg-red-50 px-1.5 py-0.5 text-[9px] font-extrabold text-red-500 uppercase dark:border-red-900/20 dark:bg-red-950/10'>
															🔥 Popular
														</span>
													)}
													{app.isNew && !app.isPopular && (
														<span className='rounded border border-emerald-100/50 bg-green-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600 uppercase dark:border-green-900/20 dark:bg-green-950/10'>
															✨ New
														</span>
													)}
												</div>

												{/* Description */}
												<p className='mt-2 line-clamp-2 text-xs leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
													{app.description}
												</p>

												{/* Footer */}
												<div className='mt-auto pt-4'>
													<div className='mb-3 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-zinc-500'>
														<div className='flex items-center gap-1'>
															<span className='text-amber-500'>★</span>
															<span className='text-slate-800 dark:text-zinc-200'>{app.rating}</span>
															<span>({app.reviews})</span>
														</div>
														<span>{app.installs} installs</span>
													</div>
													<button
														onClick={() => handleToggleConnection(app.id)}
														disabled={
															createCredentialMutation.isPending ||
															deleteCredentialMutation.isPending ||
															connectOAuthMutation.isPending
														}
														className={`h-10 w-full cursor-pointer rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
															app.isConnected
																? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 hover:border-red-500/25 hover:bg-red-50/50 hover:text-red-500 dark:bg-emerald-500/5 dark:text-emerald-400 dark:hover:bg-red-950/10 dark:hover:text-red-400'
																: 'bg-primary-400 text-primary-950 hover:bg-primary-500'
														}`}>
														{app.isConnected
															? 'Active'
															: isOAuthCredentialType(app.credentialType)
																? 'Authorize'
																: 'Connect'}
													</button>
												</div>
											</motion.article>
										);
									})}
								</AnimatePresence>
							</div>
						)}
					</div>

					{/* Right Column (Sidebar Widgets) */}
					<div className='flex w-full flex-col gap-6 text-left lg:col-span-3'>
						{/* Widget 1: Recent Activity */}
						<div className='rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#11131c]'>
							<div className='mb-4.5 flex items-center justify-between'>
								<h3 className='text-xs font-extrabold tracking-wider text-slate-800 uppercase dark:text-zinc-200'>
									Recent Activity
								</h3>
								<button
									onClick={() => alert('Recent activities opened.')}
									className='text-[10px] font-bold text-primary-700 hover:underline'>
									View all
								</button>
							</div>

							<div className='space-y-4'>
								{[
									{ app: 'Slack connected', time: '2m ago', color: '#4a154b' },
									{
										app: 'Discord authorized',
										time: '10m ago',
										color: '#5865f2',
									},
									{ app: 'API key updated', time: '1h ago', color: '#0f172a' },
									{
										app: 'Microsoft Teams connected',
										time: '2h ago',
										color: '#f25022',
									},
									{
										app: 'Cloudinary connected',
										time: '3h ago',
										color: '#0070f3',
									},
								].map((act, idx) => (
									<div
										key={idx}
										className='flex items-center justify-between gap-3 text-xs'>
										<div className='flex min-w-0 items-center gap-2.5'>
											<div
												className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[8px] font-extrabold text-white'
												style={{ backgroundColor: act.color }}>
												{act.app[0]}
											</div>
											<div className='min-w-0'>
												<p className='truncate leading-tight font-bold text-slate-800 dark:text-zinc-200'>
													{act.app}
												</p>
												<p className='mt-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
													{act.time}
												</p>
											</div>
										</div>
										<div className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500 dark:bg-primary-950/20 dark:text-primary-400'>
											<Check size={11} className='stroke-[3px]' />
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Widget 2: Unlock More Power rocket banner */}
						<div className='relative overflow-hidden rounded-[24px] border border-primary-100 bg-gradient-to-br from-primary-400/10 via-primary-400/5 to-transparent p-5 shadow-xs dark:border-primary-900/10 dark:from-primary-400/5 dark:to-transparent'>
							<div className='pointer-events-none absolute -right-6 -bottom-6 h-16 w-16 opacity-20 select-none'>
								<Sparkles size={64} className='text-primary-700' />
							</div>
							<h3 className='text-xs font-extrabold tracking-wider text-primary-950 uppercase dark:text-primary-400'>
								Unlock More Power
							</h3>
							<p className='mt-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
								Connect more apps to automate workflows and boost agent
								productivity.
							</p>
							<button
								onClick={() => setIsConnectModalOpen(true)}
								className='mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-400 px-3.5 text-[10px] font-extrabold text-primary-950 shadow-xs transition-all hover:bg-primary-500 active:scale-95'>
								<span>Explore Catalog</span>
								<span>→</span>
							</button>
						</div>

						{/* Widget 3: Top Categories */}
						<div className='rounded-[24px] border border-slate-200/60 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-[#11131c]'>
							<h3 className='mb-4 text-xs font-extrabold tracking-wider text-slate-800 uppercase dark:text-zinc-200'>
								Top Categories
							</h3>

							<div className='space-y-3.5 text-[11px] font-bold'>
								{[
									{
										name: 'Communication',
										barColor: 'bg-primary-400',
										count: 24,
										percent: 95,
									},
									{
										name: 'Productivity',
										barColor: 'bg-primary-400',
										count: 18,
										percent: 70,
									},
									{
										name: 'Developer',
										barColor: 'bg-primary-400',
										count: 12,
										percent: 50,
									},
									{
										name: 'Storage',
										barColor: 'bg-primary-400',
										count: 8,
										percent: 30,
									},
									{
										name: 'Marketing',
										barColor: 'bg-primary-400',
										count: 6,
										percent: 20,
									},
								].map((cat, idx) => (
									<div key={idx} className='flex flex-col gap-1.5'>
										<div className='dark:text-zinc-350 flex items-center justify-between text-slate-700'>
											<span>{cat.name}</span>
											<span className='text-slate-400 dark:text-zinc-500'>
												{cat.count}
											</span>
										</div>
										<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800'>
											<div
												className={`${cat.barColor} h-1.5 rounded-full`}
												style={{ width: `${cat.percent}%` }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Connection Popup Dialog Overlay */}
			<AnimatePresence>
				{isConnectModalOpen && (
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 font-sans text-slate-950 backdrop-blur-md dark:bg-black/70 dark:text-zinc-50'>
						{/* STEP 1: AVAILABLE APPS CATALOG */}
						{modalStep === 1 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.96, y: 15 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: 15 }}
								className='relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
								{/* Close button */}
								<button
									aria-label='Close app connection dialog'
									onClick={() => setIsConnectModalOpen(false)}
									className='absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
									<CloseIcon className='h-4.5 w-4.5' />
								</button>

								<div className='flex items-center gap-3.5 pr-10'>
									<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-100/60 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400'>
										<Grid className='h-5 w-5' />
									</div>
									<div className='min-w-0'>
										<div className='flex items-center gap-2'>
											<h2 className='text-lg font-black text-slate-900 dark:text-white'>
												Apps Available
											</h2>
											<span className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'>
												{isCredentialTypesLoading ? '…' : `${totalIntegrationsCount}+`}
											</span>
										</div>
										<p className='mt-0.5 text-xs font-bold text-slate-400 dark:text-zinc-500'>
											Select the app you would like to authenticate with.
										</p>
									</div>
								</div>

								{/* Search available apps */}
								<div className='group relative mt-5'>
									<Search className='absolute top-3.5 left-3.5 h-4 w-4 text-slate-400' />
									<input
										type='text'
										aria-label='Search available apps'
										placeholder='Search integrations...'
										value={modalSearch}
										onChange={(e) => setModalSearch(e.target.value)}
										className='dark:placeholder:text-zinc-650 block h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pr-10 pl-10 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
									/>
									{modalSearch && (
										<button
											aria-label='Clear available apps search'
											onClick={() => setModalSearch('')}
											className='hover:text-slate-650 dark:hover:text-zinc-350 absolute top-3.5 right-3.5 text-slate-400 dark:text-zinc-500'>
											<CloseIcon className='h-4 w-4' />
										</button>
									)}
								</div>

								{/* Available apps grid list */}
								<div className='no-scrollbar mt-4 grid max-h-[350px] grid-cols-1 gap-3 overflow-y-auto border-t border-slate-100 pt-4 pr-1 sm:grid-cols-2 dark:border-zinc-800/40'>
									{isCredentialTypesLoading ? (
										<div className='col-span-full p-6 text-center text-xs font-bold text-slate-400 dark:text-zinc-500'>
											Loading integrations...
										</div>
									) : isCredentialTypesError ? (
										<div className='col-span-full rounded-2xl border border-red-200 bg-red-50/50 p-5 text-center dark:border-red-500/20 dark:bg-red-500/10'>
											<p className='text-xs font-black text-red-700 dark:text-red-300'>
												Could not load integrations.
											</p>
											<button
												type='button'
												onClick={() => void refetchCredentialTypes()}
												className='mt-3 h-8 cursor-pointer rounded-lg bg-white px-4 text-[11px] font-black text-red-700 shadow-xs dark:bg-zinc-900 dark:text-red-300'>
												Retry
											</button>
										</div>
									) : filteredAvailableApps.length === 0 ? (
										<div className='col-span-full p-6 text-center text-xs font-bold text-slate-400 dark:text-zinc-500'>
											No integrations available.
										</div>
									) : (
										filteredAvailableApps.map((availableApp) => (
											<div
												key={availableApp.id}
												className='group/item flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-primary-500/30 hover:bg-white hover:shadow-sm dark:border-zinc-900/30 dark:bg-zinc-950/15 dark:hover:border-primary-500/30 dark:hover:bg-zinc-950/40'>
												<div className='flex gap-3'>
													<div
														className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover/item:scale-105'
														style={{
															backgroundColor: availableApp.color,
														}}>
														{availableApp.icon ? (
															<availableApp.icon className='h-5 w-5' />
														) : (
															<Cloud className='h-5 w-5' />
														)}
													</div>
													<div className='min-w-0 flex-1'>
														<p className='flex flex-wrap items-center gap-1 text-xs font-black text-slate-900 dark:text-white'>
															<span>{availableApp.name}</span>
															{availableApp.isPremium && (
																<span className='border-amber-250 py-0.2 rounded border bg-amber-50 px-1.5 text-[8px] font-black text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400'>
																	Premium
																</span>
															)}
															{isOAuthCredentialType(
																availableApp.credentialType,
															) && (
																<span className='rounded border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[8px] font-black text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400'>
																	OAuth 2.0
																</span>
															)}
														</p>
														<p className='mt-1 line-clamp-2 text-[10px] leading-relaxed font-semibold text-slate-400 dark:text-zinc-500'>
															{availableApp.description}
														</p>
													</div>
												</div>
												<button
													onClick={() => handleConnectClick(availableApp)}
													className='mt-3.5 h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white text-[11px] font-black text-slate-700 transition-all hover:border-primary-400 hover:bg-primary-400 hover:text-primary-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-primary-400 dark:hover:bg-primary-400 dark:hover:text-primary-950'>
													{isOAuthCredentialType(
														availableApp.credentialType,
													)
														? 'Authorize'
														: 'Connect'}
												</button>
											</div>
										))
									)}
								</div>

								{/* Modal Actions Footer */}
								<div className='mt-6 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
									<button
										onClick={() => setIsConnectModalOpen(false)}
										className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-5 text-[11px] font-black transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
										Close
									</button>
								</div>
							</motion.div>
						)}

						{/* STEP 2: CONFIGURE CREDENTIAL */}
						{modalStep === 2 && selectedAppForAuth && (
							<motion.div
								initial={{ opacity: 0, scale: 0.96, y: 15 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: 15 }}
								className='relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
								{/* Close button */}
								<button
									aria-label='Close app connection dialog'
									onClick={() => {
										setIsConnectModalOpen(false);
										setModalStep(1);
										setSelectedAppForAuth(null);
									}}
									className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
									<CloseIcon className='h-4.5 w-4.5' />
								</button>

								<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
									<div
										className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner'
										style={{ backgroundColor: selectedAppForAuth.color }}>
										{selectedAppForAuth.icon ? (
											<selectedAppForAuth.icon className='h-5.5 w-5.5' />
										) : (
											<Cloud className='h-5.5 w-5.5' />
										)}
									</div>
									<div>
										<h2 className='text-md font-black text-slate-900 dark:text-white'>
											Connect {selectedAppForAuth.name}
										</h2>
										<p className='text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
											Configure your secure connection
										</p>
									</div>
								</div>

								{/* Credential Form */}
								<div className='mt-5 space-y-4 text-left'>
									<div>
										<label
											htmlFor='credentialName'
											className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
											Connection Name
										</label>
										<input
											id='credentialName'
											type='text'
											required
											value={credentialName}
											onChange={(e) => setCredentialName(e.target.value)}
											placeholder='e.g., My API Key'
											aria-label='Connection Name'
											className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
										/>
									</div>

									{selectedAppUsesOAuth ? (
										<div className='rounded-2xl border border-primary-500/20 bg-primary-50/60 p-4 text-xs font-semibold text-primary-700 dark:border-primary-500/15 dark:bg-primary-500/10 dark:text-primary-300'>
											OAuth will open in a secure popup. Tokens are created by
											the backend after authorization.
										</div>
									) : (
										Object.entries(selectedCredentialFields).map(
											([fieldKey, field]) => {
												const isRequired =
													selectedRequiredFields.includes(fieldKey);
												const inputId = `credential-field-${fieldKey}`;
												const value = credentialFormValues[fieldKey];

												return (
													<div key={fieldKey}>
														<label
															htmlFor={inputId}
															className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
															{field.label}
															{isRequired ? ' *' : ''}
														</label>
														{field.type === 'boolean' ? (
															<label className='flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200'>
																<input
																	id={inputId}
																	type='checkbox'
																	aria-label={field.label}
																	checked={Boolean(value)}
																	onChange={(e) =>
																		setCredentialFormValues(
																			(prev) => ({
																				...prev,
																				[fieldKey]:
																					e.target
																						.checked,
																			}),
																		)
																	}
																	className='h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500'
																/>
																<span>
																	{field.description ??
																		field.label}
																</span>
															</label>
														) : field.type === 'multiline' ? (
															<textarea
																id={inputId}
																required={isRequired}
																value={String(value ?? '')}
																onChange={(e) =>
																	setCredentialFormValues(
																		(prev) => ({
																			...prev,
																			[fieldKey]:
																				e.target.value,
																		}),
																	)
																}
																placeholder={field.placeholder}
																aria-label={field.label}
																rows={4}
																className='block w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
															/>
														) : (
															<input
																id={inputId}
																type={
																	field.secret
																		? 'password'
																		: field.type === 'number'
																			? 'number'
																			: 'text'
																}
																required={isRequired}
																value={String(value ?? '')}
																onChange={(e) =>
																	setCredentialFormValues(
																		(prev) => ({
																			...prev,
																			[fieldKey]:
																				field.type ===
																				'number'
																					? e.target.value
																					: e.target
																							.value,
																		}),
																	)
																}
																placeholder={field.placeholder}
																aria-label={field.label}
																className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
															/>
														)}
														{field.description &&
															field.type !== 'boolean' && (
																<p className='mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
																	{field.description}
																</p>
															)}
													</div>
												);
											},
										)
									)}

									<div className='mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-zinc-500'>
										<ShieldCheck size={11} className='text-emerald-500' />
										<span>Credentials are encrypted end-to-end.</span>
									</div>
								</div>

								{/* Modal Actions Footer */}
								<div className='mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
									<button
										disabled={isConnecting}
										onClick={() => setModalStep(1)}
										className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4.5 text-[11px] font-black transition-all hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
										Back
									</button>
									<button
										disabled={isConnecting || !canSubmitConnection}
										onClick={handleAuthorize}
										className='flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-[11px] font-black text-primary-950 shadow-md transition-all hover:from-primary-400 hover:to-primary-400 active:scale-95 disabled:pointer-events-none disabled:opacity-40'>
										{isConnecting ? (
											<>
												<svg
													className='h-3.5 w-3.5 animate-spin text-white'
													xmlns='http://www.w3.org/2000/svg'
													fill='none'
													viewBox='0 0 24 24'>
													<circle
														className='opacity-25'
														cx='12'
														cy='12'
														r='10'
														stroke='currentColor'
														strokeWidth='4'
													/>
													<path
														className='opacity-75'
														fill='currentColor'
														d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
													/>
												</svg>
												<span>Connecting...</span>
											</>
										) : (
											<span>Connect</span>
										)}
									</button>
								</div>
							</motion.div>
						)}
					</div>
				)}
			</AnimatePresence>

			{/* Credential Details Dialog Overlay */}
			<AnimatePresence>
				{isDetailModalOpen && selectedCredentialIdForDetail && (
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 font-sans text-slate-950 backdrop-blur-xs dark:bg-black/60 dark:text-zinc-50'>
						<DetailModalContent
							activeWorkspaceId={activeWorkspaceId}
							credentialId={selectedCredentialIdForDetail}
							credentialTypes={credentialTypesData ?? []}
							onClose={() => {
								setIsDetailModalOpen(false);
								setSelectedCredentialIdForDetail(null);
							}}
							onDelete={async (id) => {
								const confirmed = await confirm({
									title: 'Disconnect Credential',
									confirmText: 'Disconnect',
									message:
										'Are you sure you want to disconnect this credential? Any node using it will stop working. This action cannot be undone.',
								});
								if (!confirmed) return;
								await deleteCredentialMutation.mutateAsync(id);
								setIsDetailModalOpen(false);
								setSelectedCredentialIdForDetail(null);
							}}
							onTest={async (id) => {
								await testCredentialMutation.mutateAsync(id);
							}}
							onReconnect={async (credential) => {
								await connectOAuthMutation.mutateAsync({
									credentialType: credential.type,
									credentialId: credential.id,
								});
							}}
							onUpdate={async (id, body) => {
								await updateCredentialMutation.mutateAsync({
									id,
									body,
								});
							}}
							onShare={async (id, isShared) => {
								await shareCredentialMutation.mutateAsync({
									id,
									body: { is_shared: isShared },
								});
							}}
							isDeleting={deleteCredentialMutation.isPending}
							isUpdating={updateCredentialMutation.isPending}
							isTesting={testCredentialMutation.isPending}
							isReconnecting={connectOAuthMutation.isPending}
							isSharing={shareCredentialMutation.isPending}
						/>
					</div>
				)}
			</AnimatePresence>
		</Container>
	);
};

interface IDetailModalContentProps {
	activeWorkspaceId: string;
	credentialId: string;
	credentialTypes: TCredentialType[];
	onClose: () => void;
	onDelete: (id: string) => Promise<void>;
	onUpdate: (id: string, body: IUpdateCredentialDto) => Promise<void>;
	onTest: (id: string) => Promise<void>;
	onReconnect: (credential: ICredentialDetail) => Promise<void>;
	onShare: (id: string, isShared: boolean) => Promise<void>;
	isDeleting: boolean;
	isUpdating: boolean;
	isTesting: boolean;
	isReconnecting: boolean;
	isSharing: boolean;
}

const DetailModalContent = ({
	activeWorkspaceId,
	credentialId,
	credentialTypes,
	onClose,
	onDelete,
	onUpdate,
	onTest,
	onReconnect,
	onShare,
	isDeleting,
	isUpdating,
	isTesting,
	isReconnecting,
	isSharing,
}: IDetailModalContentProps) => {
	const { data: credential, isLoading, isError } = useCredential(activeWorkspaceId, credentialId);

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState('');
	const [editFormValues, setEditFormValues] = useState<TCredentialData>({});

	if (isLoading) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative flex min-h-[200px] w-full max-w-md flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<svg
					className='h-7 w-7 animate-spin text-primary-600'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
					viewBox='0 0 24 24'>
					<circle
						className='opacity-25'
						cx='12'
						cy='12'
						r='10'
						stroke='currentColor'
						strokeWidth='4'
					/>
					<path
						className='opacity-75'
						fill='currentColor'
						d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
					/>
				</svg>
				<p className='mt-3 text-xs font-bold text-slate-500 dark:text-zinc-400'>
					Loading connection details...
				</p>
			</motion.div>
		);
	}

	if (isError || !credential) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				<button
					onClick={onClose}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>
				<h3 className='text-red-650 text-sm font-black'>Failed to load connection</h3>
				<p className='mt-2 text-xs font-semibold text-slate-400'>
					There was a problem retrieving the details for this connection.
				</p>
			</motion.div>
		);
	}

	const credentialType = credentialTypes.find((type) => type.type === credential.type);
	const isKnownCredentialType = Boolean(credentialType);
	const credentialFields = credentialType ? getCredentialFields(credentialType) : {};
	const requiredFields = credentialType ? getRequiredFields(credentialType) : [];
	const usesOAuth = isOAuthCredentialType(credentialType);
	const canSaveEdit =
		isKnownCredentialType &&
		Boolean(editName.trim()) &&
		(usesOAuth ||
			requiredFields.every((key) => {
				const field = credentialFields[key];
				if (field?.secret) return true;
				return !isEmptyCredentialValue(editFormValues[key]);
			}));

	if (isEditing) {
		return (
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				className='relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
				{/* Close button */}
				<button
					aria-label='Close connection details'
					onClick={onClose}
					className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
					<CloseIcon className='h-4.5 w-4.5' />
				</button>

				<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
					<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-400 text-primary-950 shadow-inner'>
						<Key className='h-5 w-5' />
					</div>
					<div>
						<h2 className='text-md font-black text-slate-900 dark:text-white'>
							Edit Connection
						</h2>
						<p className='text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
							Update your connection configuration
						</p>
					</div>
				</div>

				{/* Edit Form */}
				<div className='mt-5 space-y-4 text-left'>
					<div>
						<label
							htmlFor='editName'
							className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
							Connection Name
						</label>
						<input
							id='editName'
							type='text'
							required
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							placeholder='e.g., My Updated Connection'
							aria-label='Connection Name'
							className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
						/>
					</div>

					{usesOAuth ? (
						<div className='rounded-2xl border border-primary-500/20 bg-primary-50/60 p-4 text-xs font-semibold text-primary-700 dark:border-primary-500/15 dark:bg-primary-500/10 dark:text-primary-300'>
							OAuth token fields are managed by the backend. Use reconnect to
							re-authorize this account.
						</div>
					) : (
						Object.entries(credentialFields).map(([fieldKey, field]) => {
							const inputId = `edit-credential-field-${fieldKey}`;
							const value = editFormValues[fieldKey];

							return (
								<div key={fieldKey}>
									<label
										htmlFor={inputId}
										className='mb-1.5 block text-[10px] font-black tracking-wider text-slate-500 uppercase dark:text-zinc-400'>
										{field.label}
										{field.secret ? ' (optional)' : ''}
									</label>
									{field.type === 'boolean' ? (
										<label className='flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200'>
											<input
												id={inputId}
												type='checkbox'
												aria-label={field.label}
												checked={Boolean(value)}
												onChange={(e) =>
													setEditFormValues((prev) => ({
														...prev,
														[fieldKey]: e.target.checked,
													}))
												}
												className='h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500'
											/>
											<span>{field.description ?? field.label}</span>
										</label>
									) : field.type === 'multiline' ? (
										<textarea
											id={inputId}
											value={String(value ?? '')}
											onChange={(e) =>
												setEditFormValues((prev) => ({
													...prev,
													[fieldKey]: e.target.value,
												}))
											}
											placeholder={
												field.secret
													? 'Leave blank to keep existing value'
													: field.placeholder
											}
											aria-label={field.label}
											rows={4}
											className='block w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
										/>
									) : (
										<input
											id={inputId}
											type={
												field.secret
													? 'password'
													: field.type === 'number'
														? 'number'
														: 'text'
											}
											value={String(value ?? '')}
											onChange={(e) =>
												setEditFormValues((prev) => ({
													...prev,
													[fieldKey]: e.target.value,
												}))
											}
											placeholder={
												field.secret
													? 'Leave blank to keep existing value'
													: field.placeholder
											}
											aria-label={field.label}
											className='block h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-semibold text-slate-900 transition-all outline-none placeholder:text-slate-400 focus:border-primary-500/80 focus:bg-white focus:ring-4 focus:ring-primary-500/10 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-primary-500 dark:focus:ring-primary-500/15'
										/>
									)}
									{field.secret && (
										<p className='mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
											Leave blank to keep the existing value.
										</p>
									)}
								</div>
							);
						})
					)}
				</div>

				{/* Actions Footer */}
				<div className='mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
					<button
						disabled={isUpdating}
						onClick={() => setIsEditing(false)}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4.5 text-[11px] font-black transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
						Cancel
					</button>
					<button
						disabled={isUpdating || !canSaveEdit}
						onClick={async () => {
							await onUpdate(credential.id, {
								name: editName.trim(),
								...(usesOAuth
									? {}
									: {
											data: buildEditCredentialData(
												credentialFields,
												editFormValues,
											),
										}),
							});
							setIsEditing(false);
						}}
						className='flex h-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-primary-400 to-primary-400 px-5 text-[11px] font-black text-primary-950 shadow-md transition-all hover:from-primary-400 hover:to-primary-400 active:scale-95 disabled:pointer-events-none disabled:opacity-40'>
						{isUpdating ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</motion.div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.96, y: 15 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96, y: 15 }}
			className='relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-zinc-800/80 dark:bg-[#11131c]'>
			{/* Close button */}
			<button
				aria-label='Close connection details'
				onClick={onClose}
				className='hover:text-slate-650 absolute top-4 right-4 cursor-pointer rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'>
				<CloseIcon className='h-4.5 w-4.5' />
			</button>

			<div className='flex items-center gap-3.5 border-b border-slate-100 pb-4 dark:border-zinc-800/40'>
				<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-400 text-primary-950 shadow-inner'>
					<Key className='h-5 w-5' />
				</div>
				<div>
					<h2 className='text-md font-black text-slate-900 dark:text-white'>
						{credential.name}
					</h2>
					<p className='text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
						{usesOAuth ? 'OAuth 2.0 Connection' : 'API Key Connection'}
					</p>
				</div>
			</div>

			<div className='mt-5 space-y-4 text-left'>
				<div className='grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-900/30 dark:bg-zinc-950/15'>
					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Type
						</span>
						<span className='mt-1 inline-block rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'>
							{credential.type}
						</span>
					</div>

					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Auth Method
						</span>
						<span
							className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${usesOAuth ? 'border border-primary-500/20 bg-primary-50 text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400' : 'border border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
							{usesOAuth ? 'OAuth 2.0' : 'API Key'}
						</span>
					</div>

					{credential.provider && (
						<div>
							<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Provider
							</span>
							<span className='mt-1 inline-block text-xs font-semibold text-slate-800 capitalize dark:text-zinc-200'>
								{credential.provider}
							</span>
						</div>
					)}

					<div>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Sharing
						</span>
						<span
							className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xs font-bold ${credential.is_shared ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'border border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}>
							{credential.is_shared ? 'Shared with workspace' : 'Private'}
						</span>
					</div>

					<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
						<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
							Created At
						</span>
						<span className='text-slate-850 mt-0.5 text-xs font-semibold dark:text-zinc-200'>
							{new Date(credential.created_at).toLocaleString()}
						</span>
					</div>

					{credential.expires_at && (
						<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
							<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Expires At
							</span>
							<span className='text-slate-850 mt-0.5 text-xs font-semibold dark:text-zinc-200'>
								{new Date(credential.expires_at).toLocaleString()}
							</span>
						</div>
					)}

					{Object.entries(credential.data ?? {}).length > 0 && (
						<div className='col-span-2 border-t border-slate-100 pt-3 dark:border-zinc-800/40'>
							<span className='block text-[10px] font-black tracking-wider text-slate-400 uppercase dark:text-zinc-500'>
								Fields
							</span>
							<div className='mt-2 space-y-2'>
								{Object.entries(credential.data ?? {}).map(([fieldKey, value]) => {
									const field = credentialFields[fieldKey];
									const isSecret =
										field?.secret || value === MASKED_CREDENTIAL_VALUE;
									return (
										<div
											key={fieldKey}
											className='flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-2 text-xs dark:bg-zinc-900'>
											<span className='font-bold text-slate-500 dark:text-zinc-400'>
												{field?.label ?? fieldKey}
											</span>
											<span className='max-w-[180px] truncate font-semibold text-slate-800 dark:text-zinc-200'>
												{isSecret ? '••••••••••••' : String(value ?? '')}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
				{!isKnownCredentialType && (
					<div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300'>
						This credential type is not available in the current API catalog. Testing
						and editing are disabled until the backend returns this type.
					</div>
				)}
			</div>

			<div className='mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-zinc-800/60'>
				{/* Left: Close */}
				<button
					disabled={isDeleting || isTesting}
					onClick={onClose}
					className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-[11px] font-black transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'>
					Close
				</button>

				{/* Right: Actions */}
				<div className='flex flex-wrap items-center justify-end gap-2'>
					<button
						disabled={isDeleting || isTesting || !isKnownCredentialType}
						onClick={() => {
							if (!isKnownCredentialType) {
								notify.error(
									'Credential type is not available in the API catalog.',
								);
								return;
							}
							onTest(credential.id);
						}}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-[11px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						{isTesting ? 'Testing...' : 'Test'}
					</button>
					{usesOAuth && (
						<button
							disabled={isDeleting || isTesting || isReconnecting}
							onClick={() => onReconnect(credential)}
							className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-[11px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
							{isReconnecting ? 'Reconnecting...' : 'Reconnect'}
						</button>
					)}
					<button
						disabled={isDeleting || isTesting || !isKnownCredentialType}
						onClick={() => {
							if (credential) {
								setEditName(credential.name);
								setEditFormValues(createEditFormValues(credential, credentialType));
							}
							setIsEditing(true);
						}}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-[11px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						Edit
					</button>
					<button
						disabled={isDeleting || isTesting || isSharing}
						onClick={() => onShare(credential.id, !credential.is_shared)}
						className='h-10 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-[11px] font-black text-slate-700 transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						{isSharing ? 'Updating...' : credential.is_shared ? 'Unshare' : 'Share'}
					</button>
					{/* Divider before destructive action */}
					<div className='mx-1 h-6 w-px bg-slate-200 dark:bg-zinc-700' />
					<button
						disabled={isDeleting || isTesting}
						onClick={() => onDelete(credential.id)}
						className='flex h-10 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-4 text-[11px] font-black text-white shadow-sm transition-all hover:bg-red-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40'>
						{isDeleting ? 'Disconnecting...' : 'Disconnect'}
					</button>
				</div>
			</div>
		</motion.div>
	);
};

export default AppsListPage;
