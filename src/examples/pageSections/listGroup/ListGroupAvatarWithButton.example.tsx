// @start-snippet:: listGroupAvatarWithButtonExampleSource
import Avatar from '@/components/ui/Avatar';
import USERS from '@/mocks/users.mock';
import Button from '@/components/ui/Button';

const ListGroupAvatarWithButtonExample = () => {
	return (
		<>
			<div className='flex flex-col gap-4'>
				<div className='flex'>
					<div className='flex grow items-center gap-4'>
						<Avatar
							src={USERS.aulisTiainen.image.org}
							name={`${USERS.aulisTiainen.firstName} ${USERS.aulisTiainen.lastName}`}
							color={USERS.aulisTiainen.color}
						/>
						<div>
							<div>{`${USERS.aulisTiainen.firstName} ${USERS.aulisTiainen.lastName}`}</div>
							<div className='text-sm text-zinc-500'>
								{USERS.aulisTiainen.username}
							</div>
						</div>
					</div>
					<div className='flex items-center'>
						<Button aria-label='Connect' variant='outline' color='zinc'>
							Connect
						</Button>
					</div>
				</div>
				<div className='flex'>
					<div className='flex grow items-center gap-4'>
						<Avatar
							src={USERS.danielaPetrova.image.org}
							name={`${USERS.danielaPetrova.firstName} ${USERS.danielaPetrova.lastName}`}
							color={USERS.danielaPetrova.color}
						/>
						<div>
							<div>{`${USERS.danielaPetrova.firstName} ${USERS.danielaPetrova.lastName}`}</div>
							<div className='text-sm text-zinc-500'>
								{USERS.danielaPetrova.username}
							</div>
						</div>
					</div>
					<div className='flex items-center'>
						<Button aria-label='Connect' variant='outline' color='zinc'>
							Connect
						</Button>
					</div>
				</div>
				<div className='flex'>
					<div className='flex grow items-center gap-4'>
						<Avatar
							src={USERS.nicolasLefevre.image.org}
							name={`${USERS.nicolasLefevre.firstName} ${USERS.nicolasLefevre.lastName}`}
							color={USERS.nicolasLefevre.color}
						/>
						<div>
							<div>{`${USERS.nicolasLefevre.firstName} ${USERS.nicolasLefevre.lastName}`}</div>
							<div className='text-sm text-zinc-500'>
								{USERS.nicolasLefevre.username}
							</div>
						</div>
					</div>
					<div className='flex items-center'>
						<Button aria-label='Connect' variant='outline' color='zinc'>
							Connect
						</Button>
					</div>
				</div>
				<div className='flex'>
					<div className='flex grow items-center gap-4'>
						<Avatar
							src={USERS.oliviaNovak.image.org}
							name={`${USERS.oliviaNovak.firstName} ${USERS.oliviaNovak.lastName}`}
							color={USERS.oliviaNovak.color}
						/>
						<div>
							<div>{`${USERS.oliviaNovak.firstName} ${USERS.oliviaNovak.lastName}`}</div>
							<div className='text-sm text-zinc-500'>
								{USERS.oliviaNovak.username}
							</div>
						</div>
					</div>
					<div className='flex items-center'>
						<Button aria-label='Connect' variant='outline' color='zinc'>
							Connect
						</Button>
					</div>
				</div>
				<div className='flex'>
					<div className='flex grow items-center gap-4'>
						<Avatar
							src={USERS.johndoe.image.org}
							name={`${USERS.johndoe.firstName} ${USERS.johndoe.lastName}`}
							color={USERS.johndoe.color}
						/>
						<div>
							<div>{`${USERS.johndoe.firstName} ${USERS.johndoe.lastName}`}</div>
							<div className='text-sm text-zinc-500'>{USERS.johndoe.username}</div>
						</div>
					</div>
					<div className='flex items-center'>
						<Button aria-label='Connect' variant='outline' color='zinc'>
							Connect
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};

export default ListGroupAvatarWithButtonExample;
// @end-snippet:: listGroupAvatarWithButtonExampleSource
