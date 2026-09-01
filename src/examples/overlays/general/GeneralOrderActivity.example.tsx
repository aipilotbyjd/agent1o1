// @start-snippet:: generalOrderActivityExampleSource
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal, { Content, ModalBody, ModalHeader } from '@/components/ui/Modal';
import EXAMPLE from '@/examples/_index';
import Icon from '@/components/icon/Icon';

const GeneralOrderActivityExample = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<>
			<Button
				aria-label='Dispatched for delivery'
				variant='soft'
				color='emerald'
				icon='DeliverySent02'
				onClick={() => setIsOpen(true)}>
				Dispatched for delivery
			</Button>
			<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
				<ModalHeader className='flex gap-4'>
					<div className='flex items-center gap-2'>
						<Icon icon='ShippingLoading' color='emerald' />
						<div>Order activity</div>
					</div>
				</ModalHeader>
				<ModalBody>
					<EXAMPLE.PageSections.Timeline.OrderActivity />
				</ModalBody>
			</Modal>
		</>
	);
};

export default GeneralOrderActivityExample;
// @end-snippet:: generalOrderActivityExampleSource

export const GeneralOrderActivityExamplePreview = () => {
	return (
		<Content>
			<ModalHeader className='flex gap-4'>
				<div className='flex items-center gap-2'>
					<Icon icon='ShippingLoading' color='emerald' />
					<div>Order activity</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<EXAMPLE.PageSections.Timeline.OrderActivity />
			</ModalBody>
		</Content>
	);
};
