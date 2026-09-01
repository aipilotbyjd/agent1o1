// @start-snippet:: chartAndGraphTimelineChartReportExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import ChartTimelinePart from '@/parts/charts/ChartTimeline.part';
import { Avatar1, Avatar2, Avatar3, Avatar4, Avatar5, Logo } from '@/assets/images';
import dayjs from 'dayjs';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Progress from '@/components/ui/Progress';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

const ChartAndGraphTimelineChartReportExample = () => {
	return (
		<Card>
			<CardHeader className='border-b border-inherit'>
				<CardHeaderChild>
					<CardTitle
						iconProps={{
							icon: 'AnalysisTextLink',
							color: 'blue',
							size: 'text-3xl',
						}}>
						Report
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody className='!p-0'>
				<div className='grid grid-cols-12 divide-y divide-zinc-500/25 lg:divide-x lg:divide-y-0'>
					<div className='col-span-12 py-4 lg:col-span-8'>
						<ChartTimelinePart />
					</div>
					<div className='col-span-12 lg:col-span-4'>
						<div className='flex h-full flex-col divide-y divide-zinc-500/25 py-4'>
							<div className='grow'>
								<div className='grid grid-cols-12 divide-y divide-zinc-500/25'>
									<div className='col-span-12 flex p-4'>
										<div className='flex grow gap-4'>
											<div className='shrink-0'>
												<img src={Logo} alt='' className='size-12' />
											</div>
											<div className=''>
												<div>Boltify</div>
												<div className='font-bold'>
													React Tailwind CSS Admin & Starter Template
												</div>
											</div>
										</div>
										<div className=''>
											<Button icon='More' variant='link' aria-label='' />
										</div>
									</div>
									<div className='col-span-12 grid grid-cols-12 gap-4 divide-x divide-zinc-500/50 p-4'>
										<div className='col-span-4'>
											<div>23</div>
											<div className='text-zinc-500'>Tasks</div>
										</div>
										<div className='col-span-4'>
											<div>11</div>
											<div className='text-zinc-500'>In Progress</div>
										</div>
										<div className='col-span-4'>
											<div>12</div>
											<div className='text-zinc-500'>Completed</div>
										</div>
									</div>
									<div className='col-span-12 grid grid-cols-12 gap-4 p-4'>
										<div className='col-span-3 text-zinc-500'>Due Date</div>
										<div className='col-span-9'>
											{dayjs().add(21, 'day').format('DD MMM, YYYY')}
										</div>

										<div className='col-span-3 text-zinc-500'>Category</div>
										<div className='col-span-9'>
											<Badge variant='soft' color='zinc'>
												<div className='h-4 w-1 rounded-2xl bg-blue-500'></div>
												<span>UI/UX</span>
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
							</div>
							<div className='flex items-center px-4 pt-4'>
								<div className='flex grow items-center gap-4'>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Message01' /> <span>2</span>
									</div>
									<div className='h-4 border-e border-zinc-500/25'></div>
									<div className='flex items-center gap-2 text-zinc-500'>
										<Icon icon='Attachment' /> <span>5</span>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<div className='w-32'>
										<Progress value={42} />
									</div>
									<div className='text-zinc-500'>42%</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default ChartAndGraphTimelineChartReportExample;
// @end-snippet:: chartAndGraphTimelineChartReportExampleSource
