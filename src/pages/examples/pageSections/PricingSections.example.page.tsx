import Header, { HeaderLeft, HeaderRight } from '@/components/layout/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import ChangeLanguageTemplate from '@/templates/header/ChangeLanguage.template';
import EXAMPLE from '@/examples/_index';
import Container from '@/components/layout/Container';
import ExampleHeaderPartial from '@/pages/examples/_partial/ExampleHeader.partial';
import ExampleItemPartial from '@/pages/examples/_partial/ExampleItem.partial';
import extractSnippetUtil from '@/utils/extractSnippet.util';
import pricingSectionsCardExampleSource from '@/examples/pageSections/pricingSections/PricingSectionsCard.example.tsx?raw'; // eslint-disable-line import/extensions

const PricingSectionsExamplePage = () => {
	return (
		<>
			<Header>
				<HeaderLeft>
					<Breadcrumb
						list={[
							{ ...pages.examples.exampleMain },
							{ ...pages.examples.exampleMain.subPages.pageSections },
							{
								...pages.examples.exampleMain.subPages.pageSections.subPages
									.pricingSections,
							},
						]}
					/>
				</HeaderLeft>
				<HeaderRight>
					<ChangeDarkModeTemplate />
					<ChangeLanguageTemplate />
					<EXAMPLE.Ui.Dropdown.Notifications />
				</HeaderRight>
			</Header>
			<Container>
				<div className='grid grid-cols-12 gap-4'>
					<ExampleHeaderPartial
						title='Pricing Sections'
						description='Pricing tables provide a clear comparison of different plans and costs, making it easy for users to find the solution that best fits their needs.'
					/>
					<ExampleItemPartial
						title='Card'
						code={extractSnippetUtil(
							pricingSectionsCardExampleSource,
							'pricingSectionsCardExampleSource',
						)}>
						<div className='flex flex-col gap-4'>
							<EXAMPLE.PageSections.PricingSections.Card />
						</div>
					</ExampleItemPartial>
				</div>
			</Container>
		</>
	);
};

export default PricingSectionsExamplePage;
