import {
	Children,
	cloneElement,
	FC,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	useState,
} from 'react';
import classNames from 'classnames';
import Collapse from './Collapse';
import Icon from '@/components/icon/Icon';
import { TColors } from '@/types/colors.type';
import themeConfig from '@/config/theme.config';
import { TRounded } from '@/types/rounded.type';

// @start-snippet:: interface
type TAccordionSignProps = 'plus' | 'arrow' | 'no';
type TAccordionSignPositionProps = 'left' | 'right';
// @end-snippet:: interface

// @start-snippet:: interface
interface IAccordionItemProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
	id: string;
	title: string;
	// activeItem?: string;
	// setActiveItem?: Dispatch<SetStateAction<string | undefined>>;
	sign?: TAccordionSignProps;
	signPosition?: TAccordionSignPositionProps;
	color?: TColors;
}
// @end-snippet:: interface
export const AccordionItem: FC<IAccordionItemProps> = (props) => {
	const {
		id,
		children,
		className,
		title,
		// @ts-ignore
		activeItem,
		// @ts-ignore
		setActiveItem,
		sign,
		signPosition,
		color = themeConfig.themeColor,
		...rest
	} = props;

	const _isActive = activeItem === id;

	let _signIcon;

	switch (sign) {
		case 'plus':
			_signIcon = _isActive ? 'MinusSign' : 'PlusSign';
			break;
		case 'arrow':
			_signIcon = _isActive ? 'ArrowUp01' : 'ArrowDown01';
			break;
		default:
			_signIcon = null;
			break;
	}

	const _isLeftSign = signPosition === 'left';

	const accordionColor: Record<TColors, string> = {
		primary: 'data-active:text-primary-500',
		secondary: 'data-active:text-secondary-500',
		zinc: 'data-active:text-zinc-500',
		red: 'data-active:text-red-500',
		amber: 'data-active:text-amber-500',
		lime: 'data-active:text-lime-500',
		emerald: 'data-active:text-emerald-500',
		sky: 'data-active:text-sky-500',
		blue: 'data-active:text-blue-500',
		violet: 'data-active:text-violet-500',
	};

	return (
		<div
			key={id}
			id={id}
			data-component-name='Accordion/AccordionItem'
			className={classNames(className, 'border-b border-inherit last:border-none')}
			{...rest}>
			<button
				{...(_isActive && { 'data-active': '' })}
				onClick={() => (setActiveItem ? setActiveItem(_isActive ? undefined : id) : null)}
				className={classNames(
					'flex w-full items-center p-4 hover:opacity-75',
					'transition-all duration-300 ease-in-out',
					accordionColor[color],
				)}>
				<div className='flex grow items-center gap-2'>
					{_signIcon && _isLeftSign && <Icon icon={_signIcon} />}
					<span className='font-bold'>{title}</span>
				</div>
				<div>{_signIcon && !_isLeftSign && <Icon icon={_signIcon} />}</div>
			</button>
			<Collapse key={id} isOpen={activeItem === id}>
				<div className='px-4 pb-4'>{children}</div>
			</Collapse>
		</div>
	);
};
AccordionItem.displayName = 'AccordionItem';

// @start-snippet:: interface
interface IAccordionProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
	activeItemId?: string;
	sign?: TAccordionSignProps;
	signPosition?: TAccordionSignPositionProps;
	color?: TColors;
	rounded?: TRounded;
}
// @end-snippet:: interface
const Accordion: FC<IAccordionProps> = (props) => {
	const {
		children,
		className,
		activeItemId,
		sign = 'plus',
		signPosition = 'left',
		color,
		rounded = themeConfig.rounded,
		...rest
	} = props;

	const [activeItem, setActiveItem] = useState<string | undefined>(
		activeItemId || (Array.isArray(children) && children?.flat()[0].props.id),
	);
	return (
		<div
			data-component-name='Accordion'
			className={classNames(
				className,
				rounded,
				'border border-zinc-500/10 dark:border-zinc-500/25',
			)}
			{...rest}>
			{Children.map(children, (child) =>
				// @ts-ignore
				['AccordionItem'].includes(child?.type?.displayName) ? (
					cloneElement(child as ReactElement<IAccordionItemProps>, {
						// @ts-ignore
						activeItem,
						setActiveItem,
						sign,
						signPosition,
						// @ts-ignore
						color: child?.props?.color || color,
					})
				) : (
					<code>Only AccordionItem component should be used as a child.</code>
				),
			)}
		</div>
	);
};
Accordion.displayName = 'Accordion';

export default Accordion;
