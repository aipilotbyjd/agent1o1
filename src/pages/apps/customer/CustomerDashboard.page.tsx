import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { OutletContextType } from '@/pages/apps/sales/_layouts/Sales.layout';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';

const CustomerDashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<Breadcrumb list={[{ ...pages.apps.customer }]} />);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<EXAMPLE.PageSections.TitleBars.ProjectAndUsers />
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<EXAMPLE.DataVisualization.Stat.CardsAndAction />
					</div>
					<div className='col-span-12 xl:col-span-4'>
						<EXAMPLE.DataVisualization.InteractiveDataCards.LineChartWithDatepicker />
					</div>
					<div className='col-span-12 xl:col-span-8'>
						<EXAMPLE.DataVisualization.InteractiveDataCards.StatsWithLineChart />
					</div>
					<div className='col-span-12'>
						<EXAMPLE.DataVisualization.ChartAndGraph.TimelineChartReport />
					</div>
					<div className='col-span-12'>
						<EXAMPLE.Table.Users.Customer />
					</div>
				</div>
			</Container>
		</>
	);
};

export default CustomerDashboardPage;
