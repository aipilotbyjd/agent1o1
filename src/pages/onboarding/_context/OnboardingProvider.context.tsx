import type { ReactNode } from 'react';
import { OnboardingStoreProvider } from './OnboardingStore.context';

const OnboardingProvider = ({ children }: { children: ReactNode }) => {
	return <OnboardingStoreProvider>{children}</OnboardingStoreProvider>;
};

export default OnboardingProvider;
