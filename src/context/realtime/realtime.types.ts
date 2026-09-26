// ============================================================
// Realtime Context Types
// ============================================================
import type Echo from 'laravel-echo';

export interface IRealtimeContextProps {
	echo: Echo<'reverb'> | null;
}
