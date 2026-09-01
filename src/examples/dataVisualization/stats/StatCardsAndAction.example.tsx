// @start-snippet:: statCardsAndActionExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import AvatarGroup from '@/components/ui/AvatarGroup';
import Avatar from '@/components/ui/Avatar';
import { Avatar1, Avatar2, Avatar3 } from '@/assets/images';

const StatCardsAndActionExample = () => {
	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Icon icon='User' size='text-4xl' color='emerald' />
					</CardHeaderChild>
					<CardHeaderChild>
						<Button aria-label='More' icon='MoreVertical' variant='link' color='zinc' />
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='flex items-end'>
						<div className='grow'>
							<div className='text-lg'>Active User</div>
							<div className='text-3xl font-bold'>46</div>
						</div>
						<div>
							<AvatarGroup size='w-8' variant='soft'>
								<Avatar src={Avatar1} />
								<Avatar src={Avatar2} color='emerald' />
								<Avatar src={Avatar3} color='amber' />
							</AvatarGroup>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Icon icon='UserGroup02' size='text-4xl' color='amber' />
					</CardHeaderChild>
					<CardHeaderChild>
						<Button aria-label='More' icon='MoreVertical' variant='link' color='zinc' />
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='flex items-end'>
						<div className='grow'>
							<div className='text-lg'>Total User</div>
							<div className='text-3xl font-bold'>278</div>
						</div>
						<div>
							<AvatarGroup size='w-8' variant='soft'>
								<Avatar src={Avatar1} />
								<Avatar src={Avatar2} color='emerald' />
								<Avatar src={Avatar3} color='amber' />
							</AvatarGroup>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Icon icon='UserAccount' size='text-4xl' color='blue' />
					</CardHeaderChild>
					<CardHeaderChild>
						<Button aria-label='More' icon='MoreVertical' variant='link' color='zinc' />
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='flex items-end'>
						<div className='grow'>
							<div className='text-lg'>New User</div>
							<div className='text-3xl font-bold'>12</div>
						</div>
						<div>
							<AvatarGroup size='w-8' variant='soft'>
								<Avatar src={Avatar1} />
								<Avatar src={Avatar2} color='emerald' />
								<Avatar src={Avatar3} color='amber' />
							</AvatarGroup>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<Icon icon='UserShield01' size='text-4xl' color='violet' />
					</CardHeaderChild>
					<CardHeaderChild>
						<Button aria-label='More' icon='MoreVertical' variant='link' color='zinc' />
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='flex items-end'>
						<div className='grow'>
							<div className='text-lg'>Admin User</div>
							<div className='text-3xl font-bold'>4</div>
						</div>
						<div>
							<AvatarGroup size='w-8' variant='soft'>
								<Avatar src={Avatar1} />
								<Avatar src={Avatar2} color='emerald' />
								<Avatar src={Avatar3} color='amber' />
							</AvatarGroup>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default StatCardsAndActionExample;
// @end-snippet:: statCardsAndActionExampleSource
