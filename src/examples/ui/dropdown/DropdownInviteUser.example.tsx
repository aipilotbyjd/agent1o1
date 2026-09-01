import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import FieldWrap from '@/components/form/FieldWrap';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Checkbox from '@/components/form/Checkbox';
import { ChangeEvent, useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import USERS from '@/mocks/users.mock';
import Tooltip from '@/components/ui/Tooltip';

const DropdownAuthExample = ({
	auth = 'Can view',
}: {
	auth: 'Can view' | 'Can edit' | 'Admin' | 'Remove';
}) => {
	return (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='Authentication' variant='link' color='zinc' className='!px-0'>
					{auth}
				</Button>
			</DropdownToggle>
			<DropdownMenu
				placement='bottom-end'
				fallbackPlacements={['top-end']}
				className='min-w-48! dark:bg-zinc-950! [&_*]:rounded-xl! [*]:rounded-2xl!'>
				<DropdownItem className='gap-2'>
					<span>Can view</span>
					{auth === 'Can view' && (
						<Icon icon='Tick02' size='text-xl' className='ms-auto' />
					)}
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<span>Can edit</span>
					{auth === 'Can edit' && (
						<Icon icon='Tick02' size='text-xl' className='ms-auto' />
					)}
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<span>Admin</span>
					{auth === 'Admin' && <Icon icon='Tick02' size='text-xl' className='ms-auto' />}
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<span>Remove</span>
					{auth === 'Remove' && <Icon icon='Tick02' size='text-xl' className='ms-auto' />}
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

const DropdownInviteUserExample = () => {
	const SELECT = (
		<Dropdown>
			<DropdownToggle>
				<Button aria-label='View' variant='link' color='zinc' className='!px-0'>
					Can view
				</Button>
			</DropdownToggle>
			<DropdownMenu
				placement='bottom-end'
				fallbackPlacements={['top-end']}
				className='min-w-48! dark:bg-zinc-950! [&_*]:rounded-xl! [*]:rounded-2xl!'>
				<DropdownItem className='gap-2'>
					<span>Can view</span>
					<Icon icon='Tick02' size='text-xl' className='ms-auto' />
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<span>Can Edit</span>
				</DropdownItem>
				<DropdownItem className='gap-2'>
					<span>Admin</span>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);

	const [checked, setChecked] = useState<boolean>(false);
	const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
		setChecked(event.target.checked);
	};

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button aria-label='Share' variant='soft' color='zinc'>
					Share
				</Button>
			</DropdownToggle>
			<DropdownMenu
				isCloseAfterLeave={false}
				fallbackPlacements={['bottom-end', 'top-end']}
				className='lg:min-w-lg!'>
				<div className='text-xl font-bold'>Invite</div>
				<div className=''>
					<div className='flex gap-4'>
						<FieldWrap lastSuffix={SELECT}>
							<Input
								name='email'
								type='email'
								variant='default'
								placeholder='Add username or email'
								dimension='sm'
							/>
						</FieldWrap>
						<Button
							aria-label='Send'
							variant='solid'
							color='blue'
							className='text-nowrap'>
							Send
						</Button>
					</div>
					<Checkbox
						label='Notify recipients via email'
						dimension='sm'
						checked={checked}
						onChange={handleCheckboxChange}
					/>
				</div>
				<hr className='-mx-2 border-zinc-500/25' />
				<div className='text-xl font-bold'>From GitHub</div>
				<div className='flex flex-col gap-2'>
					<div className='flex'>
						<div className='flex grow items-center gap-2'>
							<div>
								<Avatar src={USERS.nicolasLefevre.image.org} />
							</div>
							<div>
								<div className='flex items-baseline gap-2'>
									<span>{`${USERS.nicolasLefevre.firstName} ${USERS.nicolasLefevre.lastName}`}</span>
									<span className='text-xs text-zinc-500'>(you)</span>
								</div>
								<div className='text-xs text-zinc-500'>
									{USERS.nicolasLefevre.email}
								</div>
							</div>
						</div>
						<div className=''>
							<DropdownAuthExample auth='Admin' />
						</div>
					</div>
					<div className='flex'>
						<div className='flex grow items-center gap-2'>
							<div>
								<Avatar src={USERS.aulisTiainen.image.org} />
							</div>
							<div>
								<div className='flex items-baseline gap-2'>
									<span>{`${USERS.aulisTiainen.firstName} ${USERS.aulisTiainen.lastName}`}</span>
									<span className='text-xs text-zinc-500'>(you)</span>
								</div>
								<div className='text-xs text-zinc-500'>
									{USERS.aulisTiainen.email}
								</div>
							</div>
						</div>
						<div className=''>
							<DropdownAuthExample auth='Can view' />
						</div>
					</div>
					<div className='flex'>
						<div className='flex grow items-center gap-2'>
							<div>
								<Avatar src={USERS.danielaPetrova.image.org} />
							</div>
							<div>
								<div className='flex items-baseline gap-2'>
									<span>{`${USERS.danielaPetrova.firstName} ${USERS.danielaPetrova.lastName}`}</span>
									<span className='text-xs text-zinc-500'>(you)</span>
								</div>
								<div className='text-xs text-zinc-500'>
									{USERS.danielaPetrova.email}
								</div>
							</div>
						</div>
						<div className=''>
							<DropdownAuthExample auth='Can edit' />
						</div>
					</div>
				</div>
				<hr className='-mx-2 border-zinc-500/25' />
				<div className='text-xl font-bold'>Shared read-only link</div>
				<div className='flex gap-4'>
					<Input
						name='email'
						type='email'
						variant='default'
						placeholder='https://github.com/omtanke/boltify'
						value='https://github.com/omtanke/boltify'
						readOnly
						dimension='sm'
					/>
					<Tooltip text='Copy'>
						<Button aria-label='Copy' variant='soft' color='zinc' icon='Copy01' />
					</Tooltip>
				</div>
				<hr className='-mx-2 mt-2 border-zinc-500/25' />
				<div className=''>
					<Button aria-label='Read more' icon='HelpCircle' dimension='xs'>
						Read more about share
					</Button>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownInviteUserExample;
