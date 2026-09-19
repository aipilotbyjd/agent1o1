import { createContext } from 'react';
import type { IWorkspaceContextProps } from './workspace.types';

const WorkspaceContext = createContext<IWorkspaceContextProps>({} as IWorkspaceContextProps);

export default WorkspaceContext;
