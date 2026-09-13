import { FC, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateWorkspace } from '@/api/modules/workspaces';
import { onboardingKeys } from '@/api/modules/onboarding';
import { userKeys } from '@/api/modules/user';
import { useAuth } from '@/context/authContext';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Alert from '@/components/ui/Alert';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

// Creating a workspace also sets it as the user's current one
// (`WorkspaceService::create`), which is what every later step —
// inviting teammates especially — is scoped to. So this step is the
// one that can't be skipped.
const CreateWorkspaceStep: FC<TOnboardingStepProps> = ({ onNext, onBack }) => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const createWorkspace = useCreateWorkspace();

	// `GET /user` doesn't eager-load the relation, so `current_workspace`
	// is often absent while the id is always there — gate on the id.
	const hasWorkspace = !!user?.current_workspace_id;
	const existingName = user?.current_workspace?.name;
	const [name, setName] = useState('');

	const handleSubmit = () => {
		if (hasWorkspace) {
			onNext();
			return;
		}
		createWorkspace.mutate(
			{ name: name.trim() },
			{
				onSuccess: () => {
					// The new workspace becomes `user.current_workspace_id`,
					// which both the profile and the snapshot read from.
					queryClient.invalidateQueries({ queryKey: userKeys.current() });
					queryClient.invalidateQueries({ queryKey: onboardingKeys.state() });
					onNext();
				},
			},
		);
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>Create your workspace</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				Workspaces hold your agents, workflows and connectors. You can create more later.
			</p>

			<div className='mt-6'>
				{hasWorkspace ? (
					<Alert color='emerald' icon='Tick02' title='Workspace ready'>
						{existingName
							? `You're working in ${existingName}.`
							: 'Your workspace is set up and ready.'}
					</Alert>
				) : (
					<div>
						<Label htmlFor='workspaceName'>Workspace name</Label>
						<Input
							className='bg-transparent!'
							id='workspaceName'
							name='workspaceName'
							value={name}
							autoFocus
							onChange={(e) => setName(e.target.value)}
							placeholder='Acme Automation'
						/>
						<p className='mt-2 text-xs text-zinc-500'>
							Usually your company or team name.
						</p>
					</div>
				)}
			</div>

			<StepFooter
				onBack={onBack}
				submitLabel={hasWorkspace ? 'Continue' : 'Create workspace'}
				onSubmit={handleSubmit}
				isLoading={createWorkspace.isPending}
				isDisabled={!hasWorkspace && name.trim().length === 0}
			/>
		</div>
	);
};

export default CreateWorkspaceStep;
