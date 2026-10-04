import type { TWorkspaceRole } from '@/types/workspace.type';
import type { TConnector } from '@/types/connector.type';

export type TOnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IOnboardingData {
	avatarUrl: string | null;
	workspaceName: string;
	workspaceSlug: string;
	workspaceCreated: boolean;
	createdWorkspaceId: string;
	inviteEmails: string;
	inviteRole: TWorkspaceRole;
	inviteMessage: string;
	invitesSent: boolean;
	selectedRoleIndex: number | null;
	selectedJobRole: string;
	selectedPlan: string;
	appSearch: string;
	connectedApps: string[];
	selectedAppForAuth: TConnector | null;
	authSuccess: boolean;
	selectedSurvey: string | null;
}

export interface IRoleData {
	name: string;
	description: string;
	apps: string[];
}

export interface IPlan {
	id: string;
	name: string;
	price: string;
	period: string;
	features: string[];
	badge?: string;
	highlighted?: boolean;
}
