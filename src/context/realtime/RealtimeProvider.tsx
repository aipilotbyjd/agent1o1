import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useWorkspaceContext } from '@/context/workspace';
import { getAccessToken, TOKEN_CHANGE_EVENT } from '@/api/core/token-manager';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/api/modules/notifications/notifications.keys';
import { notify } from '@/api/core';
import RealtimeContext from './RealtimeContext';

// Ensure Pusher is on window for Laravel Echo
if (typeof window !== 'undefined') {
	(window as any).Pusher = Pusher;
}

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
	const { activeWorkspaceId } = useWorkspaceContext();
	const [echo, setEcho] = useState<Echo<any> | null>(null);
	const qc = useQueryClient();

	// Track the token in state so we re-subscribe on login/logout/refresh instead
	// of reading localStorage on every render.
	const [token, setToken] = useState<string | null>(() => getAccessToken());

	useEffect(() => {
		const syncToken = () => setToken(getAccessToken());
		window.addEventListener(TOKEN_CHANGE_EVENT, syncToken);
		window.addEventListener('storage', syncToken);
		return () => {
			window.removeEventListener(TOKEN_CHANGE_EVENT, syncToken);
			window.removeEventListener('storage', syncToken);
		};
	}, []);

	useEffect(() => {
		if (!token || !activeWorkspaceId) {
			if (echo) {
				echo.disconnect();
				setEcho(null);
			}
			return;
		}

		const apiUrl = import.meta.env.VITE_API_URL || 'https://agent1o1.test/api/v1';
		const apiBase = apiUrl.replace('/api/v1', '');

		// Default the Reverb host to the API host (not window.location) so it never
		// falls back to `localhost`, which has no WebSocket server.
		let apiHostname = window.location.hostname;
		try {
			apiHostname = new URL(apiUrl).hostname;
		} catch {
			/* keep window hostname */
		}

		const reverbAppKey = import.meta.env.VITE_REVERB_APP_KEY;
		const reverbHost = import.meta.env.VITE_REVERB_HOST || apiHostname;
		const reverbPort = import.meta.env.VITE_REVERB_PORT
			? parseInt(import.meta.env.VITE_REVERB_PORT, 10)
			: 443;
		const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'https';

		// Without a real app key the connection can never authenticate — skip it so
		// we don't spam failed WebSocket attempts. Notifications still refresh via
		// polling + query invalidation until Reverb is configured.
		if (!reverbAppKey) {
			console.warn(
				'[realtime] VITE_REVERB_APP_KEY is not set — skipping WebSocket connection.',
			);
			return;
		}

		const newEcho = new Echo({
			broadcaster: 'reverb',
			key: reverbAppKey,
			wsHost: reverbHost,
			wsPort: reverbPort,
			wssPort: reverbPort,
			forceTLS: reverbScheme === 'https',
			enabledTransports: ['ws', 'wss'],
			authEndpoint: `${apiBase}/broadcasting/auth`,
			auth: {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		});

		setEcho(newEcho);

		const channel = newEcho.private(`workspace.${activeWorkspaceId}`);

		channel.listen('.notification.created', (notification: { title?: string }) => {
			// Display a toast/notification
			notify.success(notification.title || 'New notification received');
			// Invalidate every notification query (lists across filters + unread count)
			qc.invalidateQueries({ queryKey: notificationKeys.all(activeWorkspaceId) });
		});

		return () => {
			newEcho.disconnect();
		};
	}, [activeWorkspaceId, token]);

	return <RealtimeContext.Provider value={{ echo }}>{children}</RealtimeContext.Provider>;
};
