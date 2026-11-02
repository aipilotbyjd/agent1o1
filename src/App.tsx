import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/core';
import Routes from './Routes';
import getOS from './utils/getOS.util';

const App = () => {
	getOS();

	// One client for the app's lifetime; every `@/api` hook needs it.
	const [queryClient] = useState(createQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			<Routes />
		</QueryClientProvider>
	);
};

export default App;
