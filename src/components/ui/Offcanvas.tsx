import {
	Children,
	cloneElement,
	Dispatch,
	FC,
	forwardRef,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	SetStateAction,
	useId,
	useRef,
} from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import classNames from 'classnames';
import useEventListener from '@/hooks/useEventListener';
import Portal from '@/components/layout/Portal/Portal';
import CloseButton from './CloseButton';
import themeConfig from '@/config/theme.config';

// @start-snippet:: interface
type TOffcanvasPositionVertical = 'top' | 'bottom';
type TOffcanvasPositionHorizontal = 'left' | 'right';
export type TOffcanvasPosition = TOffcanvasPositionVertical | TOffcanvasPositionHorizontal;
// @end-snippet:: interface

const defaultProps: { position: TOffcanvasPosition } = {
	position: 'right',
};

const checkComp = (
	componentName: 'OffcanvasHeader' | 'OffcanvasBody' | 'OffcanvasFooter',
	child:
		| ReactElement<IOffcanvasHeaderProps>
		| ReactElement<IOffcanvasBodyProps>
		| ReactElement<IOffcanvasFooterProps>,
): boolean => {
	return [componentName].includes(
		// @ts-expect-error
		child?.type?.displayName,
	);
};

// @start-snippet:: interface
interface IOffcanvasHeaderClonedProps {
	setIsOpen?: Dispatch<SetStateAction<boolean>>;
	titleId?: string;
}
interface IOffcanvasHeaderProps
	extends HTMLAttributes<HTMLDivElement>, IOffcanvasHeaderClonedProps {
	children: ReactNode;
	className?: string;
	hasCloseButton?: boolean;
	rightContent?: ReactNode;
}
// @end-snippet:: interface
export const OffcanvasHeader: FC<IOffcanvasHeaderProps> = (props) => {
	const {
		children,
		className,
		titleId,
		setIsOpen,
		hasCloseButton = true,
		rightContent,
		...rest
	} = props;

	const classes = classNames(
		'flex items-center justify-between px-4 pb-4 text-2xl font-semibold first:pt-4',
	);

	return (
		<div
			data-component-name='Offcanvas/OffcanvasHeader'
			className={classNames(classes, className)}
			{...rest}>
			<div id={titleId} className='flex items-center'>
				{children}
			</div>
			{(rightContent || hasCloseButton) && (
				<div className='flex items-center gap-2'>
					{rightContent}
					{hasCloseButton && (
						<CloseButton
							aria-label='Close'
							setIsOpen={() => (setIsOpen ? setIsOpen(false) : undefined)}
						/>
					)}
				</div>
			)}
		</div>
	);
};
OffcanvasHeader.displayName = 'OffcanvasHeader';

// @start-snippet:: interface
interface IOffcanvasBodyProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const OffcanvasBody: FC<IOffcanvasBodyProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames('grow px-4 pb-4 first:pt-4', 'overflow-y-auto');

	return (
		<div
			data-component-name='Offcanvas/OffcanvasBody'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};
OffcanvasBody.displayName = 'OffcanvasBody';

// @start-snippet:: interface
interface IOffcanvasFooterChildProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const OffcanvasFooterChild: FC<IOffcanvasFooterChildProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames('flex items-center gap-4');

	return (
		<div
			data-component-name='Offcanvas/OffcanvasFooterChild'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};
OffcanvasFooterChild.displayName = 'OffcanvasFooterChild';

// @start-snippet:: interface
interface IOffcanvasFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const OffcanvasFooter: FC<IOffcanvasFooterProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames('flex items-center justify-between px-4 pb-4 first:pt-4');

	return (
		<div
			data-component-name='Offcanvas/OffcanvasFooter'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};
OffcanvasFooter.displayName = 'OffcanvasFooter';

/**
 * BackDrop
 * @constructor
 */
const BackDrop = () => {
	const animationProps = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { ease: 'easeInOut', duration: 0.3 },
	};
	return (
		// @ts-ignore
		<motion.div
			data-component-name='Offcanvas/BackDrop'
			{...animationProps}
			// @ts-ignore
			className='fixed top-0 left-0 z-[1050] h-screen w-screen backdrop-blur-xs'
		/>
	);
};

/**
 * Content
 * @constructor
 */
// @start-snippet:: interface
interface IContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
// @end-snippet:: interface
export const Content: FC<IContentProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames(
		'pointer-events-auto relative flex h-full w-full flex-col overflow-hidden bg-white/75 dark:bg-zinc-950/95 backdrop-blur-md',
		className,
	);
	return (
		<div data-component-name='Offcanvas/Content' className={classes} {...rest}>
			{children}
		</div>
	);
};

/**
 * Dialog
 * @constructor
 */
