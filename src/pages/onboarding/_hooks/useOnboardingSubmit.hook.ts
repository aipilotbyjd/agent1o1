import { useAuth } from '@/context/authContext';
import { useUploadAvatar } from '@/api/modules/auth';
import { useCreateWorkspace, useSwitchWorkspace } from '@/api/modules/workspaces';
import {
	useOnboardingInviteTeam,
	useOnboardingSelectRole,
	useOnboardingSelectPlan,
	useOnboardingStripeCheckout,
	useOnboardingSubmitDiscovery,
	useOnboardingComplete,
	useOnboardingState,
} from '@/api/modules/onboarding';
import { useOnboardingStore } from '../_context/OnboardingStore.context';
import { parseEmails, isValidEmail } from '../_helper/onboarding.helper';
import { useOnboardingNavigation } from './useOnboardingNavigation.hook';
import { useNavigate } from 'react-router';

export const useOnboardingSubmit = () => {
	const navigate = useNavigate();
	const { userData, refreshCurrentUser } = useAuth();
	const uploadAvatar = useUploadAvatar();
	const createWorkspace = useCreateWorkspace();
	const switchWorkspace = useSwitchWorkspace();
	const inviteTeamMutation = useOnboardingInviteTeam();
	const selectRoleMutation = useOnboardingSelectRole();
	const selectPlanMutation = useOnboardingSelectPlan();
	const submitDiscoveryMutation = useOnboardingSubmitDiscovery();
	const completeMutation = useOnboardingComplete();
	const { data: onboardingData } = useOnboardingState(false);

	const { state, dispatch } = useOnboardingStore();
	const { advanceStep } = useOnboardingNavigation();

	const {
		currentStep,
		workspaceName,
		workspaceSlug,
		workspaceCreated,
		inviteEmails,
		inviteRole,
		inviteMessage,
		invitesSent,
		createdWorkspaceId,
		selectedJobRole,
		selectedPlan,
		selectedSurvey,
	} = state;

	const stripeCheckoutMutation = useOnboardingStripeCheckout(createdWorkspaceId);

	const parsedInviteEmails = parseEmails(inviteEmails);
	const validInviteEmails = parsedInviteEmails.filter(isValidEmail);
	const hasValidEmails = validInviteEmails.length > 0;

	const handleFileSelect = async (file: File) => {
		if (!file) return;
		if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result)
				dispatch({ type: 'SET_FIELD', payload: { avatarUrl: e.target.result as string } });
		};
		reader.readAsDataURL(file);
		try {
			await uploadAvatar.mutateAsync(file);
			await refreshCurrentUser();
		} catch {
			dispatch({ type: 'SET_FIELD', payload: { avatarUrl: userData?.avatar ?? null } });
		}
	};

	const handleNextStep = async () => {
		// Step 2: Create workspace
		if (currentStep === 1) {
			if (workspaceCreated) {
				advanceStep();
				return;
			}
			if (!workspaceName.trim()) return;
			try {
				const workspace = await createWorkspace.mutateAsync({
					name: workspaceName.trim(),
					slug: workspaceSlug.trim(),
				});
				await switchWorkspace.mutateAsync(workspace.id);
				await refreshCurrentUser();
				dispatch({
					type: 'SET_FIELD',
					payload: { workspaceCreated: true, createdWorkspaceId: workspace.id },
				});
			} catch {
				return;
			}
		}

		// Step 3: Invite team
		if (currentStep === 2 && hasValidEmails && !invitesSent) {
			try {
				await inviteTeamMutation.mutateAsync({
					emails: validInviteEmails,
					role: inviteRole,
					personal_note: inviteMessage,
				});
				dispatch({ type: 'SET_FIELD', payload: { invitesSent: true } });
			} catch {
				// Non-blocking
			}
		}

		// Step 4: Role selection
		if (currentStep === 3) {
			try {
				if (selectedJobRole) {
					await selectRoleMutation.mutateAsync({ job_role: selectedJobRole });
				}
			} catch {
				// Non-blocking
			}
		}

		// Step 5: Choose plan
		if (currentStep === 4) {
			try {
				if (selectedPlan === 'free') {
					await selectPlanMutation.mutateAsync({ plan_slug: 'free' });
				} else {
					const plan = onboardingData?.meta?.plans?.find((p) => p.slug === selectedPlan);
					if (!plan) return;
					await stripeCheckoutMutation.mutateAsync({
						plan_id: plan.id,
						interval: 'monthly',
					});
					return; // Redirecting, don't advance
				}
			} catch {
				// Non-blocking
			}
		}

		// Step 7: Discovery survey & complete
		if (currentStep === 6) {
			try {
				if (selectedSurvey) {
					await submitDiscoveryMutation.mutateAsync({ discovery_source: selectedSurvey });
				}
				await completeMutation.mutateAsync();
				await refreshCurrentUser();
				navigate('/dashboard');
				return;
			} catch {
				// Non-blocking
			}
		}

		advanceStep();
	};

	const isWorkspaceLoading = createWorkspace.isPending || switchWorkspace.isPending;

	return {
		handleFileSelect,
		handleNextStep,
		isWorkspaceLoading,
		sendInvitationPending: inviteTeamMutation.isPending,
		uploadAvatarPending: uploadAvatar.isPending,
	};
};
