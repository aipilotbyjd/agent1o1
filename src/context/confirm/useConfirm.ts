import { useContext } from 'react';
import ConfirmContext from './ConfirmContext';
import type { IConfirmContextProps } from './confirm.types';

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
