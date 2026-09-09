import { cloneElement, FC, ReactElement, ReactNode, useRef, useState } from 'react';
import classNames from 'classnames';
import {
	useFloating,
	offset,
	flip,
	shift,
	arrow,
	autoUpdate,
	useClick,
	useDismiss,
	useRole,
	useInteractions,
	FloatingArrow,
	FloatingPortal,
	FloatingFocusManager,
	Placement,
} from '@floating-ui/react';

const getComponentName = (child: ReactNode): string => {
	// @ts-ignore
	return child?.props['data-component-name'] || child?.type?.displayName || child?.type;
};

// @start-snippet:: interface
interface IPopoverProps {
	children: ReactNode;
	content: ReactNode;
	className?: string;
	placement?: Placement;
}
// @end-snippet:: interface
const getSpacePlacement = (placement: Placement | undefined): string => {
	if (placement?.includes('right')) return 'ms-2';
	if (placement?.includes('bottom')) return 'mt-2';
	if (placement?.includes('left')) return 'me-2';
	return 'mb-2';
};

const Popover: FC<IPopoverProps> = (props) => {
	const { children, className, content, placement = 'top', ...rest } = props;

	const arrowRef = useRef(null);

	const [isOpen, setIsOpen] = useState<boolean>(false);

	const { refs, floatingStyles, context } = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement,
		// eslint-disable-next-line react-hooks/refs
		middleware: [offset(8), flip(), shift(), arrow({ element: arrowRef })],
		whileElementsMounted: autoUpdate,
	});

	const click = useClick(context);
	const dismiss = useDismiss(context);
	const role = useRole(context);

	const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

	return (
		<>
			{cloneElement(children as ReactElement, {
				// @ts-ignore
				'data-component-name': `${getComponentName(children)} is cloned with Popover`,
				ref: refs.setReference,
				// @ts-expect-error
				className: classNames('cursor-pointer', children.props.className),
				...getReferenceProps(),
			})}
			{isOpen && content && (
				<FloatingPortal>
					<FloatingFocusManager context={context} modal={false}>
						{typeof content === 'string' ? (
							<div
								data-component-name='Tooltip/Popper'
								ref={refs.setFloating}
								style={floatingStyles}
								className={classNames(
									'z-[9999] px-2 py-1',
									'max-w-xs',
									'rounded-md border border-zinc-500/10 shadow-lg backdrop-blur-xs',
									getSpacePlacement(placement),
									className,
								)}
								{...getFloatingProps()}
								{...rest}>
								{content}
								<FloatingArrow
									ref={arrowRef}
									context={context}
									className='relative z-[9999] fill-zinc-50 dark:fill-zinc-950 [&>path:first-of-type]:stroke-zinc-500/10'
									strokeWidth={0.5}
								/>
							</div>
						) : (
							<div
								// eslint-disable-next-line react-hooks/refs
								ref={refs.setFloating}
								style={floatingStyles}
								className={classNames(
									'z-[9999] drop-shadow-lg',
									getSpacePlacement(placement),
									className,
								)}
								{...getFloatingProps()}
								{...rest}>
								{content}
								<FloatingArrow
									ref={arrowRef}
									context={context}
									className='relative z-[9999] fill-zinc-50 dark:fill-zinc-950 [&>path:first-of-type]:stroke-zinc-500/10'
									strokeWidth={0.5}
								/>
							</div>
						)}
					</FloatingFocusManager>
				</FloatingPortal>
			)}
		</>
	);
};
Popover.displayName = 'Popover';

export default Popover;
