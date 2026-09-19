import { Navigate, useParams, useSearchParams } from 'react-router';
import { useWorkspaceContext } from '@/context/workspace';
import pages from '@/Routes/pages';


const BillingReturnPage = () => {
	const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
	const [searchParams] = useSearchParams();
	const { workspaces, isLoading } = useWorkspaceContext();

	const planOutcome = searchParams.get('checkout');
	const packOutcome = searchParams.get('pack_checkout');
	const outcome = planOutcome ?? packOutcome;
	const type = packOutcome ? 'credits' : 'plan';

	
	if (isLoading) return null;

	const workspaceId = workspaces.find((w) => w.slug === workspaceSlug)?.id ?? '';

	if (!outcome) {
		return (
			<Navigate
				to={
					workspaceId
						? pages.workspaceSettings.subPages!.billing.to.replace(':workspaceId', workspaceId)
						: pages.choose.to
				}
				replace
			/>
		);
	}

	const query = new URLSearchParams({ type });
	if (workspaceId) query.set('ws', workspaceId);

	return <Navigate to={`${outcome === 'cancel' ? '/billing/cancel' : '/billing/success'}?${query}`} replace />;
};

export default BillingReturnPage;
