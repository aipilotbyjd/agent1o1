import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/core';
import { ThemeContextProvider } from '@/context/theme';
import { ConfirmProvider } from '@/context/confirm';
import { AuthProvider } from '@/context/auth';

const Providers = () => {
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeContextProvider>
				<ConfirmProvider>
					{/* <Outlet /> must be used in the innermost provider. */}
					<AuthProvider />
				</ConfirmProvider>
			</ThemeContextProvider>
		</QueryClientProvider>
	);
};

export default Providers;
