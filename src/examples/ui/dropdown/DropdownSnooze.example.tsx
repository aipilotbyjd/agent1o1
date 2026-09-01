import Dropdown, {
	DropdownContent,
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useState } from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import dayjs from 'dayjs';
import { Calendar } from 'react-date-range';

const generateTimeList = (): string[] => {
	return Array.from({ length: 12 }, (_, i) => {
		const hour = i + 1;
		const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
		return [`${hourStr}:00 AM`, `${hourStr}:00 PM`];
	}).flat();
};

const DropdownSnoozeExample = () => {
	const [modalStatus, setModalStatus] = useState<boolean>(false);
	const [stateCalendar, setStateCalendar] = useState<Date>(dayjs().toDate());

	const handleCloseModal = () => setModalStatus(false);

	const timeList = generateTimeList();

	return (
		<>
			<Dropdown>
				<DropdownToggle hasIcon={false}>
					<Button
						aria-label='Notification Snooze'
						icon='NotificationSnooze02'
						variant='link'
						color='zinc'
					/>
				</DropdownToggle>
				<DropdownMenu>
					<DropdownContent className='text-zinc-500'>Snooze</DropdownContent>
					<DropdownDivider />
					<DropdownItem>
						<div className='grow'>Today</div>
						<div className='text-sm text-zinc-500'>11:00 PM</div>
					</DropdownItem>
					<DropdownItem>
						<div className='grow'>Tomorrow</div>
						<div className='text-sm text-zinc-500'>08:00 AM</div>
					</DropdownItem>
					<DropdownItem>
						<div className='grow'>This Week</div>
						<div className='text-sm text-zinc-500'>Fri, 11:00 PM</div>
					</DropdownItem>
					<DropdownItem>
						<div className='grow'>Next Week</div>
						<div className='text-sm text-zinc-500'>Mon, 08:00 AM</div>
					</DropdownItem>
					<DropdownDivider />
					<DropdownItem onClick={() => setModalStatus(true)}>
						<div className='grow'>Custom</div>
						<div>
							<Icon icon='ArrowRight01' />
						</div>
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			<Modal isOpen={modalStatus} setIsOpen={setModalStatus} size='360px'>
				<ModalHeader>Select Date & Time</ModalHeader>
				<ModalBody className='border-b border-zinc-500/10 !p-0 dark:border-zinc-500/25'>
					<div className='grid h-64 grid-cols-2 overflow-auto'>
						{timeList.map((item) => (
							<Button aria-label={item} key={item} variant='link'>
								{item}
							</Button>
						))}
					</div>
				</ModalBody>
				<ModalBody className='!py-0'>
					<Calendar onChange={(item) => setStateCalendar(item)} date={stateCalendar} />
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild />
					<ModalFooterChild>
						<Button aria-label='Cancel' color='red' onClick={handleCloseModal}>
							Cancel
						</Button>
						<Button aria-label='Snooze' variant='soft' onClick={handleCloseModal}>
							Snooze
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default DropdownSnoozeExample;
