// ============================================================
// Timezone Types
// ------------------------------------------------------------
// The backend's list (`Timezones::options()` on agent-1o1-ai): current
// IANA names only, each labelled with its UTC offset right now.
// ============================================================
export type TTimezone = {
	id: string;
	/** "Asia/Kolkata (UTC+05:30)". */
	label: string;
};
