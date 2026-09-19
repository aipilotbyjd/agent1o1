import { notify } from '@/api/core';
import { useAuth } from '@/context/auth';
import { useUploadAvatar, useSwitchWorkspace } from '@/api/modules/user';
import { useCreateWorkspace } from '@/api/modules/workspaces';
import { useCheckoutSubscription } from '@/api/modules/billing';
import {
	useInviteOnboardingTeam,
	useSelectOnboardingRole,
	useSelectOnboardingPlan,
	useSubmitOnboardingDiscovery,
	useCompleteOnboarding,
	useOnboardingState,
} from '@/api/modules/onboarding';
import { useOnboardingStore } from '../_context/OnboardingStore.context';
import { parseEmails, isValidEmail } from '../_helper/onboarding.helper';
import { useOnboardingNavigation } from './useOnboardingNavigation.hook';

export const useOnboardingSubmit = () => {
	const { userData, refreshCurrentUser } = useAuth();
	const uploadAvatar = useUploadAvatar();
	const createWorkspace = useCreateWorkspace();
	const switchWorkspace = useSwitchWorkspace();
	const inviteTeamMutation = useInviteOnboardingTeam();
	const selectRoleMutation = useSelectOnboardingRole();
	const selectPlanMutation = useSelectOnboardingPlan();
	const submitDiscoveryMutation = useSubmitOnboardingDiscovery();
	const completeMutation = useCompleteOnboarding();
	const { data: onboardingData } = useOnboardingState();

	const { state, dispatch } = useOnboardingStore();
	const { advanceStep, goToApp } = useOnboardingNavigation();

	const {
		currentStep,
		workspaceName,
		// `workspaceSlug` is collected by WorkspaceStep for the URL preview, but
		// this backend derives the slug from the name and rejects it on create.
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

	const stripeCheckoutMutation = useCheckoutSubscription(createdWorkspaceId);

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
				});
				notify.success(`Workspace "${workspace.name}" created`);
				await switchWorkspace.mutateAsync({ workspace_id: workspace.id });
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
				notify.success('Team invites sent successfully.');
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
			if (selectedPlan === 'free') {
				try {
					await selectPlanMutation.mutateAsync({ plan_slug: 'free' });
				} catch {
					// Non-blocking
				}
			} else {
				const plan = onboardingData?.meta?.plans?.find((p) => p.slug === selectedPlan);
				if (!plan) return;

				try {
					const result = await stripeCheckoutMutation.mutateAsync({
						plan_id: plan.id,
						interval: 'monthly',
					});

					// A new subscription hands back a Stripe Checkout URL to
					// hand the browser over to. A workspace that already has
					// one is swapped in place server side and comes back as the
					// updated subscription, so onboarding just carries on.
					if ('checkout_url' in result) {
						window.location.href = result.checkout_url;
						return;
					}
				} catch {
					// Stay on the step so the user can retry or pick Free; the
					// mutation cache has already surfaced the error.
					return;
				}
			}
		}

		// Step 7: Discovery survey & complete
		if (currentStep === 6) {
			// The survey is optional, so a rejected answer must not stop the
			// `complete` call below — otherwise onboarding never gets marked
			// done and the user is sent back here on their next sign-in.
			if (selectedSurvey) {
				try {
					await submitDiscoveryMutation.mutateAsync({
						discovery_source: selectedSurvey,
					});
				} catch {
					// Non-blocking
				}
			}

			try {
				await completeMutation.mutateAsync();
				await refreshCurrentUser();
			} catch {
				// Stay on the step so the user can retry; the mutation cache
				// has already surfaced the error.
				return;
			}

			goToApp();
			return;
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
