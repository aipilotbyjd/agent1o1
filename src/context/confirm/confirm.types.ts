// ============================================================
// Confirm Context Types
// ============================================================
import type { IConfirmDialogOptions } from '@/components/ui/ConfirmDialog';

export type TConfirmFn = (options?: IConfirmDialogOptions) => Promise<boolean>;

export interface IConfirmContextProps {
	/**
	 * Opens a confirmation dialog and resolves to `true` when the user confirms
	 * or `false` when they cancel / dismiss it. Designed as a drop-in,
	 * promise-based replacement for `window.confirm`.
	 */
	confirm: TConfirmFn;
}
