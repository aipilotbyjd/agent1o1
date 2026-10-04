import { createContext } from 'react';
import type { IRealtimeContextProps } from './realtime.types';

const RealtimeContext = createContext<IRealtimeContextProps>({ echo: null });

export default RealtimeContext;
