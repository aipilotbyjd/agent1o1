/** "Sep 26, 2026". Returns null when the value is empty or not a valid date. */
const formatDate = (value?: string | null): string | null => {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date);
};

export default formatDate;
