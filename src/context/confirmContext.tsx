import {
	createContext,
	FC,
	ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react';
import ConfirmDialog, { IConfirmDialogOptions } from '@/components/ui/ConfirmDialog';

// @start-snippet:: interface
export type TConfirmFn = (options?: IConfirmDialogOptions) => Promise<boolean>;

export interface IConfirmContextProps {
	/**
	 * Opens a confirmation dialog and resolves to `true` when the user confirms
	 * or `false` when they cancel / dismiss it. Designed as a drop-in,
	 * promise-based replacement for `window.confirm`.
	 */
	confirm: TConfirmFn;
}
// @end-snippet:: interface

const ConfirmContext = createContext<IConfirmContextProps>({} as IConfirmContextProps);

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

/**
 * Access the imperative confirmation dialog.
 *
 * @example
 * const { confirm } = useConfirm();
 * if (await confirm({ message: `Delete "${name}"?` })) {
 *   await deleteMutation.mutateAsync(id);
 * }
 */
export const useConfirm = (): IConfirmContextProps => useContext(ConfirmContext);

export default ConfirmContext;
