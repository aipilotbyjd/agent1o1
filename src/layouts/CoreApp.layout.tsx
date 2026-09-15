import { Navigate, Outlet, useParams } from 'react-router';
import { Suspense } from 'react';
import Wrapper from '@/components/layout/Wrapper';
import CoreAppAsideTemplate from '@/templates/asides/CoreAppAside.template';
import Container from '@/components/layout/Container';
import Skeleton from '@/components/ui/Skeleton';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';

const CoreAppLayout = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { workspaces, isLoading } = useWorkspaceContext();

	if (!isLoading && !workspaces.some((w) => w.id === workspaceId)) {
		return <Navigate to={pages.choose.to} replace />;
	}

	return (
		<>
			<CoreAppAsideTemplate />
			<Wrapper>
				<Suspense
					fallback={
						<>
							<Header>
								<HeaderLeft>
									<Skeleton className='h-6 w-1/3' />
								</HeaderLeft>
								<HeaderRight>
									<Skeleton className='h-6 w-1/3' />
								</HeaderRight>
							</Header>
							<Subheader>
								<SubheaderLeft>
									<Skeleton className='h-6 w-1/3' />
								</SubheaderLeft>
								<SubheaderRight>
									<Skeleton className='h-6 w-1/3' />
								</SubheaderRight>
							</Subheader>
							<Container className='p-8 text-center'>
								<div className='grid grid-cols-12 gap-4'>
									<div className='col-span-12 h-32'>
										<Skeleton className='h-full w-full' />
									</div>
									<div className='col-span-4 h-96'>
										<Skeleton className='h-full w-full' />
									</div>
									<div className='col-span-8 h-96'>
										<Skeleton className='h-full w-full' />
									</div>
									<div className='col-span-8 h-96'>
										<Skeleton className='h-full w-full' />
									</div>
									<div className='col-span-4 h-96'>
										<Skeleton className='h-full w-full' />
									</div>
								</div>
							</Container>
						</>
					}>
					<Outlet />
				</Suspense>
			</Wrapper>
		</>
	);
};

export default CoreAppLayout;
