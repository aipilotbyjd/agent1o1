// @start-snippet:: integrationsCardExampleSource
import Card, { CardBody } from '@/components/ui/Card';
import EXAMPLE from '@/examples/_index';

const IntegrationsCardExample = () => {
	return (
		<Card className='h-full'>
			<CardBody className='flex flex-col gap-4'>
				<EXAMPLE.PageSections.QuickActions.LargeGroupButton />
			</CardBody>
		</Card>
	);
};

export default IntegrationsCardExample;
// @end-snippet:: integrationsCardExampleSource
