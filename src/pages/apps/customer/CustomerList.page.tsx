import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useNavigate, useOutletContext } from 'react-router';
import { OutletContextType } from '@/pages/apps/sales/_layouts/Sales.layout';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

const CustomerListPage = () => {
	const navigate = useNavigate();

	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[{ ...pages.apps.customer }, { ...pages.apps.customer.subPages.list }]}
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
					<FieldWrap firstSuffix={<Icon icon='Search02' />}>
						<Input
							name='search'
							variant='solid'
							placeholder='Search...'
							dimension='sm'
						/>
					</FieldWrap>
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.Others />
					<SubheaderSeparator />
					<Button
						aria-label='New Customer'
						variant='soft'
						icon='UserAdd02'
						onClick={() =>
							navigate(`${pages.apps.customer.subPages.edit.to}?customerId=new`)
						}>
						New Customer
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
				<EXAMPLE.Table.Users.Customer />
			</Container>
		</>
	);
};

export default CustomerListPage;
