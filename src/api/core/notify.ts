import { toast } from 'react-toastify';
import { ApiError } from './errors';

export const notify = {
	success: (msg: string) => toast.success(msg),
	error: (msg: string) => toast.error(msg),
	info: (msg: string) => toast.info(msg),
	warn: (msg: string) => toast.warn(msg),

	fromError:
		(fallback: string) =>
		(e: unknown): void => {
			toast.error(ApiError.is(e) ? e.message : fallback);
		},
};
