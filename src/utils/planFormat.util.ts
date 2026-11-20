/** A plan limit as people read it: `-1` (or none) is unlimited. */
export const formatPlanLimit = (value: number | null | undefined) =>
	value === null || value === undefined || value < 0 ? '∞' : value.toLocaleString();

/** A price in cents, in dollars without trailing zeros: 2900 → "29", 2950 → "29.50". */
export const formatPlanPrice = (cents: number) =>
	(cents / 100).toLocaleString('en-US', {
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	});
