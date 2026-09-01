// @start-snippet:: statWithAvatarExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { Avatar2, Avatar3, Avatar4, Avatar5 } from '@/assets/images';
import AvatarGroup from '@/components/ui/AvatarGroup';

const StatWithAvatarExample = () => {
	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<span className='text-4xl font-bold'>1</span>
					</CardHeaderChild>
					<CardHeaderChild>
						<Avatar src={Avatar2} size='w-8' />
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='text-zinc-500'>Super Admin</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<span className='text-4xl font-bold'>4</span>
					</CardHeaderChild>
					<CardHeaderChild>
						<AvatarGroup size='w-8'>
							<Avatar src={Avatar2} color='zinc' />
							<Avatar name='Omtanke Studio' color='amber' />
							<Avatar src={Avatar4} color='emerald' />
							<Avatar src={Avatar5} color='blue' />
						</AvatarGroup>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='text-zinc-500'>Admin</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<span className='text-4xl font-bold'>8</span>
					</CardHeaderChild>
					<CardHeaderChild>
						<AvatarGroup size='w-8'>
							<Avatar src={Avatar5} color='blue' />
							<Avatar src={Avatar4} color='emerald' />
							<Avatar src={Avatar2} color='zinc' />
							<Avatar name='John Doe' color='violet' />
							<Avatar src={Avatar3} color='amber' />
							<Avatar name='+ 3' color='zinc' />
						</AvatarGroup>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='text-zinc-500'>Creator</div>
				</CardBody>
			</Card>
			<Card>
				<CardHeader>
					<CardHeaderChild>
						<span className='text-4xl font-bold'>142</span>
					</CardHeaderChild>
					<CardHeaderChild>
						<AvatarGroup size='w-8'>
							<Avatar src={Avatar5} color='blue' />
							<Avatar src={Avatar4} color='emerald' />
							<Avatar src={Avatar2} color='zinc' />
							<Avatar name='John Doe' color='violet' />
							<Avatar src={Avatar3} color='amber' />
							<Avatar name='1 H' color='zinc' />
						</AvatarGroup>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='text-zinc-500'>Members</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default StatWithAvatarExample;
// @end-snippet:: statWithAvatarExampleSource
