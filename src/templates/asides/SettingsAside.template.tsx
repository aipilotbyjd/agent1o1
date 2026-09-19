import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import Aside, { AsideBody } from '@/components/layout/Aside';
import Nav, { NavItem, NavTitle } from '@/components/layout/Navigation/Nav';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';

const useWorkspaceId = () => {
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const { activeWorkspaceId } = useWorkspaceContext();
	return workspaceId || activeWorkspaceId;
};

const workspaceSettingsPages = pages.workspaceSettings.subPages!;

const SettingsAsideTemplate = () => {
	const navigate = useNavigate();
	const workspaceId = useWorkspaceId();
	const resolvePath = useMemo(
		() => (to: string) => (workspaceId ? to.replace(':workspaceId', workspaceId) : to),
		[workspaceId],
	);

	return (
		<Aside>
			<AsideHeaderPart />
			<AsideBody>
				<Nav>
					<NavItem
						icon='ArrowLeft01'
						text='Go back'
						onClick={() => navigate(resolvePath(pages.workspace.to))}
					/>

					<NavTitle>Account</NavTitle>
					<NavItem
						{...workspaceSettingsPages.profile}
						to={resolvePath(workspaceSettingsPages.profile.to)}
					/>

					<NavTitle>Billing</NavTitle>
					<NavItem
						{...workspaceSettingsPages.billing}
						to={resolvePath(workspaceSettingsPages.billing.to)}
					/>

					<NavTitle>Organization</NavTitle>
					<NavItem
						{...workspaceSettingsPages.workspace}
						to={resolvePath(workspaceSettingsPages.workspace.to)}
					/>
					<NavItem
						{...workspaceSettingsPages.members}
						to={resolvePath(workspaceSettingsPages.members.to)}
					/>
					<NavItem
						{...workspaceSettingsPages.environments}
						to={resolvePath(workspaceSettingsPages.environments.to)}
					/>
					<NavItem
						{...workspaceSettingsPages.apiKeys}
						to={resolvePath(workspaceSettingsPages.apiKeys.to)}
					/>

					<NavTitle>Notifications</NavTitle>
					<NavItem
						{...workspaceSettingsPages.notifications}
						to={resolvePath(workspaceSettingsPages.notifications.to)}
					/>
					<NavItem
						{...workspaceSettingsPages.notificationChannels}
						to={resolvePath(workspaceSettingsPages.notificationChannels.to)}
					/>
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default SettingsAsideTemplate;
