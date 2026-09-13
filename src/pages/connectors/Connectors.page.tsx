import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
	useConnectors,
	useConnectorCredentials,
	useCreateConnectorCredential,
	useDeleteConnectorCredential,
	useSetDefaultConnectorCredential,
	useInitiateOAuthConnector,
	connectorOAuthRedirectUri,
} from '@/api/modules/connectors';
import { apiConfig, notify } from '@/api/core';
import { useWorkspaceId } from '@/context/workspaceContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Modal, { ModalBody, ModalFooter, ModalFooterChild, ModalHeader } from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import DataTable, { TColumn } from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatRelative, humanize } from '@/utils/format.util';
import getFirstLetterUtil from '@/utils/getFirstLetter.util';
import ConnectCredentialModalPart from './_parts/ConnectCredentialModal.part';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';

// ============================================================
// Connectors
// ------------------------------------------------------------
// The integration catalog and this workspace's stored credentials
// for it.
//
// OAuth connectors can't be completed in this app: the code-for-
// token exchange needs the client secret, so the provider redirects
// to the backend's own callback, which answers with JSON rather
// than bouncing back here. The flow therefore runs in a popup and
// this page polls its credential list until the new one appears —
// the user stays on this screen throughout, and the JSON response
// stays inside a window they never have to read.
//
// A real redirect back into the app would be better, but that is a
// backend change (the callback would have to 302 to the stored
// `redirect_uri`), not something the client can arrange.
// ============================================================

/** How often to re-check for the credential while the popup is open. */
const OAUTH_POLL_MS = 2_500;

/** Give up watching after this long — the popup may have been abandoned
 *  on the provider's consent screen, and polling forever is a leak. */
const OAUTH_TIMEOUT_MS = 3 * 60_000;

