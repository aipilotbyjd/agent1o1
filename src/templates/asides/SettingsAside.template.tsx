import { useNavigate } from 'react-router';
import Aside, { AsideBody } from '@/components/layout/Aside';
import Nav, { NavItem } from '@/components/layout/Navigation/Nav';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';
import AsideHeaderPart from '@/templates/asides/_parts/AsideHeader.part';
import AsideFooterPart from '@/templates/asides/_parts/AsideFooter.part';
import NavSectionsPart from '@/templates/asides/_parts/NavSections.part';
import { settingsNavigation } from '@/Routes/navigation';

const SettingsAsideTemplate = () => {
	const navigate = useNavigate();
	const { resolvePath } = useResolvePath();

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
					<NavSectionsPart sections={settingsNavigation} />
				</Nav>
			</AsideBody>
			<AsideFooterPart />
		</Aside>
	);
};

export default SettingsAsideTemplate;