// @start-snippet:: interface
interface IDialogProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	position?: TOffcanvasPosition;
	className?: string;
}
// @end-snippet:: interface
const Dialog = forwardRef<HTMLDivElement, IDialogProps>((props, ref) => {
	const { children, position = defaultProps.position, className, ...rest } = props;

	const classes = classNames(
		'pointer-events-none fixed w-full h-full shadow-2xl',
		{
			'max-w-[30rem]': ['right', 'left'].includes(position as TOffcanvasPositionHorizontal),
			'left-0': position === 'left',
			'right-0': position === 'right',
			'max-h-[30rem]': ['top', 'bottom'].includes(position as TOffcanvasPositionVertical),
			'top-0': position === 'top',
			'bottom-0': position === 'bottom',
		},
		className,
	);

	return (
		<div data-component-name='Offcanvas/Dialog' ref={ref} className={classes} {...rest}>
			{children}
		</div>
	);
});
Dialog.displayName = 'Dialog';

// @start-snippet:: interface
export interface IOffcanvasProps extends MotionProps {
	children:
		| ReactElement<IOffcanvasHeaderProps>[]
		| ReactElement<IOffcanvasBodyProps>[]
		| ReactElement<IOffcanvasFooterProps>[];
	isAnimation?: boolean;
	isOpen: boolean;
	isStaticBackdrop?: boolean;
	position?: TOffcanvasPosition;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	dialogClassName?: string;
	contentClassName?: string;
}
// @end-snippet:: interface
const Offcanvas: FC<IOffcanvasProps> = (props) => {
	const {
		children,
		isOpen,
		setIsOpen,
		isStaticBackdrop = false,
		isAnimation = true,
		position = defaultProps.position,
		dialogClassName,
		contentClassName,
		...rest
	} = props;
	const refOffcanvas = useRef(null);
	const ref = useRef(null);

	const titleId = useId();

	// Backdrop close function
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const closeOffcanvas = (event: { target: any }) => {
		// @ts-expect-error
		if (ref.current && !ref.current.contains(event.target) && !isStaticBackdrop) {
			setIsOpen(false);
		}
	};
	useEventListener('mousedown', closeOffcanvas);
	useEventListener('touchstart', closeOffcanvas); // Touchscreen

	// Backdrop static function
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const offCanvasStatic = (event: { target: any }) => {
		// @ts-expect-error
		if (ref.current && !ref.current.contains(event.target) && isStaticBackdrop) {
			// @ts-expect-error
			refOffcanvas.current.classList.add('scale-105!');

			// @ts-expect-error
			setTimeout(() => refOffcanvas.current.classList.remove('scale-105!'), 300);
		}
	};
	useEventListener('mousedown', offCanvasStatic);
	useEventListener('touchstart', offCanvasStatic); // Touchscreen

	// Keypress close function
	const escFunction = (event: { key: string }) => {
		if (event.key === 'Escape') {
			setIsOpen(false);
		}
	};
	useEventListener('keydown', escFunction);

	const animationProps = isAnimation
		? {
				animate: { opacity: 1, x: '0%', y: '0%' },
				transition: { ease: 'easeInOut', duration: 0.3 },
			}
		: null;

	const animationPositionProps = isAnimation
		? {
				top: {
					initial: { opacity: 0, y: '-50%' },
					exit: { opacity: 0, y: '-50%' },
				},
				right: {
					initial: { opacity: 0, x: '50%' },
					exit: { opacity: 0, x: '50%' },
				},
				bottom: {
					initial: { opacity: 0, y: '50%' },
					exit: { opacity: 0, y: '50%' },
				},
				left: {
					initial: { opacity: 0, x: '-50%' },
					exit: { opacity: 0, x: '-50%' },
				},
			}
		: null;

	const classes = classNames(
		'fixed left-0 top-0 z-[1055] block h-full w-full overflow-y-auto overflow-x-hidden',
		{ [`${themeConfig.transition}`]: isStaticBackdrop },
	);

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<>
						{/*@ts-ignore*/}
						<motion.div
							data-component-name='Offcanvas'
							ref={refOffcanvas}
							key='offCanvas'
							// @ts-ignore
							className={classes}
							role='dialog'
							tabIndex={-1}
							aria-labelledby={titleId}
							aria-hidden='true'
							{...animationProps}
							{...animationPositionProps?.[position || 'right']}
							{...rest}>
							<Dialog ref={ref} position={position} className={dialogClassName}>
								<Content className={contentClassName}>
									{Children.map(
										children,
										(child) =>
											(checkComp('OffcanvasHeader', child) &&
												cloneElement(child, {
													// @ts-expect-error
													setIsOpen,
													titleId,
												})) ||
											child,
									)}
								</Content>
							</Dialog>
						</motion.div>
						<BackDrop />
					</>
				)}
			</AnimatePresence>
		</Portal>
	);
};

export default Offcanvas;
