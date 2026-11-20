import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
	onboardingKeys,
	useCompleteOnboarding,
	useContinueOnboardingStep,
	useDismissOnboarding,
	useOnboardingState,
	useSelectOnboardingRole,
	useSkipOnboardingStep,
	useStartOnboarding,
} from '@/api/modules/onboarding';
import { useCreateWorkflow } from '@/api/modules/workflows';
import { useUseWorkflowTemplate } from '@/api/modules/templates';
import { useWorkspaceContext } from '@/context/workspace';
import { BUILD_FROM_DESCRIPTION_PARAM } from '@/constants/onboarding.constant';
import paths from '@/Routes/paths';
import pages from '@/Routes/pages';
import safeStorage from '@/utils/safeStorage.util';
import { isPostHogEnabled, posthog } from '@/utils/posthog.util';
import type { TOnboardingStepKey } from '@/types/onboarding.type';
import type { TRun } from '@/types/run.type';
import { nextOpenStep, resolveStartStep } from '../_helper/onboarding.helper';

/** The four steps, then the result of the first run. */
export type TWizardScreen = TOnboardingStepKey | 'success';

type TFirstWorkflow = { id: string; name: string };

type TSavedProgress = { description: string; workflow: TFirstWorkflow | null };

/** What the wizard holds between steps, kept for the tab so a reload resumes where it was. */
const SESSION_KEY = 'a1o1_onboarding_wizard';

const WORKFLOW_NAME_LENGTH = 60;

const loadProgress = (): TSavedProgress => {
	try {
		const raw = safeStorage.get(SESSION_KEY, 'session');
		return raw ? (JSON.parse(raw) as TSavedProgress) : { description: '', workflow: null };
	} catch {
		return { description: '', workflow: null };
	}
};

/** A workflow named after what it does: the description's first line, shortened. */
const nameFromDescription = (description: string) => {
	const firstLine = description.trim().split('\n')[0];
	return firstLine.length > WORKFLOW_NAME_LENGTH
		? `${firstLine.slice(0, WORKFLOW_NAME_LENGTH - 1).trimEnd()}…`
		: firstLine;
};

/**
 * The onboarding wizard's flow: which screen is showing, what the user has
 * picked, and every move between screens. The server owns progress (each
 * step is saved as the user leaves it); this keeps what only the browser
 * knows: the description and the workflow made for the first run.
 */
