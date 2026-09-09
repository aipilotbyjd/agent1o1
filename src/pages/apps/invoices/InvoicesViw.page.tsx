import Container from '@/components/layout/Container';
import { useOutletContext, useSearchParams } from 'react-router';
import { OutletContextType } from '@/pages/apps/invoices/_layouts/Invoice.layout';
import { useEffect, useState } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import ORDERS, { IOrder } from '@/mocks/orders.mock';
import Card, { CardBody } from '@/components/ui/Card';
import { LogoDark } from '@/assets/images';
import dayjs from 'dayjs';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import priceFormat from '@/utils/priceFormat.util';
import EXAMPLE from '@/examples/_index';
import Button from '@/components/ui/Button';

const currentOrder = (id: number): IOrder | undefined => {
	return ORDERS.find((order) => order.id === id);
};

const InvoicesViwPage = () => {
	const [searchParams] = useSearchParams();
	const invoiceIdFromUrl = searchParams.get('invoiceId');

	const [data] = useState<IOrder | undefined>(currentOrder(Number(invoiceIdFromUrl)));
	console.log(data);

	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[
					{ ...pages.apps.invoices },
					{ ...pages.apps.invoices.subPages.view },
					...(invoiceIdFromUrl
						? [
								{
									...pages.apps.invoices.subPages.view,
									to: undefined,
									text: invoiceIdFromUrl || 'New',
								},
							]
						: []),
				]}
			/>,
		);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<EXAMPLE.PageSections.TitleBars.TagsAndButtons />
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12 md:col-span-8'>
						<Card>
							<CardBody className='px-16! py-8!'>
								<div className='-mx-8 flex items-center justify-between rounded-lg bg-zinc-900 p-8 text-zinc-500'>
									<div>
										<div className='mb-6'>
											<img src={LogoDark} alt='' className='h-12' />
										</div>
										<div>789 Market St, San Francisco,</div>
										<div>CA 94103, USA</div>
										<div>+1 415-555-1234</div>
									</div>
									<div>
										<div className='text-xl font-bold'>Invoice #123123</div>
										<div className='text-xl font-bold'>Order #123123</div>
										<div className='text-xl'>
											Date: {dayjs().format('D MMM, YYYY')}
										</div>
									</div>
								</div>
								<div className='mt-8 mb-4 grid grid-cols-12'>
									<div className='col-span-6'>
										<div className='text-2xl font-bold'>Invoice To:</div>
										<div>Acme Corporation</div>
										<div>123 Business Rd, New York, NY 10001, USA</div>
										<div>billing@acme.com</div>
										<div>+1 212-555-0198</div>
										<div>TAX-567-89-1011</div>
									</div>
									<div className='col-span-6'>
										<div className='text-2xl font-bold'>Ship To:</div>
										<div>Acme Corporation</div>
										<div>123 Business Rd, New York, NY 10001, USA</div>
										<div>shippig@acme.com</div>
										<div>+1 212-555-0198</div>
									</div>
								</div>

								<Table>
									<THead>
										<Tr>
											<Th className='text-start'>Item</Th>
											<Th className='text-start'>Cost</Th>
											<Th className='text-start'>Qty</Th>
											<Th className='text-start'>Price</Th>
										</Tr>
									</THead>
									<TBody>
										<Tr>
											<Td>Website Design</Td>
											<Td>{priceFormat(1200)}</Td>
											<Td>1</Td>
											<Td>{priceFormat(1200)}</Td>
										</Tr>
										<Tr>
											<Td>Monthly Hosting (May)</Td>
											<Td>{priceFormat(100)}</Td>
											<Td>12</Td>
											<Td>{priceFormat(100)}</Td>
										</Tr>
										<Tr>
											<Td>Domain Registration (1 year)</Td>
											<Td>{priceFormat(36)}</Td>
											<Td>1</Td>
											<Td>{priceFormat(36)}</Td>
										</Tr>
									</TBody>
								</Table>

								<hr className='my-8 border-dashed border-zinc-500/50' />
								<div className='grid grid-cols-12 gap-4'>
									<div className='col-span-12 flex gap-2 md:col-span-6'>
										<div className='text-zinc-500'>Salesperson:</div>
										<div className='font-bold'>John Doe</div>
									</div>
									<div className='col-span-6 flex justify-end'>
										<div className='flex w-full max-w-md flex-col gap-2'>
											<div className='flex justify-between'>
												<div className='text-zinc-500'>Subtotal</div>
												<div className='font-bold'>{priceFormat(2436)}</div>
											</div>
											<div className='flex justify-between'>
												<div className='text-zinc-500'>Discount</div>
												<div className='font-bold text-red-500'>
													-{priceFormat(200)}
												</div>
											</div>
											<div className='flex justify-between'>
												<div className='text-zinc-500'>TAX (20%)</div>
												<div className='font-bold'>
													{priceFormat(447.2)}
												</div>
											</div>
											<hr className='border-zinc-500/50' />
											<div className='flex justify-between'>
												<div className='text-2xl font-bold text-zinc-500'>
													Total
												</div>
												<div className='text-2xl font-bold'>
													{priceFormat(2683.2)}
												</div>
											</div>
										</div>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
					<div className='col-span-12 md:col-span-4'>
						<Card>
							<CardBody>
								<div className='grid grid-cols-12 gap-4'>
									<div className='col-span-12'>
										<Button
											aria-label='Download'
											variant='soft'
											className='w-full'
											dimension='lg'
											icon='FileDownload'>
											Download
										</Button>
									</div>
									<div className='col-span-6'>
										<Button
											aria-label='Print'
											variant='soft'
											className='w-full'
											dimension='lg'
											color='zinc'
											icon='Printer'>
											Print
										</Button>
									</div>
									<div className='col-span-6'>
										<Button
											aria-label='Edit'
											variant='soft'
											className='w-full'
											dimension='lg'
											color='zinc'
											icon='PencilEdit02'>
											Edit
										</Button>
									</div>
								</div>
							</CardBody>
						</Card>
						<div className='mt-4'>
							<EXAMPLE.Card.Project.Card />
						</div>
					</div>
				</div>
			</Container>
		</>
	);
};

export default InvoicesViwPage;
