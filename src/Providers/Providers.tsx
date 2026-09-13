import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/core';
import { ThemeContextProvider } from '@/context/theme';
import { AuthProvider } from '@/context/auth';

const Providers = () => {
	const [queryClient] = useState(() => createQueryClient());

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
