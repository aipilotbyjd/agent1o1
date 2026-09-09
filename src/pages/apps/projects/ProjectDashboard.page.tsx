import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import { OutletContextType } from '@/pages/apps/projects/_layouts/Project.layout';
import Card, {
	CardBody,
	CardFooter,
	CardFooterChild,
	CardHeader,
	CardHeaderChild,
} from '@/components/ui/Card';
import { Avatar1, Avatar2, Avatar3, Avatar4, Avatar5, LogoFacit, LogoFyr } from '@/assets/images';
import Button from '@/components/ui/Button';
import dayjs from 'dayjs';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Icon from '@/components/icon/Icon';
import Progress from '@/components/ui/Progress';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import ChangeLanguageTemplate from '@/templates/header/ChangeLanguage.template';

const ProjectDashboardPage = () => {
	const { setHeaderLeft, setHeaderRight } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<EXAMPLE.Ui.Dropdown.AccountWorkspace />);
		setHeaderRight(
			<>
				<ChangeDarkModeTemplate />
				<ChangeLanguageTemplate />
				<EXAMPLE.Ui.Dropdown.Notifications />
			</>,
		);
		return () => {
			setHeaderLeft(undefined);
			setHeaderRight(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<EXAMPLE.Ui.Dropdown.InviteUser />
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.AvatarGroup />
				</SubheaderRight>
			</Subheader>
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-12'>
						<EXAMPLE.DataVisualization.Stat.WithButton />
					</div>
					<div className='col-span-12 lg:col-span-6 xl:col-span-3'>
						<EXAMPLE.Card.Project.Card />
					</div>
					<div className='col-span-12 lg:col-span-6 xl:col-span-3'>
						{/* DUPLICATE:: <EXAMPLE.Card.Project.Card />  */}
						<Card className='h-full'>
							<CardHeader className='border-b border-inherit'>
								<CardHeaderChild>
									<div className=''>
										<img src={LogoFyr} alt='' className='size-12' />
									</div>
									<div className=''>
										<div>Fyr</div>
										<div className='font-bold'>
											React Tailwind Admin Dashboard
										</div>
									</div>
								</CardHeaderChild>
								<CardHeaderChild>
									<Button aria-label='More' icon='More' variant='link' />
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='!px-0'>
								<div className='grid grid-cols-12 divide-y divide-zinc-500/25'>
									<div className='col-span-12 grid grid-cols-12 gap-4 divide-x divide-zinc-500/50 p-4'>
										<div className='col-span-4'>
											<div>36</div>
											<div className='text-zinc-500'>Tasks</div>
										</div>
										<div className='col-span-4'>
											<div>9</div>
											<div className='text-zinc-500'>In Progress</div>
										</div>
										<div className='col-span-4'>
											<div>27</div>
											<div className='text-zinc-500'>Completed</div>
										</div>
									</div>
									<div className='col-span-12 grid grid-cols-12 gap-4 p-4'>
										<div className='col-span-3 text-zinc-500'>Due Date</div>
										<div className='col-span-9'>
											{dayjs().add(4, 'day').format('DD MMM, YYYY')}
										</div>

										<div className='col-span-3 text-zinc-500'>Category</div>
										<div className='col-span-9 flex gap-2'>
											<Badge variant='soft' color='zinc'>
												<div className='h-4 w-1 rounded-2xl bg-emerald-500'></div>
												<span>Upgrade</span>
											</Badge>
											<Badge variant='soft' color='zinc'>
												<div className='h-4 w-1 rounded-2xl bg-amber-500'></div>
												<span>Update</span>
											</Badge>
										</div>

										<div className='col-span-3 text-zinc-500'>Assignee</div>
										<div className='col-span-9 flex items-center gap-2'>
											<Avatar src={Avatar1} size='w-6' />{' '}
											<span>John Doe</span>
										</div>

										<div className='col-span-3 text-zinc-500'>Team</div>
										<div className='col-span-9 flex items-center gap-2'>
											<AvatarGroup color='zinc'>
												<Avatar src={Avatar2} size='w-6' />
												<Avatar src={Avatar3} size='w-6' />
												<Avatar src={Avatar4} size='w-6' />
												<Avatar src={Avatar5} size='w-6' />
											</AvatarGroup>
										</div>
									</div>
								</div>
							</CardBody>
							<CardFooter className='border-t border-inherit pt-4'>
								<CardFooterChild>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Message01' /> <span>14</span>
									</div>
									<div className='h-4 border-e border-zinc-500/25'></div>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Attachment' /> <span>5</span>
									</div>
								</CardFooterChild>
								<CardFooterChild>
									<div className='w-32'>
										<Progress value={75} />
									</div>
									<div className='text-zinc-500'>75%</div>
								</CardFooterChild>
							</CardFooter>
						</Card>
					</div>
					<div className='col-span-12 lg:col-span-6 xl:col-span-3'>
						{/* DUPLICATE:: <EXAMPLE.Card.Project.Card />  */}
						<Card className='h-full'>
							<CardHeader className='border-b border-inherit'>
								<CardHeaderChild>
									<div className=''>
										<img src={LogoFacit} alt='' className='size-12' />
									</div>
									<div className=''>
										<div>Facit</div>
										<div className='font-bold'>React Admin Dashboard</div>
									</div>
								</CardHeaderChild>
								<CardHeaderChild>
									<Button aria-label='More' icon='More' variant='link' />
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='!px-0'>
								<div className='grid grid-cols-12 divide-y divide-zinc-500/25'>
									<div className='col-span-12 grid grid-cols-12 gap-4 divide-x divide-zinc-500/50 p-4'>
										<div className='col-span-4'>
											<div>51</div>
											<div className='text-zinc-500'>Tasks</div>
										</div>
										<div className='col-span-4'>
											<div>3</div>
											<div className='text-zinc-500'>In Progress</div>
										</div>
										<div className='col-span-4'>
											<div>48</div>
											<div className='text-zinc-500'>Completed</div>
										</div>
									</div>
									<div className='col-span-12 grid grid-cols-12 gap-4 p-4'>
										<div className='col-span-3 text-zinc-500'>Due Date</div>
										<div className='col-span-9'>
											{dayjs().add(4, 'day').format('DD MMM, YYYY')}
										</div>

										<div className='col-span-3 text-zinc-500'>Category</div>
										<div className='col-span-9'>
											<Badge variant='soft' color='zinc'>
												<div className='h-4 w-1 rounded-2xl bg-amber-500'></div>
												<span>Update</span>
											</Badge>
										</div>

										<div className='col-span-3 text-zinc-500'>Assignee</div>
										<div className='col-span-9 flex items-center gap-2'>
											<Avatar src={Avatar1} size='w-6' />{' '}
											<span>John Doe</span>
										</div>

										<div className='col-span-3 text-zinc-500'>Team</div>
										<div className='col-span-9 flex items-center gap-2'>
											<AvatarGroup color='zinc'>
												<Avatar src={Avatar2} size='w-6' />
												<Avatar src={Avatar3} size='w-6' />
												<Avatar src={Avatar4} size='w-6' />
												<Avatar src={Avatar5} size='w-6' />
											</AvatarGroup>
										</div>
									</div>
								</div>
							</CardBody>
							<CardFooter className='border-t border-inherit pt-4'>
								<CardFooterChild>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Message01' /> <span>23</span>
									</div>
									<div className='h-4 border-e border-zinc-500/25'></div>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Attachment' /> <span>7</span>
									</div>
								</CardFooterChild>
								<CardFooterChild>
									<div className='w-32'>
										<Progress value={94} />
									</div>
									<div className='text-zinc-500'>94%</div>
								</CardFooterChild>
							</CardFooter>
						</Card>
					</div>

					<div className='col-span-12 lg:col-span-6 xl:col-span-3'>
						<EXAMPLE.Card.Integrations.Card />
					</div>

					<div className='col-span-12 xl:col-span-6'>
						<EXAMPLE.DataVisualization.ChartAndGraph.TimelineChart />
					</div>
					<div className='col-span-12 xl:col-span-6'>
						<EXAMPLE.Table.Projects.SearchableFilter />
					</div>
				</div>
			</Container>
		</>
	);
};

export default ProjectDashboardPage;
