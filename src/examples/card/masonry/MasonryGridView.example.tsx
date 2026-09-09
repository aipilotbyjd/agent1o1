// @start-snippet:: masonryGridViewExampleSource
import Card, { CardBody } from '@/components/ui/Card';
import { Product1, Product2, Product3, Product4 } from '@/assets/images';
import EXAMPLE from '@/examples/_index';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const MasonryGridViewExample = () => {
	return (
		<div className='relative columns-1 gap-4 *:pb-4 sm:columns-2 md:columns-3 lg:columns-4'>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<img
							src={Product1}
							alt='Title'
							className='mb-2 aspect-video rounded-md object-cover'
						/>
						<div className='text-lg font-bold'>#Product</div>
						<div className='text-zinc-500'>
							Apply a special discount or promotional offer to increase the sales of
							this product.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Marketing</Badge>
							<Badge variant='soft'>Design</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Leave Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Leave Team
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Education</div>
						<div className='text-zinc-500'>
							Schedule a live Q&A session with the instructor to enhance student
							engagement.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Schedule</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Request sent'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							icon='CheckmarkSquare04'
							isDisable
							className='py-3!'>
							Request sent
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Product</div>
						<div className='text-zinc-500'>
							Apply a special discount or promotional offer to increase the sales of
							this product.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Marketing</Badge>
							<Badge variant='soft'>Design</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Leave Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Leave Team
						</Button>
					</CardBody>
				</Card>
			</div>

			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Education</div>
						<div className='text-zinc-500'>
							<div>
								Upload supplementary learning materials such as slides, videos, or
								reading lists.
							</div>
							<div>
								Enroll a new student in the selected online course to start their
								learning journey.
							</div>
							<div>
								Set up automated reminders for upcoming assignment deadlines and
								exam dates.
							</div>
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Image</Badge>
							<Badge variant='soft'>Video</Badge>
							<Badge variant='soft'>Content</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Request sent'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							icon='CheckmarkSquare04'
							isDisable
							className='py-3!'>
							Request sent
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<img
							src={Product2}
							alt='Title'
							className='mb-2 aspect-video rounded-md object-cover'
						/>
						<div className='text-lg font-bold'>#Product</div>
						<div className='text-zinc-500'>
							Enable customer reviews and ratings for the product to improve
							transparency and trust.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Reviews</Badge>
							<Badge variant='soft'>Ratings</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Leave Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Leave Team
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Events</div>
						<div className='text-zinc-500'>
							Update the event details, such as date, time, and location, to ensure
							participants have the latest information.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Location</Badge>
							<Badge variant='soft'>Date & Time</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Join Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Join Team
						</Button>
					</CardBody>
				</Card>
			</div>

			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<img
							src={Product3}
							alt='Title'
							className='mb-2 aspect-video rounded-md object-cover'
						/>
						<div className='text-lg font-bold'>#Product</div>
						<div className='text-zinc-500'>
							Compare this product with similar items to help customers make informed
							purchasing decisions.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Help</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Leave Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Leave Team
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Events</div>
						<div className='text-zinc-500'>
							Collect feedback from attendees after the event to improve future
							experiences.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Feedback</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Join Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Join Team
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<div className='text-lg font-bold'>#Education</div>
						<div className='text-zinc-500'>
							Schedule a live Q&A session with the instructor to enhance student
							engagement.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Q&A</Badge>
							<Badge variant='soft'>Engagement</Badge>
							<Badge variant='soft'>Student</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Request sent'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							icon='CheckmarkSquare04'
							isDisable
							className='py-3!'>
							Request sent
						</Button>
					</CardBody>
				</Card>
			</div>
			<div className='break-inside-avoid'>
				<Card>
					<CardBody className='flex flex-col gap-2'>
						<img
							src={Product4}
							alt='Title'
							className='mb-2 aspect-video rounded-md object-cover'
						/>
						<div className='text-lg font-bold'>#Product</div>
						<div className='text-zinc-500'>
							Mark the product as a bestseller if it consistently achieves high sales
							volume.
						</div>
						<div className='flex gap-2'>
							<Badge variant='soft'>Marketing</Badge>
							<Badge variant='soft'>Design</Badge>
						</div>
						<div className='flex items-center justify-between gap-4'>
							<div className='font-semibold'>Assign:</div>
							<div className=''>
								<EXAMPLE.Ui.Dropdown.AvatarGroup />
							</div>
						</div>
						<Button
							aria-label='Leave Team'
							variant='outline'
							color='zinc'
							rounded='rounded-md'
							className='py-3!'>
							Leave Team
						</Button>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default MasonryGridViewExample;
// @end-snippet:: masonryGridViewExampleSource