export const useOnboardingWizard = () => {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [searchParams] = useSearchParams();
	const { activeWorkspaceId: ws } = useWorkspaceContext();

	const startOnboarding = useStartOnboarding();
	const { data: state } = useOnboardingState();
	const selectRole = useSelectOnboardingRole();
	const continueStep = useContinueOnboardingStep();
	const skipStep = useSkipOnboardingStep();
	const complete = useCompleteOnboarding();
	const dismiss = useDismissOnboarding();
	const createWorkflow = useCreateWorkflow(ws);
	const fromTemplate = useUseWorkflowTemplate(ws);

	const [screen, setScreen] = useState<TWizardScreen | null>(null);
	const [progress, setProgress] = useState<TSavedProgress>(loadProgress);
	const [role, setRole] = useState('');
	const [run, setRun] = useState<TRun | null>(null);
	const [pickingTemplateId, setPickingTemplateId] = useState<string | null>(null);
	const hasStarted = useRef(false);

	useEffect(() => {
		safeStorage.set(SESSION_KEY, JSON.stringify(progress), 'session');
	}, [progress]);

	const goToDashboard = useCallback(
		() => navigate(ws ? paths.dashboard(ws) : pages.choose.to, { replace: true }),
		[navigate, ws],
	);

	const leaveWizard = useCallback(
		(to: string) => {
			safeStorage.remove(SESSION_KEY, 'session');
			navigate(to, { replace: true });
		},
		[navigate],
	);

	// Opening the wizard sets up the workspace, then decides the first screen.
	const begin = () =>
		startOnboarding.mutate(undefined, {
			onSuccess: (started) => {
				const target = resolveStartStep(started, searchParams.get('step'));

				if (target === null || started.completed) {
					goToDashboard();
					return;
				}

				// The run needs the workflow made on the template step; without it, pick again.
				setScreen(
					target === 'first_run' && !loadProgress().workflow ? 'choose_template' : target,
				);
			},
		});

	useEffect(() => {
		if (hasStarted.current) return;
		hasStarted.current = true;
		begin();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// The run finished the last step server side: read progress again so it shows as done.
	const showResult = useCallback(
		(finished: TRun) => {
			setRun(finished);
			setScreen('success');
			void qc.invalidateQueries({ queryKey: onboardingKeys.state() });
		},
		[qc],
	);

	// The first stage of each step in the funnel (docs/POSTHOG.md in the API repo):
	// the server records completed and skipped, only the browser knows what was shown.
	useEffect(() => {
		if (!isPostHogEnabled || !screen || !state) return;
		const stepNumber = state.steps.findIndex((step) => step.key === screen) + 1;
		posthog.capture('onboarding_step_viewed', {
			step: screen,
			step_number: stepNumber > 0 ? stepNumber : state.steps.length + 1,
		});
	}, [screen, state]);

	const moveOn = (from: TOnboardingStepKey) => {
		const next = state ? nextOpenStep(state.steps, from) : null;
		setScreen(next ?? 'first_run');
	};

	const submitDescription = async () => {
		try {
			await (role
				? selectRole.mutateAsync({ job_role: role })
				: continueStep.mutateAsync({ step: 'role_selection' }));
		} catch {
			return;
		}
		moveOn('role_selection');
	};

	const continueFromAi = async () => {
		try {
			await continueStep.mutateAsync({ step: 'connect_ai' });
		} catch {
			return;
		}
		setScreen('choose_template');
	};

	const pickTemplate = async (template: TFirstWorkflow) => {
		setPickingTemplateId(template.id);
		try {
			const workflow = await fromTemplate.mutateAsync({
				id: template.id,
				body: { name: template.name },
			});
			await continueStep.mutateAsync({ step: 'choose_template' });
			setProgress((current) => ({
				...current,
				workflow: { id: String(workflow.id), name: workflow.name },
			}));
			setScreen('first_run');
		} catch {
			// The mutation cache has shown why; the user can pick again.
		} finally {
			setPickingTemplateId(null);
		}
	};

	/**
	 * The AI builder works in the editor, so building from the description
	 * ends the wizard there: the first run happens once the draft is ready.
	 */
	const buildFromDescription = async () => {
		try {
			const workflow = await createWorkflow.mutateAsync({
				name: nameFromDescription(progress.description),
			});
			await complete.mutateAsync();
			const search = new URLSearchParams({
				[BUILD_FROM_DESCRIPTION_PARAM]: progress.description.trim(),
			});
			leaveWizard(`${paths.editPlaybook(ws, workflow.id)}?${search}`);
		} catch {
			// The mutation cache has shown why; the user can try again or pick a template.
		}
	};

	const finish = async (destination: 'editor' | 'dashboard') => {
		try {
			await complete.mutateAsync();
		} catch {
			return;
		}
		const workflowId = progress.workflow?.id;
		leaveWizard(
			destination === 'editor' && workflowId
				? paths.editPlaybook(ws, workflowId)
				: paths.dashboard(ws),
		);
	};

	/** Leaves the wizard for the dashboard; anything left open stays on the checklist. */
	const skipSetup = async () => {
		try {
			if (
				screen &&
				screen !== 'success' &&
				state?.steps.find((step) => step.key === screen)?.skippable
			) {
				await skipStep.mutateAsync({ step: screen });
			}
			await dismiss.mutateAsync();
		} catch {
			// Leaving never fails for the user: the dashboard shows what is left.
		}
		leaveWizard(paths.dashboard(ws));
	};

	return {
		ws,
		state,
		screen,
		isStarting: !screen && !startOnboarding.isError,
		startFailed: startOnboarding.isError,
		retryStart: begin,
		role,
		setRole,
		description: progress.description,
		setDescription: (description: string) =>
			setProgress((current) => ({ ...current, description })),
		workflow: progress.workflow,
		run,
		showResult,
		submitDescription,
		continueFromAi,
		pickTemplate,
		buildFromDescription,
		finish,
		skipSetup,
		openEditor: () =>
			progress.workflow && leaveWizard(paths.editPlaybook(ws, progress.workflow.id)),
		isSavingDescription: selectRole.isPending || continueStep.isPending,
		isSavingAi: continueStep.isPending,
		pickingTemplateId,
		isBuilding: createWorkflow.isPending || (complete.isPending && !run),
		isFinishing: complete.isPending,
		isLeaving: dismiss.isPending || skipStep.isPending,
	};
};
