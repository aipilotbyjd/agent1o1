import { createContext } from 'react';
import type { IAuthContextProps } from './auth.types';

const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

export default AuthContext;
