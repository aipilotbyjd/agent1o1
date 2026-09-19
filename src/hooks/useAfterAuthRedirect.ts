import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { OnboardingService, onboardingKeys } from '@/api/modules/onboarding';
import { UserService, userKeys } from '@/api/modules/user';
import pages, { type TPages } from '@/Routes/pages';

/** Where a fully onboarded user lands after signing in. The dashboard is
 *  workspace scoped, so this is the picker: the workspace id is only known
 *  once the current user is loaded, and a user may not have one at all. */
export const AFTER_AUTH_PATH = pages.choose.to;

const DASHBOARD_PATH = (pages.workspace.subPages as TPages).dashboard.to;

/** Onboarding state is advisory — a lookup failure here must never strand a
 *  user who just authenticated successfully, so it resolves to `null`
 *  (nothing to redirect for) rather than throwing. */
const resolveWelcomePath = async (queryClient: QueryClient): Promise<string | null> => {
	try {
		const state = await queryClient.fetchQuery({
			queryKey: onboardingKeys.state(),
			queryFn: ({ signal }) => OnboardingService.state(signal),
		});
		return !state.completed && !state.dismissed ? pages.welcome.to : null;
	} catch {
		return null;
	}
};

/** Resolves the current user's workspace dashboard, or `null` if they don't
 *  have one yet (or the lookup fails) — either case falls through to the
 *  caller's own fallback. */
const resolveWorkspacePath = async (queryClient: QueryClient): Promise<string | null> => {
	try {
		const user = await queryClient.fetchQuery({
			queryKey: userKeys.current(),
			queryFn: ({ signal }) => UserService.fetchMe(signal),
		});
		return user.current_workspace_id
			? DASHBOARD_PATH.replace(':workspaceId', user.current_workspace_id)
			: null;
	} catch {
		return null;
	}
};

// ============================================================
// useAfterAuthRedirect
// ------------------------------------------------------------
// Every entry point into a session (login, signup, social exchange)
// ends here, so the "onboard first, then land on a workspace" decision
// is made in exactly one place instead of several.
// ============================================================
export const useAfterAuthRedirect = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useCallback(
		async (fallback: string = AFTER_AUTH_PATH) => {
			const welcomePath = await resolveWelcomePath(queryClient);
			if (welcomePath) {
				navigate(welcomePath, { replace: true });
				return;
			}

			// Only resolve a workspace when nothing more specific was asked
			// for: an explicit `fallback` is the page the user was bounced off.
			if (fallback === AFTER_AUTH_PATH) {
				const workspacePath = await resolveWorkspacePath(queryClient);
				if (workspacePath) {
					navigate(workspacePath, { replace: true });
					return;
				}
			}

			navigate(fallback, { replace: true });
		},
		[navigate, queryClient],
	);
};

export default useAfterAuthRedirect;
