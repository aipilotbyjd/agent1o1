// @start-snippet:: filterPaymentModalExampleSource
import Button from '@/components/ui/Button';
import { useState } from 'react';
import Modal, { Content, ModalBody, ModalHeader } from '@/components/ui/Modal';
import EXAMPLE from '@/examples/_index';

const FilterPaymentModalExample = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	return (
		<>
			<div>
				<Button
					aria-label='Filter'
					icon='Filter'
					variant='soft'
					onClick={() => setIsOpen(true)}>
					Filter
				</Button>
				<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
					<ModalHeader>Filter</ModalHeader>
					<ModalBody className='p-0!'>
						<EXAMPLE.Forms.Filters.Payments />
					</ModalBody>
				</Modal>
			</div>
		</>
	);
};

export default FilterPaymentModalExample;
// @end-snippet:: filterPaymentModalExampleSource

export const FilterPaymentModalExamplePreview = () => {
	return (
		<Content>
			<ModalHeader>Filter</ModalHeader>
			<ModalBody className='p-0!'>
				<EXAMPLE.Forms.Filters.Payments />
			</ModalBody>
		</Content>
	);
};
