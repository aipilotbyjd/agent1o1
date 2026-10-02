import { useAuth } from '@/context/auth';
import { useOnboardingStore } from '../_context/OnboardingStore.context';

/**
 * The workspace everything after step 2 is scoped to — connector credentials
 * and plan checkout both need it. Prefers the one this run just created and
 * falls back to the user's current workspace, which covers a resumed or
 * already-onboarded session. Empty string when there is none yet, which the
 * workspace-scoped queries treat as "don't fetch".
 */
export const useOnboardingWorkspaceId = () => {
	const { userData } = useAuth();
	const { state } = useOnboardingStore();

	return state.createdWorkspaceId || userData?.current_workspace_id || '';
};
