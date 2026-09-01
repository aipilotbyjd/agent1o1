import Container from '@/components/layout/Container';
import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from '@/pages/apps/invoices/_layouts/Invoice.layout';
import EXAMPLE from '@/examples/_index';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';

const InvoicesListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[{ ...pages.apps.invoices }, { ...pages.apps.invoices.subPages.list }]}
			/>,
		);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<EXAMPLE.Ui.Dropdown.CompanyDetails />
					<SubheaderSeparator />
					<EXAMPLE.Ui.Dropdown.Project />
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.Datepicker />
				</SubheaderRight>
			</Subheader>
			<Container>
				<EXAMPLE.Table.Orders.SearchableFilterOrderTable />
			</Container>
		</>
	);
};

export default InvoicesListPage;
