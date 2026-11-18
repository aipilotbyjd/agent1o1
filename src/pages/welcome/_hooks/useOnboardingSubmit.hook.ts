import { notify } from '@/api/core';
import { useAuth } from '@/context/auth';
import { useSwitchWorkspace } from '@/api/modules/user';
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
import {
	useUseAgentTemplate,
	useUseTemplateCollection,
	useUseWorkflowTemplate,
} from '@/api/modules/templates';
import { useOnboardingStore } from './useOnboardingStore.hook';
import { useOnboardingWorkspaceId } from './useOnboardingWorkspace.hook';
import { ONBOARDING_STEP_KEYS } from '../_helper/onboarding.constants';
import { parseEmails, isValidEmail } from '../_helper/onboarding.helper';
import { useOnboardingNavigation } from './useOnboardingNavigation.hook';

export const useOnboardingSubmit = () => {
	const { refreshCurrentUser } = useAuth();
	const createWorkspace = useCreateWorkspace();
	const switchWorkspace = useSwitchWorkspace();
	const inviteTeamMutation = useInviteOnboardingTeam();
	const selectRoleMutation = useSelectOnboardingRole();
	const selectPlanMutation = useSelectOnboardingPlan();
	const submitDiscoveryMutation = useSubmitOnboardingDiscovery();
	const completeMutation = useCompleteOnboarding();
	const { data: onboardingData } = useOnboardingState();

	const { state, dispatch } = useOnboardingStore();
	const { advanceStep, goToApp, isLastPendingStep } = useOnboardingNavigation();
	const workspaceId = useOnboardingWorkspaceId();
	const workflowFromTemplate = useUseWorkflowTemplate(workspaceId);
	const agentFromTemplate = useUseAgentTemplate(workspaceId);
	const collectionFromTemplate = useUseTemplateCollection(workspaceId);

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
		selectedTemplate,
		createdFromTemplate,
	} = state;

	const stripeCheckoutMutation = useCheckoutSubscription(createdWorkspaceId);

	const parsedInviteEmails = parseEmails(inviteEmails);
	const validInviteEmails = parsedInviteEmails.filter(isValidEmail);
	const hasValidEmails = validInviteEmails.length > 0;

	/**
	 * Creates the workflow, agent or collection a template describes and says
	 * what to open when onboarding finishes. A collection can create several
	 * things, so it opens the first workflow it made, else the first agent.
	 */
	const createFromTemplate = async (
		template: NonNullable<typeof selectedTemplate>,
	): Promise<{ type: 'workflow' | 'agent'; id: string } | null> => {
		if (template.type === 'workflow') {
			const workflow = await workflowFromTemplate.mutateAsync({
				id: template.id,
				body: { name: template.name },
			});
			return { type: 'workflow', id: String(workflow.id) };
		}

		if (template.type === 'agent') {
			const agent = await agentFromTemplate.mutateAsync({
				id: template.id,
				body: { name: template.name },
			});
			return { type: 'agent', id: String(agent.id) };
		}

		if (template.type === 'collection') {
			const { workflows, agents } = await collectionFromTemplate.mutateAsync({
				id: template.id,
			});
			if (workflows[0]) return { type: 'workflow', id: String(workflows[0].id) };
			if (agents[0]) return { type: 'agent', id: String(agents[0].id) };
		}

		return null;
	};

	const handleNextStep = async () => {
		const stepKey = ONBOARDING_STEP_KEYS[currentStep];

		if (stepKey === 'create_workspace') {
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

		if (stepKey === 'invite_team' && hasValidEmails && !invitesSent) {
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

		if (stepKey === 'role_selection') {
			try {
				if (selectedJobRole) {
					await selectRoleMutation.mutateAsync({ job_role: selectedJobRole });
				}
			} catch {
				// Non-blocking
			}
		}

		// Continue creates the picked template once: going back and forward again
		// must not make a second copy, but picking a different one creates it.
		// Nothing picked just moves on.
		if (
			stepKey === 'choose_template' &&
			selectedTemplate &&
			createdFromTemplate?.templateId !== selectedTemplate.id
		) {
			try {
				const created = await createFromTemplate(selectedTemplate);
				dispatch({
					type: 'SET_FIELD',
					payload: {
						createdFromTemplate: { templateId: selectedTemplate.id, opens: created },
					},
				});
				notify.success(`"${selectedTemplate.name}" is ready in your workspace.`);
			} catch {
				// Stay on the step so the user can retry or skip; the mutation
				// cache has already surfaced the error.
				return;
			}
		}

		if (stepKey === 'choose_plan') {
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

		// The survey is optional, so a rejected answer must not stop the wizard.
		if (stepKey === 'discovery_survey' && selectedSurvey) {
			try {
				await submitDiscoveryMutation.mutateAsync({ discovery_source: selectedSurvey });
			} catch {
				// Non-blocking
			}
		}

		// Whichever step is the last one left finishes onboarding: without the
		// `complete` call it never gets marked done and the user is sent back
		// here on their next sign-in.
		if (isLastPendingStep) {
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
	const isTemplateLoading =
		workflowFromTemplate.isPending ||
		agentFromTemplate.isPending ||
		collectionFromTemplate.isPending;

	return {
		handleNextStep,
		isWorkspaceLoading,
		isTemplateLoading,
		sendInvitationPending: inviteTeamMutation.isPending,
	};
};
