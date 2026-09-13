import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { OnboardingService, onboardingKeys } from '@/api/modules/onboarding';
import pages from '@/Routes/pages';

/** Where a fully onboarded user lands after signing in. */
export const AFTER_AUTH_PATH = pages.main.dashboard.to;

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
					navigate(pages.pagesExamples.onboarding.to, { replace: true });
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
