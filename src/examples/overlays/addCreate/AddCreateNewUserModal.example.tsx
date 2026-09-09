// @start-snippet:: addCreateNewUserModalExampleSource
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal, { Content, ModalBody, ModalHeader } from '@/components/ui/Modal';
import EXAMPLE from '@/examples/_index';

const AddCreateNewUserModalExample = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<>
			<div>
				<Button
					icon='UserAdd02'
					variant='solid'
					onClick={() => setIsOpen(true)}
					aria-label='New User'>
					New User
				</Button>
				<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
					<ModalHeader>Add User</ModalHeader>
					<ModalBody className='p-0!'>
						<EXAMPLE.Forms.AddCreate.NewUser />
					</ModalBody>
				</Modal>
			</div>
		</>
	);
};

export default AddCreateNewUserModalExample;
// @end-snippet:: addCreateNewUserModalExampleSource

export const AddCreateNewUserModalExamplePreview = () => {
	return (
		<Content>
			<ModalHeader>Filter</ModalHeader>
			<ModalBody className='p-0!'>
				<EXAMPLE.Forms.AddCreate.NewUser />
			</ModalBody>
		</Content>
	);
};
