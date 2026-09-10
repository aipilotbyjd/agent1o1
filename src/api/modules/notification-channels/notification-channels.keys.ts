export const notificationChannelKeys = {
	all: (ws: string) => ['notification-channels', ws] as const,
	lists: (ws: string) => ['notification-channels', ws, 'list'] as const,
	list: (ws: string) => ['notification-channels', ws, 'list'] as const,
};
