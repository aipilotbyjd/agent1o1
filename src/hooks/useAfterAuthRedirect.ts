import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { OnboardingService, onboardingKeys } from '@/api/modules/onboarding';
import pages from '@/Routes/pages';

/** Where a fully onboarded user lands after signing in. */
export const AFTER_AUTH_PATH = pages.onboarding.subPages.workspaceList.to;

// ============================================================
// useAfterAuthRedirect
// ------------------------------------------------------------
// Every entry point into a session (login, 2FA, register, social
// exchange) ends here, so the "onboard first" decision is made in
// exactly one place instead of four. The old app read onboarding
// off the login response; the current API exposes it as its own
// endpoint (GET /user/onboarding), so it is fetched here.
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

			navigate(fallback, { replace: true });
		},
		[navigate, queryClient],
	);
};

export default useAfterAuthRedirect;
