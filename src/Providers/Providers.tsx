import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/core';
import { ThemeContextProvider } from '@/context/themeContext';
import { AuthProvider } from '@/context/authContext';

const Providers = () => {
	// Created once per app instance — a client rebuilt on render would
	// throw the cache away (and with it the signed-in user) every time.
	const [queryClient] = useState(createQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeContextProvider>
				{/* <Outlet /> must be used in the innermost provider. */}
				<AuthProvider />
			</ThemeContextProvider>
		</QueryClientProvider>
	);
};

export default Providers;
