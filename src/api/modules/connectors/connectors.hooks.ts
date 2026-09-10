import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
	TCreateConnectorCredentialDto,
	TUpdateConnectorCredentialDto,
	TInitiateOAuthConnectorDto,
} from '@/types/connector.type';
import { ConnectorService } from './connectors.service';
import { connectorKeys, connectorCredentialKeys } from './connectors.keys';

export const useConnectors = () =>
	useQuery({
		queryKey: connectorKeys.lists(),
		queryFn: ({ signal }) => ConnectorService.list(signal),
		staleTime: 30 * 60_000,
	});

export const useConnector = (id: string) =>
	useQuery({
		queryKey: connectorKeys.detail(id),
		queryFn: ({ signal }) => ConnectorService.detail(id, signal),
		enabled: !!id,
		staleTime: 30 * 60_000,
	});

export const useConnectorCredentials = (ws: string) =>
	useQuery({
		queryKey: connectorCredentialKeys.list(ws),
		queryFn: ({ signal }) => ConnectorService.credentials(ws, signal),
		enabled: !!ws,
	});

export const useConnectorCredential = (ws: string, id: string) =>
	useQuery({
		queryKey: connectorCredentialKeys.detail(ws, id),
		queryFn: ({ signal }) => ConnectorService.credential(ws, id, signal),
		enabled: !!ws && !!id,
	});

export const useCreateConnectorCredential = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (payload: TCreateConnectorCredentialDto) =>
			ConnectorService.createCredential(ws, payload),
		onSuccess: () => qc.invalidateQueries({ queryKey: connectorCredentialKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to create connector credential' },
	});
};

export const useUpdateConnectorCredential = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: string; body: TUpdateConnectorCredentialDto }) =>
			ConnectorService.updateCredential(ws, id, body),
		onSuccess: (_cred, { id }) => {
			qc.invalidateQueries({ queryKey: connectorCredentialKeys.lists(ws) });
			qc.invalidateQueries({ queryKey: connectorCredentialKeys.detail(ws, id) });
		},
		meta: { errorMessage: 'Failed to update connector credential' },
	});
};

export const useDeleteConnectorCredential = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => ConnectorService.deleteCredential(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: connectorCredentialKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to delete connector credential' },
	});
};

export const useSetDefaultConnectorCredential = (ws: string) => {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => ConnectorService.setDefaultCredential(ws, id),
		onSuccess: () => qc.invalidateQueries({ queryKey: connectorCredentialKeys.lists(ws) }),
		meta: { errorMessage: 'Failed to set default credential' },
	});
};

export const useInitiateOAuthConnector = (ws: string) =>
	useMutation({
		mutationFn: (payload: TInitiateOAuthConnectorDto) => ConnectorService.initiateOAuth(ws, payload),
		meta: { errorMessage: 'Failed to start connector authorization' },
	});
