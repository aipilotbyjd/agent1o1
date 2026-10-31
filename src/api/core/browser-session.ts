// ============================================================
// Browser Session
// ------------------------------------------------------------
// A cookie with no expiry: the browser keeps it for every tab
// until it quits, then drops it. A sign-in made without "remember
// me" lives only while this marker does.
// ============================================================

const COOKIE_NAME = 'a1o1_browser_session';

export const browserSession = {
	isActive: (): boolean => {
		try {
			return document.cookie
				.split('; ')
				.some((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
		} catch {
			return false;
		}
	},

	start: (): void => {
		try {
			document.cookie = `${COOKIE_NAME}=1; path=/; SameSite=Lax`;
		} catch {
			// Cookies blocked: the sign-in then ends with the next read, as a signed-out visit would.
		}
	},

	end: (): void => {
		try {
			document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
		} catch {
			// Nothing to clear.
		}
	},
};
