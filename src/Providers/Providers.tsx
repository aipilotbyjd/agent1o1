import { ThemeContextProvider } from '@/context/theme';
import { AuthProvider } from '@/context/auth';

const Providers = () => {
	return (
		<ThemeContextProvider>
			{/* <Outlet /> must be used in the innermost provider. */}
			<AuthProvider />
		</ThemeContextProvider>
	);
};

export default Providers;
