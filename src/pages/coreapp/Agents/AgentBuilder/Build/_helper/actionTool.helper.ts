export const prettifyActionTool = (raw: string) =>
	raw.replace(/[_-]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
