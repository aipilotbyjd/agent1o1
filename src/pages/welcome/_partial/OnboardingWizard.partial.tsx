import { Loader2 } from 'lucide-react';
import WizardButton from './shared/WizardButton.partial';
import { useAuth } from '@/context/auth';
import WizardShell from './WizardShell.partial';
import DescribeStep from './steps/DescribeStep.partial';
import ConnectAiStep from './steps/ConnectAiStep.partial';
import PickStep from './steps/PickStep.partial';
import RunStep from './steps/RunStep.partial';
import SuccessStep from './steps/SuccessStep.partial';
import { useOnboardingWizard } from '../_hooks/useOnboardingWizard.hook';

/**
 * The first-run wizard: describe what to automate, connect an AI provider,
 * pick a starting point, run it on example data, see the result. Everything
 * else (the plan, apps, the team) comes once the user has seen it work.
 */
const OnboardingWizard = () => {
	const { userData } = useAuth();
	const wizard = useOnboardingWizard();
	const { state, screen, ws } = wizard;
	const firstName = userData?.name?.split(' ')[0] ?? '';

	if (wizard.startFailed) {
		return (
			<div className='flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-zinc-950'>
				<p className='text-base font-bold'>We couldn't set up your workspace.</p>
				<p className='max-w-sm text-sm text-zinc-500 dark:text-zinc-400'>
					Check your connection and try again. Nothing was lost.
				</p>
				<WizardButton onClick={wizard.retryStart}>Try again</WizardButton>
			</div>
		);
	}

	if (wizard.isStarting || !state || !screen) {
		return (
			<div className='flex min-h-screen items-center justify-center gap-3 bg-white text-sm font-bold text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400'>
				<Loader2 className='size-5 animate-spin' />
				Setting up your workspace…
			</div>
		);
	}

	return (
		<WizardShell
			steps={state.steps}
			currentKey={screen === 'success' ? null : screen}
			onLeave={screen === 'success' ? undefined : wizard.skipSetup}
			isLeaving={wizard.isLeaving}>
			{screen === 'role_selection' && (
				<DescribeStep
					firstName={firstName}
					roles={state.meta.job_roles}
					selectedRole={wizard.role}
					onSelectRole={wizard.setRole}
					description={wizard.description}
					onDescriptionChange={wizard.setDescription}
					onContinue={wizard.submitDescription}
					isSaving={wizard.isSavingDescription}
				/>
			)}

			{screen === 'connect_ai' && (
				<ConnectAiStep
					ws={ws}
					onContinue={wizard.continueFromAi}
					isSaving={wizard.isSavingAi}
				/>
			)}

			{screen === 'choose_template' && (
				<PickStep
					ws={ws}
					description={wizard.description}
					recommended={state.meta.recommended_templates}
					busyTemplateId={wizard.pickingTemplateId}
					isBuilding={wizard.isBuilding}
					onPickTemplate={wizard.pickTemplate}
					onBuildFromDescription={wizard.buildFromDescription}
					onExploreAlone={wizard.skipSetup}
				/>
			)}

			{screen === 'first_run' && wizard.workflow && (
				<RunStep
					ws={ws}
					workflowId={wizard.workflow.id}
					workflowName={wizard.workflow.name}
					onSucceeded={wizard.showResult}
					onOpenEditor={wizard.openEditor}
				/>
			)}

			{screen === 'success' && wizard.run && (
				<SuccessStep
					ws={ws}
					run={wizard.run}
					isFinishing={wizard.isFinishing}
					onAutopilot={() => wizard.finish('editor')}
					onDashboard={() => wizard.finish('dashboard')}
				/>
			)}
		</WizardShell>
	);
};

export default OnboardingWizard;
