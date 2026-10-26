import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAuth } from '@/context/auth';
import { getAccessToken, TOKEN_CHANGE_EVENT } from '@/api/core/token-manager';
import { useQueryClient } from '@tanstack/react-query';
import { notificationKeys } from '@/api/modules/notifications/notifications.keys';
import { announcementKeys } from '@/api/modules/announcements/announcements.keys';
import { notify } from '@/api/core';
import RealtimeContext from './RealtimeContext';
import type { TRealtimeStatus } from './realtime.types';

const statusFor = (connectionState: string, hasConnected: boolean): TRealtimeStatus => {
	if (connectionState === 'connected') return 'connected';
	if (connectionState === 'failed' || connectionState === 'disconnected') return 'offline';
	return hasConnected ? 'reconnecting' : 'connecting';
};

// Ensure Pusher is on window for Laravel Echo
if (typeof window !== 'undefined') {
	(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;
}

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
	const userId = useAuth().userData?.id;
	const [echo, setEcho] = useState<Echo<'reverb'> | null>(null);
	const [status, setStatus] = useState<TRealtimeStatus>('connecting');
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
		if (!token || !userId) return;

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

		// Without a real app key the connection can never authenticate: skip it so
		// we don't spam failed WebSocket attempts. Notifications still refresh via
		// polling + query invalidation until Reverb is configured.
		if (!reverbAppKey) {
			console.warn(
				'[realtime] VITE_REVERB_APP_KEY is not set: skipping WebSocket connection.',
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
			authEndpoint: `${apiBase}/api/broadcasting/auth`,
			auth: {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		});

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setEcho(newEcho);

		// Laravel broadcasts a notification to its notifiable's own channel.
		newEcho
			.private(`App.Models.User.${userId}`)
			.notification((notification: { title?: string }) => {
				notify.success(notification.title || 'New notification received');
				qc.invalidateQueries({ queryKey: ['notifications'] });
				qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
			});

		let hasConnected = false;
		let lastStatus: TRealtimeStatus = 'connecting';
		const onStateChange = ({ current }: { current: string }) => {
			const next = statusFor(current, hasConnected);
			if (lastStatus === 'connected' && next !== 'connected') {
				notify.warn('Live updates paused. Reconnecting…');
			}
			lastStatus = next;
			setStatus(next);
			if (next !== 'connected') return;
			// Events are not replayed, so what arrived while the socket was down is
			// read again once it is back.
			if (hasConnected) qc.invalidateQueries();
			hasConnected = true;
		};
		const { connection } = newEcho.connector.pusher;
		connection.bind('state_change', onStateChange);

		// Platform banners and maintenance notices. The event carries no content
		// (who sees what is decided per member), it only says to refetch.
		newEcho
			.private('announcements')
			.listen('.announcements.changed', () =>
				qc.invalidateQueries({ queryKey: announcementKeys.all }),
			);

		return () => {
			connection.unbind('state_change', onStateChange);
			newEcho.disconnect();
			setEcho(null);
			setStatus('offline');
		};
	}, [userId, token, qc]);

	return <RealtimeContext.Provider value={{ echo, status }}>{children}</RealtimeContext.Provider>;
};
