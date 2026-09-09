// @start-snippet:: titleBarsTagsAndButtonsExampleSource
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
	SubheaderSeparator,
} from '@/components/layout/Subheader';
import EXAMPLE from '@/examples/_index';
import Button from '@/components/ui/Button';

const TitleBarsTagsAndButtonsExample = () => {
	return (
		<Subheader>
			<SubheaderLeft>
				<EXAMPLE.Ui.Dropdown.EditTag />
				<SubheaderSeparator />
				<EXAMPLE.Ui.Dropdown.ChangeStatus />
			</SubheaderLeft>
			<SubheaderRight>
				<EXAMPLE.Ui.Dropdown.InviteUser />
				<SubheaderSeparator />
				<Button aria-label='Send' color='emerald' variant='soft' icon='Sent02'>
					Send
				</Button>
			</SubheaderRight>
		</Subheader>
	);
};

export default TitleBarsTagsAndButtonsExample;
// @end-snippet:: titleBarsTagsAndButtonsExampleSource
