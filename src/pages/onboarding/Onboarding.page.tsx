import { FC, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import classNames from 'classnames';
import {
	useCompleteOnboarding,
	useDismissOnboarding,
	useOnboardingState,
} from '@/api/modules/onboarding';
import { useAuth } from '@/context/authContext';
import { AFTER_AUTH_PATH } from '@/hooks/useAfterAuthRedirect';
import Agent1o1Wordmark from '@/components/common/Agent1o1Wordmark';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import Spinner from '@/components/ui/Spinner';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import type { TOnboardingStepKey } from '@/types/onboarding.type';
import { TOnboardingStepProps } from './onboarding.types';
import ProfilePictureStep from './_steps/ProfilePicture.step';
import CreateWorkspaceStep from './_steps/CreateWorkspace.step';
import InviteTeamStep from './_steps/InviteTeam.step';
import RoleSelectionStep from './_steps/RoleSelection.step';
import ChoosePlanStep from './_steps/ChoosePlan.step';
import ConnectAppsStep from './_steps/ConnectApps.step';
import DiscoverySurveyStep from './_steps/DiscoverySurvey.step';

// ============================================================
// Onboarding
// ------------------------------------------------------------
// The wizard walks `state.steps` in server order and keeps its own
// cursor. It deliberately does NOT drive off `current_step`: the
// server only advances that from four of the seven steps (the rest
// derive `completed` from user attributes), so it lags behind on a
// perfectly normal run-through.
// ============================================================

const STEP_COMPONENTS: Record<TOnboardingStepKey, FC<TOnboardingStepProps>> = {
	profile_picture: ProfilePictureStep,
	create_workspace: CreateWorkspaceStep,
	invite_team: InviteTeamStep,
	role_selection: RoleSelectionStep,
	choose_plan: ChoosePlanStep,
	connect_apps: ConnectAppsStep,
	discovery_survey: DiscoverySurveyStep,
};

const OnboardingPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { isDarkTheme } = useDarkMode();

	const { data: state, isLoading, isError, refetch } = useOnboardingState();
	const dismiss = useDismissOnboarding();
	const complete = useCompleteOnboarding();

	const [cursor, setCursor] = useState<number | null>(null);

	// Land on the first unfinished step, once the snapshot arrives.
	useEffect(() => {
		if (!state || cursor !== null) return;
		const firstIncomplete = state.steps.findIndex((step) => !step.completed);
		setCursor(firstIncomplete === -1 ? state.steps.length : firstIncomplete);
	}, [state, cursor]);

	const steps = useMemo(() => state?.steps ?? [], [state]);
	const activeIndex = cursor ?? 0;
	const isFinishScreen = steps.length > 0 && activeIndex >= steps.length;

	const goNext = () => setCursor((prev) => Math.min((prev ?? 0) + 1, steps.length));
	const goBack = () => setCursor((prev) => Math.max((prev ?? 0) - 1, 0));

	const leaveOnboarding = () => navigate(AFTER_AUTH_PATH, { replace: true });

	const handleDismiss = () => dismiss.mutate(undefined, { onSuccess: leaveOnboarding });
	const handleComplete = () => complete.mutate(undefined, { onSuccess: leaveOnboarding });

	if (isLoading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<Spinner />
			</div>
		);
	}

	if (isError || !state) {
		return (
			<div className='flex h-full items-center justify-center p-6'>
				<div className='w-full max-w-md'>
					<Alert color='red' icon='Alert02' title='Could not load onboarding'>
						Something went wrong fetching your setup steps.
					</Alert>
					<div className='mt-4 flex justify-center gap-2'>
						<Button aria-label='Retry' variant='solid' onClick={() => refetch()}>
							Try again
						</Button>
						<Button aria-label='Skip' variant='link' color='zinc' onClick={leaveOnboarding}>
							Go to the app
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Finished or dismissed previously — nothing left to walk through.
	if (state.completed || state.dismissed) return <Navigate to={AFTER_AUTH_PATH} replace />;

	const activeStep = steps[activeIndex];
	const ActiveStepComponent = activeStep ? STEP_COMPONENTS[activeStep.key] : undefined;

	return (
		<div className='mx-auto w-full max-w-5xl px-4 py-10'>
			<div className='mb-8 flex items-center justify-between gap-4'>
				<Agent1o1Wordmark size='md' />
				<Button
					aria-label='Skip setup'
					variant='link'
					color='zinc'
					isLoading={dismiss.isPending}
					onClick={handleDismiss}>
					Skip setup for now
				</Button>
			</div>

			<div className='grid gap-6 lg:grid-cols-12'>
				<aside className='lg:col-span-4'>
					<Card>
						<CardBody>
							<h1 className='text-lg font-bold text-zinc-800 dark:text-white'>
								Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
							</h1>
							<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
								A few quick steps and your workspace is ready.
							</p>

							<div className='mt-4'>
								<div className='mb-2 flex items-center justify-between text-xs text-zinc-500'>
									<span>Setup progress</span>
									<span>{state.percent}%</span>
								</div>
								<Progress value={state.percent} color='blue' />
							</div>

							<ol className='mt-6 grid gap-1'>
								{steps.map((step, index) => {
									const isActive = index === activeIndex;
									const isDone = step.completed;
									return (
										<li key={step.key}>
											<button
												type='button'
												// Only walk back to ground already covered.
												disabled={index > activeIndex && !isDone}
												onClick={() => setCursor(index)}
												className={classNames(
													'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm transition',
													{
														'bg-zinc-500/10 font-semibold text-zinc-800 dark:text-white':
															isActive,
														'text-zinc-500 hover:bg-zinc-500/5':
															!isActive,
														'cursor-pointer': index <= activeIndex || isDone,
														'cursor-not-allowed opacity-50':
															index > activeIndex && !isDone,
													},
												)}>
												<Icon
													icon={isDone ? 'CheckmarkCircle02' : 'Circle'}
													color={isDone ? 'emerald' : 'zinc'}
												/>
												<span className='truncate'>{step.label}</span>
											</button>
										</li>
									);
								})}
							</ol>
						</CardBody>
					</Card>
				</aside>

				<main className='lg:col-span-8'>
					<Card>
						<CardBody className='p-6! sm:p-8!'>
							{isFinishScreen || !activeStep ? (
								<div className='text-center'>
									<div className='mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10'>
										<Icon icon='Rocket01' color='emerald' size='text-3xl' />
									</div>
									<h2 className='mt-4 text-xl font-bold text-zinc-800 dark:text-white'>
										You're all set
									</h2>
									<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
										Anything you skipped is still waiting in Settings whenever
										you want it.
									</p>
									<div className='mt-6 flex justify-center gap-2'>
										{steps.length > 0 && (
											<Button
												aria-label='Back'
												variant='link'
												color='zinc'
												icon='ArrowLeft01'
												onClick={goBack}>
												Back
											</Button>
										)}
										<Button
											aria-label='Finish'
											variant='solid'
											className='font-bold'
											rightIcon='ArrowRight01'
											isLoading={complete.isPending}
											isDisable={complete.isPending}
											onClick={handleComplete}>
											Go to your workspace
										</Button>
									</div>
								</div>
							) : ActiveStepComponent ? (
								<ActiveStepComponent
									state={state}
									onNext={goNext}
									onBack={activeIndex === 0 ? null : goBack}
								/>
							) : (
								// A step the server knows about and this build doesn't —
								// step over it rather than dead-ending the wizard.
								<div className='text-center'>
									<h2 className='text-lg font-bold text-zinc-800 dark:text-white'>
										{activeStep.label}
									</h2>
									<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
										{activeStep.description}
									</p>
									<Button
										aria-label='Continue'
										variant='solid'
										className='mt-6 font-bold'
										onClick={goNext}>
										Continue
									</Button>
								</div>
							)}
						</CardBody>
					</Card>
				</main>
			</div>
		</div>
	);
};

export default OnboardingPage;