const ConnectorsPage = () => {
	useDocumentTitle({ name: 'Connectors' });

	const ws = useWorkspaceId();
	const { data: connectors, isLoading: isCatalogLoading } = useConnectors();
	const {
		data: credentials,
		isLoading: isCredentialsLoading,
		refetch: refetchCredentials,
	} = useConnectorCredentials(ws);

	const createCredential = useCreateConnectorCredential(ws);
	const deleteCredential = useDeleteConnectorCredential(ws);
	const setDefault = useSetDefaultConnectorCredential(ws);
	const initiateOAuth = useInitiateOAuthConnector(ws);

	const [manualConnector, setManualConnector] = useState<TConnector | null>(null);
	const [oauthConnector, setOauthConnector] = useState<TConnector | null>(null);
	const [oauthName, setOauthName] = useState('');
	const [pendingDelete, setPendingDelete] = useState<TConnectorCredential | null>(null);

	// Set while a provider popup is open, so the page can poll for the
	// credential the backend will create out of band.
	const [isAwaitingOAuth, setIsAwaitingOAuth] = useState(false);
	const popupRef = useRef<Window | null>(null);
	const credentialCountRef = useRef(0);

	useEffect(() => {
		if (!isAwaitingOAuth) return undefined;

		const startedAt = Date.now();
		const timer = setInterval(() => {
			const popupClosed = popupRef.current?.closed ?? true;
			const timedOut = Date.now() - startedAt > OAUTH_TIMEOUT_MS;

			void refetchCredentials().then((result) => {
				const count = result.data?.length ?? 0;
				if (count > credentialCountRef.current) {
					setIsAwaitingOAuth(false);
					popupRef.current?.close();
					notify.success('Connector connected.');
				}
			});

			if (popupClosed || timedOut) setIsAwaitingOAuth(false);
		}, OAUTH_POLL_MS);

		return () => clearInterval(timer);
	}, [isAwaitingOAuth, refetchCredentials]);

	const onStartOAuth = async () => {
		if (!oauthConnector || !oauthName.trim()) return;

		const result = await initiateOAuth.mutateAsync({
			connector_id: oauthConnector.id,
			name: oauthName.trim(),
			redirect_uri: connectorOAuthRedirectUri(apiConfig.baseUrl),
		});

		credentialCountRef.current = credentials?.length ?? 0;
		popupRef.current = window.open(
			result.authorize_url,
			'connector-oauth',
			'width=600,height=760',
		);
		setOauthConnector(null);
		setOauthName('');
		setIsAwaitingOAuth(true);
	};

	const onCreateManual = async (payload: {
		name: string;
		data: Record<string, unknown>;
		scope: 'team' | 'personal';
	}) => {
		if (!manualConnector) return;
		await createCredential.mutateAsync({
			connector_id: manualConnector.id,
			name: payload.name,
			data: payload.data,
			scope: payload.scope,
		});
		setManualConnector(null);
	};

	// Modal wants a state setter, but the modal's existence is derived from
	// which connector is selected — so closing is the only transition to map.
	const setOAuthModalOpen: Dispatch<SetStateAction<boolean>> = (next) => {
		const open = typeof next === 'function' ? next(!!oauthConnector) : next;
		if (!open) setOauthConnector(null);
	};

	const columns: TColumn<TConnectorCredential>[] = [
		{
			key: 'name',
			header: 'Name',
			cell: (credential) => (
				<div className='flex items-center gap-2'>
					<span className='font-medium'>{credential.name}</span>
					{credential.is_default && (
						<Badge color='primary' variant='soft' rounded='rounded-full'>
							Default
						</Badge>
					)}
					{credential.is_expired && (
						<Badge color='red' variant='soft' rounded='rounded-full'>
							Expired
						</Badge>
					)}
				</div>
			),
		},
		{
			key: 'connector',
			header: 'Integration',
			className: 'text-zinc-500',
			cell: (credential) =>
				credential.connector?.name ?? `Connector #${credential.connector_id}`,
		},
		{
			key: 'scope',
			header: 'Scope',
			cell: (credential) => (
				<Badge color='zinc' variant='soft' rounded='rounded-full'>
					{humanize(credential.scope)}
				</Badge>
			),
		},
		{
			key: 'last_used',
			header: 'Last used',
			className: 'text-zinc-500',
			cell: (credential) => formatRelative(credential.last_used_at),
		},
		{
			key: 'actions',
			header: '',
			className: 'text-right',
			cell: (credential) => (
				<div className='flex justify-end gap-2'>
					{!credential.is_default && (
						<Button
							variant='outline'
							color='zinc'
							dimension='sm'
							isDisable={setDefault.isPending}
							onClick={() => setDefault.mutate(credential.id)}>
							Make default
						</Button>
					)}
					<Button
						variant='outline'
						color='red'
						dimension='sm'
						icon='Delete02'
						aria-label={`Delete ${credential.name}`}
						onClick={() => setPendingDelete(credential)}
					/>
				</div>
			),
		},
	];

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<span className='text-lg font-semibold'>Connectors</span>
					<span className='text-zinc-500'>{credentials?.length ?? 0} connected</span>
				</SubheaderLeft>
				<SubheaderRight>
					{isAwaitingOAuth && (
						<Badge color='blue' variant='soft' rounded='rounded-full'>
							Waiting for provider…
						</Badge>
					)}
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-4'>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Connected</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<DataTable
								columns={columns}
								rows={credentials}
								rowKey={(credential) => credential.id}
								isLoading={isCredentialsLoading}
								skeletonRows={3}
								empty={
									<EmptyState
										icon='PlugSocket'
										title='No integrations connected'
										description='Connect one below and its nodes become available to your workflows.'
									/>
								}
							/>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>Available</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							{isCatalogLoading && (
								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
									<Skeleton className='h-28 w-full' />
									<Skeleton className='h-28 w-full' />
									<Skeleton className='h-28 w-full' />
								</div>
							)}

							{!isCatalogLoading && (
								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
									{(connectors ?? [])
										.filter((connector) => connector.is_active)
										.map((connector) => {
											const connectedCount = (credentials ?? []).filter(
												(credential) =>
													String(credential.connector_id) ===
													String(connector.id),
											).length;

											return (
												<div
													key={connector.id}
													className='flex gap-3 rounded-2xl border border-zinc-500/25 p-4'>
													<span
														className='flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white'
														style={{
															backgroundColor:
																connector.color ?? '#71717b',
														}}>
														{getFirstLetterUtil(connector.name, 1)}
													</span>
													<div className='min-w-0 grow'>
														<div className='flex items-center gap-2'>
															<span className='truncate font-semibold'>
																{connector.name}
															</span>
															{connectedCount > 0 && (
																<Badge
																	color='emerald'
																	variant='soft'
																	rounded='rounded-full'>
																	{connectedCount}
																</Badge>
															)}
														</div>
														<p className='mt-1 line-clamp-2 text-sm text-zinc-500'>
															{connector.description}
														</p>
														<Button
															variant='outline'
															color='zinc'
															dimension='sm'
															className='mt-3'
															onClick={() =>
																connector.is_oauth
																	? setOauthConnector(connector)
																	: setManualConnector(connector)
															}>
															{connectedCount > 0
																? 'Add another'
																: 'Connect'}
														</Button>
													</div>
												</div>
											);
										})}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			</Container>

			{/* OAuth needs a name before the redirect, because the credential
			    is created by the backend while the user is away. */}
			<Modal isOpen={!!oauthConnector} setIsOpen={setOAuthModalOpen} rounded='rounded-2xl'>
				<ModalHeader>Connect {oauthConnector?.name}</ModalHeader>
				<ModalBody>
					<Label htmlFor='oauth-name'>Name this connection</Label>
					<Input
						id='oauth-name'
						name='oauth-name'
						value={oauthName}
						placeholder={`e.g. ${oauthConnector?.name ?? ''} — production`}
						onChange={(event) => setOauthName(event.target.value)}
					/>
					<p className='mt-3 text-sm text-zinc-500'>
						You&apos;ll be sent to {oauthConnector?.name} in a new window to approve
						access. This page updates once it&apos;s done.
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='zinc'
							onClick={() => setOauthConnector(null)}>
							Cancel
						</Button>
						<Button
							variant='solid'
							isLoading={initiateOAuth.isPending}
							isDisable={!oauthName.trim() || initiateOAuth.isPending}
							onClick={() => void onStartOAuth()}>
							Continue
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<ConnectCredentialModalPart
				connector={manualConnector}
				isOpen={!!manualConnector}
				onClose={() => setManualConnector(null)}
				isPending={createCredential.isPending}
				onSubmit={(payload) => void onCreateManual(payload)}
			/>

			<ConfirmDialog
				isOpen={!!pendingDelete}
				onClose={() => setPendingDelete(null)}
				title={`Delete “${pendingDelete?.name}”?`}
				description='Workflows and agents using this credential will start failing. This cannot be undone.'
				isPending={deleteCredential.isPending}
				onConfirm={() => {
					if (!pendingDelete) return;
					deleteCredential.mutate(pendingDelete.id, {
						onSuccess: () => setPendingDelete(null),
					});
				}}
			/>
		</>
	);
};

export default ConnectorsPage;
