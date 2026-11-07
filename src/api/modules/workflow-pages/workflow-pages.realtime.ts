import type { IEchoLike } from '@/api/modules/workflow-builder/workflow-builder.realtime';

/** Mirrors App\Broadcasting\Channels::PAGE_PATTERN. */
export const pageChannelName = (workspaceId: string, pageId: string) =>
	`workspaces.${workspaceId}.pages.${pageId}`;

/** `App\Events\Pages\PageActivity::broadcastAs()` names; the dot stops Echo adding a namespace. */
const PAGE_EVENTS = {
	comments: '.page.comments',
	generation: '.page.generation',
} as const;

export type TPageGenerationEvent = { id: string; status: 'completed' | 'failed' };

/**
 * Listens on a page's private channel while it's open in the builder.
 * Events carry ids only; the handlers refetch. Returns an unsubscribe.
 */
export const subscribeToPage = (
	echo: IEchoLike,
	workspaceId: string,
	pageId: string,
	handlers: { onComments: () => void; onGeneration: (event: TPageGenerationEvent) => void },
): (() => void) => {
	const channel = pageChannelName(workspaceId, pageId);
	echo.private(channel)
		.listen(PAGE_EVENTS.comments, () => handlers.onComments())
		.listen(PAGE_EVENTS.generation, (payload) =>
			handlers.onGeneration(payload as TPageGenerationEvent),
		);
	return () => echo.leave(channel);
};
