import { useNavigate } from 'react-router';
import { useOnboardingStore } from './useOnboardingStore.hook';
import { ONBOARDING_STEP_KEYS } from '../_helper/onboarding.constants';
import { parseEmails, isValidEmail, findPendingStep } from '../_helper/onboarding.helper';
import {
	useContinueOnboardingStep,
	useDismissOnboarding,
	useOnboardingState,
	useSkipOnboardingStep,
} from '@/api/modules/onboarding';
import { useAuth } from '@/context/auth';
import pages, { type TPages } from '@/Routes/pages';

const dashboardPath = (pages.workspace.subPages as TPages).dashboard.to;

export const useOnboardingNavigation = () => {
	const navigate = useNavigate();
	const dismissMutation = useDismissOnboarding();
	const skipMutation = useSkipOnboardingStep();
	const continueMutation = useContinueOnboardingStep();
	const { userData } = useAuth();
	const { state, dispatch } = useOnboardingStore();
	const { data: onboardingData } = useOnboardingState();
	const steps = onboardingData?.steps ?? [];

	const { currentStep, inviteEmails, invitesSent, createdWorkspaceId } = state;

	const parsedInviteEmails = parseEmails(inviteEmails);
	const validInviteEmails = parsedInviteEmails.filter(isValidEmail);
	const hasValidEmails = validInviteEmails.length > 0;

	/**
	 * Leaving onboarding lands on the workspace dashboard, which is scoped
	 * (`/:workspaceId/dashboard`). A user who never got a workspace - skipped
	 * step 2, or dismissed before it - goes to the workspace picker instead.
	 */
	const goToApp = () => {
		const workspaceId = createdWorkspaceId || userData?.current_workspace_id;

		navigate(
			workspaceId ? dashboardPath.replace(':workspaceId', workspaceId) : pages.choose.to,
			{ replace: true },
		);
	};

	// Completed steps are never shown again, in either direction.
	const previousStep = findPendingStep(steps, currentStep, -1);
	const nextStep = findPendingStep(steps, currentStep, 1);

	const handlePrevStep = () => {
		if (previousStep !== null) {
			dispatch({ type: 'SET_STEP', payload: previousStep });
		}
	};

	const handleSkip = () => {
		if (nextStep !== null) {
			skipMutation.mutate({ step: ONBOARDING_STEP_KEYS[currentStep] });
			dispatch({ type: 'SET_STEP', payload: nextStep });
		} else {
			void handleDismissAll();
		}
	};

	const advanceStep = async () => {
		if (nextStep !== null) {
			try {
				await continueMutation.mutateAsync({ step: ONBOARDING_STEP_KEYS[currentStep] });
			} catch {
				return;
			}
			dispatch({ type: 'SET_STEP', payload: nextStep });
		} else {
			goToApp();
		}
	};

	const handleDismissAll = async () => {
		try {
			await dismissMutation.mutateAsync();
		} catch {
			// ignore
		} finally {
			goToApp();
		}
	};

	return {
		currentStep,
		handlePrevStep,
		canGoBack: previousStep !== null,
		isLastPendingStep: nextStep === null,
		handleSkip,
		advanceStep,
		handleDismissAll,
		goToApp,
		hasValidEmails,
		validInviteEmails,
		invitesSent,
	};
};
