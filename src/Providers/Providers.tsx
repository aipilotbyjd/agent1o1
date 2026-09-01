import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/api';
import { ThemeContextProvider } from '@/context/themeContext';
import { AuthProvider } from '@/context/authContext';

const queryClient = createQueryClient();

const Providers = () => {
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
