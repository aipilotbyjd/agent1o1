// @start-snippet:: titleBarsProjectAndUsersExampleSource
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';
import EXAMPLE from '@/examples/_index';

const TitleBarsProjectAndUsersExample = () => {
	return (
		<Subheader>
			<SubheaderLeft>
				<EXAMPLE.Ui.Dropdown.Project />
			</SubheaderLeft>
			<SubheaderRight>
				<EXAMPLE.Ui.Dropdown.InviteUser />
				<SubheaderSeparator />
				<EXAMPLE.Ui.Dropdown.Assign />
			</SubheaderRight>
		</Subheader>
	);
};

export default TitleBarsProjectAndUsersExample;
// @end-snippet:: titleBarsProjectAndUsersExampleSource
