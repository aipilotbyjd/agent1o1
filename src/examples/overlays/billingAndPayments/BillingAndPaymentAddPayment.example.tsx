// @start-snippet:: billingAndPaymentAddPaymentExampleSource
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EXAMPLE from '@/examples/_index';

const BillingAndPaymentAddPaymentExample = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<>
			<Button icon='CreditCardAdd' onClick={() => setIsOpen(true)}>
				Add Payment
			</Button>
			{/* @ts-ignore*/}
			<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
				<EXAMPLE.Forms.BillingAndPayments.AddPayment />
			</Modal>
		</>
	);
};

export default BillingAndPaymentAddPaymentExample;
// @end-snippet:: billingAndPaymentAddPaymentExampleSource
