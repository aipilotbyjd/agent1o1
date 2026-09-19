import { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import ConfirmDialog, { IConfirmDialogOptions } from '@/components/ui/ConfirmDialog';
import ConfirmContext from './ConfirmContext';
import type { IConfirmContextProps, TConfirmFn } from './confirm.types';

interface IConfirmState extends IConfirmDialogOptions {
	isOpen: boolean;
}

interface IConfirmProviderProps {
	children: ReactNode;
}

/**
 * Provides an imperative, promise-based confirmation dialog to the whole app.
 * A single {@link ConfirmDialog} instance is mounted here and reused for every
 * call, so consumers only need `const { confirm } = useConfirm()`.
 */
export const ConfirmProvider: FC<IConfirmProviderProps> = ({ children }) => {
	const [state, setState] = useState<IConfirmState>({ isOpen: false });
	// Holds the resolver for the promise handed back to the current caller.
	const resolverRef = useRef<((value: boolean) => void) | null>(null);

	const settle = useCallback((value: boolean) => {
		resolverRef.current?.(value);
		resolverRef.current = null;
		setState((prev) => ({ ...prev, isOpen: false }));
	}, []);

	const confirm = useCallback<TConfirmFn>((options) => {
		return new Promise<boolean>((resolve) => {
			// If a dialog is somehow already open, resolve it as cancelled first.
			resolverRef.current?.(false);
			resolverRef.current = resolve;
			setState({ ...options, isOpen: true });
		});
	}, []);

	const value = useMemo<IConfirmContextProps>(() => ({ confirm }), [confirm]);

	return (
		<ConfirmContext.Provider value={value}>
			{children}
			<ConfirmDialog
				isOpen={state.isOpen}
				title={state.title}
				message={state.message}
				confirmText={state.confirmText}
				cancelText={state.cancelText}
				tone={state.tone}
				onConfirm={() => settle(true)}
				onCancel={() => settle(false)}
			/>
		</ConfirmContext.Provider>
	);
};
