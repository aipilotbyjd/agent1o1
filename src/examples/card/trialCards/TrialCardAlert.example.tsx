// @start-snippet:: trialCardAlertExampleSource
import Card, {
	CardBody,
	CardFooter,
	CardFooterChild,
	CardHeader,
	CardHeaderChild,
	CardSubTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import Progress from '@/components/ui/Progress';

const TrialCardAlertExample = () => {
	const [status, setStatus] = useState<boolean>(true);
	if (status) {
		return (
			<Card>
				<CardHeader className='-my-2'>
					<CardHeaderChild>
						<CardSubTitle>Trial ends in 10 days</CardSubTitle>
					</CardHeaderChild>
					<CardHeaderChild>
						<Button
							aria-label='Cancel'
							icon='Cancel01'
							color='red'
							onClick={() => setStatus(false)}
						/>
					</CardHeaderChild>
				</CardHeader>
				<CardBody>
					<div className='mb-2'>Your free trial is expiring. Upgrade to Pro 🚀</div>
					<Progress value={64} />
				</CardBody>
				<CardFooter>
					<CardFooterChild>
						<Button aria-label='Schedule a call' variant='soft' icon='Video02'>
							Schedule a call
						</Button>
					</CardFooterChild>
				</CardFooter>
			</Card>
		);
	}
	return undefined;
};

export default TrialCardAlertExample;
// @end-snippet:: trialCardAlertExampleSource
