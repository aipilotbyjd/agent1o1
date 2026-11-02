import { useState } from 'react';
import { useParams } from 'react-router';
import Container from '@/components/layout/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Button from '@/components/ui/Button';
import UsageInsights from '@/components/billing/UsageInsights';

const RANGES = [7, 30, 90] as const;

/**
 * The workspace's usage insights: where its credits went over the last 7, 30
 * or 90 days.
 */
const UsageInsightsPage = () => {
	const { workspaceId = '' } = useParams<{ workspaceId: string }>();
	const [days, setDays] = useState<(typeof RANGES)[number]>(30);

	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<h1 className='text-lg font-semibold'>Usage</h1>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex gap-2' role='group' aria-label='Range'>
						{RANGES.map((range) => (
							<Button
								key={range}
								variant={days === range ? 'solid' : 'outline'}
								aria-pressed={days === range}
								onClick={() => setDays(range)}>
								{range} days
							</Button>
						))}
					</div>
				</SubheaderRight>
			</Subheader>
			<Container>
				<UsageInsights workspaceId={workspaceId} days={days} />
			</Container>
		</>
	);
};

export default UsageInsightsPage;
