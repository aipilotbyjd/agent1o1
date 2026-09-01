// @start-snippet:: contactsUserConnectExampleSource
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import EXAMPLE from '@/examples/_index';

const ContactsUserConnectExample = () => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle>Connections</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<EXAMPLE.PageSections.ListGroup.AvatarWithButton />
			</CardBody>
		</Card>
	);
};

export default ContactsUserConnectExample;
// @end-snippet:: contactsUserConnectExampleSource
