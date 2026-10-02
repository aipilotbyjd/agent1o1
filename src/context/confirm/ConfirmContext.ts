import { createContext } from 'react';
import type { IConfirmContextProps } from './confirm.types';

const ConfirmContext = createContext<IConfirmContextProps>({} as IConfirmContextProps);

export default ConfirmContext;
