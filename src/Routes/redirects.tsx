import { Navigate, useParams } from 'react-router';
import { buildPath } from '@/Routes/paths';

/**
 * A relative `<Navigate>` resolves against the matched route, which goes wrong
 * for multi-segment and splat routes. This fills the target template from the
 * matched route's params instead, so a redirect carrying an id
 * (`playbooks/edit/:workflowId` -> `playbooks/:workflowId/edit`) keeps it.
 */
const WorkspaceRedirect = ({ to }: { to: string }) => {
	const params = useParams();
	return <Navigate to={buildPath(to, params)} replace />;
};

export default WorkspaceRedirect;
