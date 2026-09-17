import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { OnboardingService, onboardingKeys } from '@/api/modules/onboarding';
import { UserService, userKeys } from '@/api/modules/user';
import pages, { type TPages } from '@/Routes/pages';

/** Where a fully onboarded user lands after signing in. The dashboard is
 *  workspace scoped, so this is the picker: the workspace id is only known
 *  once the current user is loaded, and a user may not have one at all. */
export const AFTER_AUTH_PATH = pages.choose.to;

const dashboardPath = (pages.workspace.subPages as TPages).dashboard.to;

// ============================================================
// useAfterAuthRedirect
// ------------------------------------------------------------
// Every entry point into a session (login, 2FA, register, social
// exchange) ends here, so the "onboard first" decision is made in
// exactly one place instead of four.
// ============================================================
export const useAfterAuthRedirect = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useCallback(
		async (fallback: string = AFTER_AUTH_PATH) => {
			try {
				const state = await queryClient.fetchQuery({
					queryKey: onboardingKeys.state(),
					queryFn: ({ signal }) => OnboardingService.state(signal),
				});

				if (!state.completed && !state.dismissed) {
					navigate(pages.onboarding.to, { replace: true });
					return;
				}
			} catch {
				// Onboarding state is advisory — a failure here must never
				// strand a user who just authenticated successfully.
			}

			// Only resolve a workspace when nothing more specific was asked
			// for: an explicit `fallback` is the page the user was bounced off.
			if (fallback === AFTER_AUTH_PATH) {
				try {
					const user = await queryClient.fetchQuery({
						queryKey: userKeys.current(),
						queryFn: ({ signal }) => UserService.fetchMe(signal),
					});

					if (user.current_workspace_id) {
						navigate(dashboardPath.replace(':workspaceId', user.current_workspace_id), {
							replace: true,
						});
						return;
					}
				} catch {
					// Fall through to the picker.
				}
			}

			navigate(fallback, { replace: true });
		},
		[navigate, queryClient],
	);
};

export default useAfterAuthRedirect;
