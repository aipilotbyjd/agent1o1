import Dropdown, { DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import ButtonGroup from '@/components/ui/ButtonGroup';

const DropdownFormattingButtonGroupExample = () => {
	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button icon='TextColor' variant='link' aria-label='Link' />
			</DropdownToggle>
			<DropdownMenu placement='top-start' rounded='rounded-2xl'>
				<div className='flex gap-2'>
					<ButtonGroup variant='soft' color='zinc'>
						<Button icon='TextBold' title='Bold' aria-label='Bold' />
						<Button icon='TextItalic' title='Italic' aria-label='Italic' />
						<Button icon='TextUnderline' title='Underline' aria-label='Underline' />
						<Button
							icon='TextStrikethrough'
							title='Strikethrough'
							aria-label='Strikethrough'
						/>
					</ButtonGroup>
					<ButtonGroup variant='soft' color='zinc'>
						<Button
							icon='TextAlignLeft'
							title='Text Align Left'
							aria-label='Text Align Left'
						/>
						<Button
							icon='TextAlignRight'
							title='Text Align Right'
							aria-label='Text Align Right'
						/>
						<Button
							icon='TextAlignCenter'
							title='Text Align Center'
							aria-label='Text Align Center'
						/>
						<Button
							icon='TextAlignJustifyCenter'
							title='Text Align Justify Center'
							aria-label='Text Align Justify Center'
						/>
					</ButtonGroup>
					<ButtonGroup variant='soft' color='zinc'>
						<Button
							icon='TextIndentLess'
							title='Indent Less'
							aria-label='Indent Less'
						/>
						<Button
							icon='TextIndentMore'
							title='Indent More'
							aria-label='Indent More'
						/>
					</ButtonGroup>
					<ButtonGroup variant='soft' color='zinc'>
						<Button
							icon='LeftToRightListNumber'
							title='Ordered List'
							aria-label='Ordered List'
						/>
						<Button
							icon='LeftToRightListStar'
							title='Unordered List'
							aria-label='Unordered List'
						/>
					</ButtonGroup>
				</div>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropdownFormattingButtonGroupExample;
