import { createContext } from 'react';
import type { IRealtimeContextProps } from './realtime.types';

const RealtimeContext = createContext<IRealtimeContextProps>({ echo: null, status: 'offline' });

export default RealtimeContext;
