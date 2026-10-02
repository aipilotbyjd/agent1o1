import { useNavigate } from 'react-router';
import { useOnboardingStore } from '../_context/OnboardingStore.context';
import { TOTAL_STEPS } from '../_helper/onboarding.constants';
import { parseEmails, isValidEmail } from '../_helper/onboarding.helper';
import { useDismissOnboarding } from '@/api/modules/onboarding';
import { useAuth } from '@/context/auth';
import pages, { type TPages } from '@/Routes/pages';
import type { TOnboardingStep } from '../_types/onboarding.type';

const dashboardPath = (pages.workspace.subPages as TPages).dashboard.to;

export const useOnboardingNavigation = () => {
	const navigate = useNavigate();
	const dismissMutation = useDismissOnboarding();
	const { userData } = useAuth();
	const { state, dispatch } = useOnboardingStore();

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

	const handlePrevStep = () => {
		if (currentStep > 0) {
			dispatch({ type: 'SET_STEP', payload: (currentStep - 1) as TOnboardingStep });
		}
	};

	const handleSkip = () => {
		if (currentStep < TOTAL_STEPS - 1) {
			dispatch({ type: 'SET_STEP', payload: (currentStep + 1) as TOnboardingStep });
		} else {
			void handleDismissAll();
		}
	};

	const advanceStep = () => {
		if (currentStep < TOTAL_STEPS - 1) {
			dispatch({ type: 'SET_STEP', payload: (currentStep + 1) as TOnboardingStep });
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
		handleSkip,
		advanceStep,
		handleDismissAll,
		goToApp,
		hasValidEmails,
		validInviteEmails,
		invitesSent,
	};
};
