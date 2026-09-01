import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from '@/pages/apps/products/_layouts/Products.layout';

const ProductsListPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[{ ...pages.apps.products }, { ...pages.apps.products.subPages.list }]}
			/>,
		);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Container>
				<EXAMPLE.Table.Products.Expandable />
			</Container>
		</>
	);
};

export default ProductsListPage;
