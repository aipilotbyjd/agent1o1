import { useContext } from 'react';
import { OnboardingStoreContext } from '../_context/onboardingStoreContext';

export const useOnboardingStore = () => {
	const ctx = useContext(OnboardingStoreContext);
	if (!ctx) throw new Error('useOnboardingStore must be used within OnboardingStoreProvider');
	return ctx;
};
