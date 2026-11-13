import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api/core';
import { ThemeContextProvider } from '@/context/theme';
import { ConfirmProvider } from '@/context/confirm';
import { AuthProvider } from '@/context/auth';
import { BrandProvider } from '@/context/brand';

const Providers = () => {
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeContextProvider>
				<ConfirmProvider>
					<BrandProvider>
						{/* <Outlet /> must be used in the innermost provider. */}
						<AuthProvider />
					</BrandProvider>
				</ConfirmProvider>
			</ThemeContextProvider>
		</QueryClientProvider>
	);
};

export default Providers;
