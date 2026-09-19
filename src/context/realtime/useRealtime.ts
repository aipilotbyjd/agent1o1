import { useContext } from 'react';
import RealtimeContext from './RealtimeContext';

export const useRealtime = () => useContext(RealtimeContext);
