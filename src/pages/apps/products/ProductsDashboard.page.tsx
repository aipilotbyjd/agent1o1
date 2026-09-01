import Container from '@/components/layout/Container';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { OutletContextType } from '@/pages/apps/sales/_layouts/Sales.layout';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';

const ProductsDashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.apps.products }]} />);
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
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.InviteUser />
					<SubheaderSeparator />
					<EXAMPLE.Ui.Dropdown.Assign />
				</SubheaderRight>
			</Subheader>
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<EXAMPLE.DataVisualization.Stat.WithIcon />
					</div>

					<div className='col-span-12 xl:col-span-4'>
						<EXAMPLE.DataVisualization.DataCard.Browser />
					</div>
					<div className='col-span-12 xl:col-span-4'>
						<EXAMPLE.DataVisualization.InteractiveDataCards.Traffic />
					</div>
					<div className='col-span-12 xl:col-span-4'>
						<EXAMPLE.DataVisualization.InteractiveDataCards.LineChartWithDatepicker />
					</div>
					<div className='col-span-12'>
						<EXAMPLE.Table.Products.Expandable />
					</div>
				</div>
			</Container>
		</>
	);
};

export default ProductsDashboardPage;
