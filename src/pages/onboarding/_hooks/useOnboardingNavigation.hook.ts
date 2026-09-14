import { useNavigate } from 'react-router';
import { useOnboardingStore } from '../_context/OnboardingStore.context';
import { TOTAL_STEPS } from '../_helper/onboarding.constants';
import { parseEmails, isValidEmail } from '../_helper/onboarding.helper';
import { useOnboardingDismiss } from '@/api/modules/onboarding';
import type { TOnboardingStep } from '../_types/onboarding.type';

export const useOnboardingNavigation = () => {
	const navigate = useNavigate();
	const dismissMutation = useOnboardingDismiss();
	const { state, dispatch } = useOnboardingStore();

	const { currentStep, inviteEmails, invitesSent } = state;

	const parsedInviteEmails = parseEmails(inviteEmails);
	const validInviteEmails = parsedInviteEmails.filter(isValidEmail);
	const hasValidEmails = validInviteEmails.length > 0;

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
			navigate('/dashboard');
		}
	};

	const handleDismissAll = async () => {
		try {
			await dismissMutation.mutateAsync();
		} catch {
			// ignore
		} finally {
			navigate('/dashboard');
		}
	};

	return {
		currentStep,
		handlePrevStep,
		handleSkip,
		advanceStep,
		handleDismissAll,
		hasValidEmails,
		validInviteEmails,
		invitesSent,
	};
};
