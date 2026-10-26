// ============================================================
// Realtime Context Types
// ============================================================
import type Echo from 'laravel-echo';

export type TRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface IRealtimeContextProps {
	echo: Echo<'reverb'> | null;
	status: TRealtimeStatus;
}
