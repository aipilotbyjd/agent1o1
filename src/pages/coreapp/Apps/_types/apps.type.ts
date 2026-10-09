import type { ReactNode, SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { TConnector, TConnectorCredential } from '@/types/connector.type';

export type SvgIconComponent = LucideIcon | ((props: SVGProps<SVGSVGElement>) => ReactNode);

export interface IAvailableApp {
	id: string;
	name: string;
	description: string;
	icon: SvgIconComponent;
	color: string;
	/** `ConnectorCategory` value from the backend. */
	category: string;
	categoryLabel: string;
	categoryIcon: SvgIconComponent;
	isFeatured: boolean;
	sortOrder: number;
	connector?: TConnector;
	credentials?: TConnectorCredential[];
}

/** A catalog app joined with the workspace's accounts for it. */
export interface IConnectedApp extends IAvailableApp {
	isConnected: boolean;
	isExpired: boolean;
	isOAuth: boolean;
	credentials: TConnectorCredential[];
}
