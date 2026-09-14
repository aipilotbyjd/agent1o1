import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { IOnboardingData, TOnboardingStep } from '../_types/onboarding.type';
import type { TWorkspaceRole } from '@/types/workspace.type';

interface IOnboardingState extends IOnboardingData {
	currentStep: TOnboardingStep;
}

type TOnboardingAction =
	| { type: 'SET_STEP'; payload: TOnboardingStep }
	| { type: 'SET_FIELD'; payload: Partial<IOnboardingData> };

const initialState: IOnboardingState = {
	currentStep: 0,
	avatarUrl: null,
	workspaceName: '',
	workspaceSlug: '',
	workspaceCreated: false,
	createdWorkspaceId: '',
	inviteEmails: '',
	inviteRole: 'member' as TWorkspaceRole,
	inviteMessage:
		"Just set up our Agent1o1 workspace — jump in when you're ready. Excited to build together.",
	invitesSent: false,
	selectedRoleIndex: null,
	selectedJobRole: '',
	selectedPlan: 'free',
	appSearch: '',
	connectedApps: ['GitHub'],
	selectedAppForAuth: null,
	workspaceInput: '',
	isAuthenticating: false,
	authSuccess: false,
	selectedSurvey: null,
};

function onboardingReducer(state: IOnboardingState, action: TOnboardingAction): IOnboardingState {
	switch (action.type) {
		case 'SET_STEP':
			return { ...state, currentStep: action.payload };
		case 'SET_FIELD':
			return { ...state, ...action.payload };
		default:
			return state;
	}
}

interface IOnboardingStoreContext {
	state: IOnboardingState;
	dispatch: React.Dispatch<TOnboardingAction>;
}

const OnboardingStoreContext = createContext<IOnboardingStoreContext | null>(null);

export const OnboardingStoreProvider = ({ children }: { children: ReactNode }) => {
	const [state, dispatch] = useReducer(onboardingReducer, initialState);
	return (
		<OnboardingStoreContext.Provider value={{ state, dispatch }}>
			{children}
		</OnboardingStoreContext.Provider>
	);
};

export const useOnboardingStore = () => {
	const ctx = useContext(OnboardingStoreContext);
	if (!ctx) throw new Error('useOnboardingStore must be used within OnboardingStoreProvider');
	return ctx;
};

export type { IOnboardingState, TOnboardingAction };
