import { Outlet } from 'react-router';
import { Suspense } from 'react';
import Wrapper from '@/components/layout/Wrapper';
import SettingsAsideTemplate from '@/templates/asides/SettingsAside.template';
import Container from '@/components/layout/Container';
import Skeleton from '@/components/ui/Skeleton';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import EXAMPLE from '@/examples/_index';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';

const SettingsLayout = () => {
	return (
		<>
			<SettingsAsideTemplate />
			<Wrapper borderDisabled={true} className='min-h-0 overflow-y-auto'>
				<Header>
					<HeaderLeft>Settings</HeaderLeft>
					<HeaderRight>
						<NotificationsDropdown />
						<EXAMPLE.Ui.Dropdown.WorkspaceSwitcher />
					</HeaderRight>
				</Header>
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

export default SettingsLayout;
