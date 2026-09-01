import Container from '@/components/layout/Container';
import EXAMPLE from '@/examples/_index';
import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import { OutletContextType } from '@/pages/apps/projects/_layouts/Project.layout';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import ChangeLanguageTemplate from '@/templates/header/ChangeLanguage.template';

const ProjectListPage = () => {
	const { setHeaderLeft, setHeaderRight } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[{ ...pages.apps.projects }, { ...pages.apps.projects.subPages.list }]}
			/>,
		);
		setHeaderRight(
			<>
				<ChangeDarkModeTemplate />
				<ChangeLanguageTemplate />
				<EXAMPLE.Ui.Dropdown.Notifications />
			</>,
		);
		return () => {
			setHeaderLeft(undefined);
			setHeaderRight(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<Container>
				<EXAMPLE.Table.Projects.SearchableFilter />
			</Container>
		</>
	);
};

export default ProjectListPage;
