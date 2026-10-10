import {
	Briefcase,
	Code2,
	Folder,
	LayoutGrid,
	Link2,
	Megaphone,
	MessageSquare,
	Plug,
} from 'lucide-react';
import Github from '@/components/icon/huge/Github';
import Slack from '@/components/icon/huge/Slack';
import Mail01 from '@/components/icon/huge/Mail01';
import GoogleDrive from '@/components/icon/huge/GoogleDrive';
import GoogleSheet from '@/components/icon/huge/GoogleSheet';
import GoogleDoc from '@/components/icon/huge/GoogleDoc';
import Calendar03 from '@/components/icon/huge/Calendar03';
import type {
	TConnector,
	TConnectorCredential,
	TConnectorData,
	TConnectorDataValue,
	TConnectorField,
} from '@/types/connector.type';
import type { IAvailableApp, SvgIconComponent } from '../_types/apps.type';

/** The backend names an icon (`connectors.icon`); this is the one place it becomes a component. */
const CONNECTOR_ICONS: Record<string, SvgIconComponent> = {
	github: Github,
	slack: Slack,
	mail: Mail01,
	drive: GoogleDrive,
	sheets: GoogleSheet,
	docs: GoogleDoc,
	calendar: Calendar03,
};

/** The backend names each category's icon (`ConnectorCategory::icon()`). */
const CATEGORY_ICONS: Record<string, SvgIconComponent> = {
	message: MessageSquare,
	briefcase: Briefcase,
	folder: Folder,
	code: Code2,
	megaphone: Megaphone,
	grid: LayoutGrid,
};

/** Icons for the two tabs that aren't backend categories. */
export const ALL_APPS_ICON: SvgIconComponent = LayoutGrid;
export const CONNECTED_ICON: SvgIconComponent = Link2;

/** Used only when the backend sends no colour at all. */
const FALLBACK_COLOR = '#6D28D9';

export const connectorToApp = (connector: TConnector): IAvailableApp => ({
	id: connector.key,
	name: connector.name,
	description: connector.description ?? '',
	icon: (connector.icon && CONNECTOR_ICONS[connector.icon]) || Plug,
	color: connector.color ?? FALLBACK_COLOR,
	category: connector.category,
	categoryLabel: connector.category_label,
	categoryIcon: CATEGORY_ICONS[connector.category_icon] ?? LayoutGrid,
	isFeatured: connector.is_featured,
	sortOrder: connector.sort_order,
	connector,
});

/** Categories in catalog order, each listed once. */
export const catalogCategories = (apps: IAvailableApp[]) => {
	const seen = new Map<string, { id: string; label: string; icon: SvgIconComponent }>();
	for (const app of apps) {
		if (!seen.has(app.category))
			seen.set(app.category, {
				id: app.category,
				label: app.categoryLabel,
				icon: app.categoryIcon,
			});
	}
	return [...seen.values()];
};

export const matchesCredentialForApp = (credential: TConnectorCredential, app: IAvailableApp) =>
	Boolean(app.connector) && String(credential.connector_id) === String(app.connector!.id);

export const isOAuthCredentialType = (connector?: TConnector | null) =>
	Boolean(connector?.is_oauth);

/**
 * `connector.fields` arrives as an array of field descriptors, but the forms
 * are written against a keyed map. A manual connector with no fields has
 * nothing to collect, and the forms say so rather than inventing one.
 */
export const getCredentialFields = (
	connector?: TConnector | null,
): Record<string, TConnectorField> =>
	Object.fromEntries((connector?.fields ?? []).map((field) => [field.name, field]));

export const getRequiredFields = (connector?: TConnector | null) =>
	(connector?.fields ?? []).filter((field) => field.required).map((field) => field.name);

/** A manual connector the backend defined without a form can't be connected. */
export const hasNoCredentialForm = (connector?: TConnector | null) =>
	Boolean(connector) && !isOAuthCredentialType(connector) && !connector!.fields?.length;

export const isEmptyCredentialValue = (value: TConnectorDataValue | undefined) =>
	value === undefined || value === null || value === '';

const coerceCredentialFieldValue = (
	field: TConnectorField,
	value: TConnectorDataValue | undefined,
): TConnectorDataValue | undefined => {
	if (field.type === 'boolean') return Boolean(value);
	if (isEmptyCredentialValue(value)) return undefined;
	if (field.type === 'number') {
		const numberValue = Number(value);
		return Number.isFinite(numberValue) ? numberValue : undefined;
	}
	return String(value);
};

export const buildCreateCredentialData = (
	fields: Record<string, TConnectorField>,
	formValues: TConnectorData,
) => {
	const data: TConnectorData = {};

	for (const [key, field] of Object.entries(fields)) {
		const value = coerceCredentialFieldValue(field, formValues[key]);
		if (value !== undefined) data[key] = value;
	}

	return data;
};

/**
 * This backend never returns `data`, so there is no masked value to echo back
 * and `PATCH` replaces the payload wholesale. Only genuinely filled fields go
 * up — and the caller omits `data` entirely when nothing was filled, rather
 * than blanking the stored secret.
 */
export const buildEditCredentialData = buildCreateCredentialData;

export const createInitialFormValues = (connector?: TConnector | null) =>
	Object.fromEntries(
		Object.entries(getCredentialFields(connector)).map(([key, field]) => [
			key,
			field.type === 'boolean' ? false : '',
		]),
	) as TConnectorData;

/** Secrets never come back from the API, so an edit always starts blank. */
export const createEditFormValues = createInitialFormValues;
