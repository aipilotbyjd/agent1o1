import { createContext, type Dispatch } from 'react';
import type { IOnboardingState, TOnboardingAction } from './OnboardingStore.context';

export interface IOnboardingStoreContext {
	state: IOnboardingState;
	dispatch: Dispatch<TOnboardingAction>;
}

export const OnboardingStoreContext = createContext<IOnboardingStoreContext | null>(null);
