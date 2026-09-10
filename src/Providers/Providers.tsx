import { ThemeContextProvider } from '@/context/theme';
import { ConfirmProvider } from '@/context/confirm';
import { AuthProvider } from '@/context/auth';

const Providers = () => {
	return (
		<ThemeContextProvider>
			<ConfirmProvider>
				{/* <Outlet /> must be used in the innermost provider. */}
				<AuthProvider />
			</ConfirmProvider>
		</ThemeContextProvider>
	);
};

export default Providers;
