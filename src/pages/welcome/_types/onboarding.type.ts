import type { TWorkspaceRole } from '@/types/workspace.type';
import type { TConnector } from '@/types/connector.type';
import type { TTemplateCatalogItem, TTemplateType } from '@/types/template.type';

export type TOnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface IOnboardingData {
	workspaceName: string;
	workspaceSlug: string;
	workspaceCreated: boolean;
	createdWorkspaceId: string;
	inviteEmails: string;
	inviteRole: TWorkspaceRole;
	inviteMessage: string;
	invitesSent: boolean;
	selectedJobRole: string;
	selectedPlan: string;
	appSearch: string;
	connectedApps: string[];
	selectedAppForAuth: TConnector | null;
	authSuccess: boolean;
	selectedSurvey: string | null;
	templateSearch: string;
	/** The type chip that's on; `all` shows every type. */
	templateType: TTemplateType | 'all';
	/** The card picked on the template step; Continue creates it. */
	selectedTemplate: TTemplateCatalogItem | null;
	/** The template Continue already created, and what finishing onboarding should open. */
	createdFromTemplate: {
		templateId: string;
		opens: { type: 'workflow' | 'agent'; id: string } | null;
	} | null;
}
