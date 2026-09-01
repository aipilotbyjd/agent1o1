import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { OutletContextType } from '@/pages/apps/invoices/_layouts/Invoice.layout';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';

const InvoicesDashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.apps.invoices }]} />);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<EXAMPLE.Ui.Dropdown.Project />
					<SubheaderSeparator />
					<EXAMPLE.Ui.Dropdown.CompanyDetails />
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.Datepicker />
				</SubheaderRight>
			</Subheader>
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<EXAMPLE.DataVisualization.Stat.WithIcon />
					</div>
					<div className='col-span-12 xl:col-span-4'>
						<EXAMPLE.DataVisualization.InteractiveDataCards.LineChartWithDatepicker />
					</div>
					<div className='col-span-12 xl:col-span-8'>
						<EXAMPLE.DataVisualization.ChartAndGraph.LineChartDatepicker />
					</div>
					<div className='col-span-12'>
						<EXAMPLE.Table.Orders.SearchableFilterOrderTable />
					</div>
				</div>
			</Container>
		</>
	);
};

export default InvoicesDashboardPage;
