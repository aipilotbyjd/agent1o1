import {
	forwardRef,
	HTMLAttributes,
	ReactNode,
	RefObject,
	useEffect,
	useRef,
	useState,
} from 'react';
import { useFloating, offset, flip, shift, autoUpdate, VirtualElement } from '@floating-ui/react';
import Portal from '@/components/layout/Portal/Portal';

// @start-snippet:: interface
interface IContextMenuProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}
// @end-snippet:: interface
const ContextMenu = forwardRef<HTMLDivElement, IContextMenuProps>((props, ref) => {
	const { children } = props;

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const clickPositionRef = useRef<{ pageX: number; pageY: number }>({ pageX: 0, pageY: 0 });

	const { refs, floatingStyles, update } = useFloating({
		placement: 'bottom-start',
		middleware: [offset(0), flip(), shift()],
		whileElementsMounted: autoUpdate,
	});

	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const element = (ref as RefObject<HTMLDivElement>).current;
		if (!element) return;

		const handleContextMenu = (e: MouseEvent) => {
			e.preventDefault();
			clickPositionRef.current = { pageX: e.pageX, pageY: e.pageY };
			setIsOpen(true);
		};

		element.addEventListener('contextmenu', handleContextMenu);

		return () => {
			element.removeEventListener('contextmenu', handleContextMenu);
		};
	}, [ref]);

	useEffect(() => {
		if (!isOpen) return;

		const virtualEl: VirtualElement = {
			getBoundingClientRect: () => {
				const x = clickPositionRef.current.pageX - window.scrollX;
				const y = clickPositionRef.current.pageY - window.scrollY;
				return {
					width: 0,
					height: 0,
					top: y,
					right: x,
					bottom: y,
					left: x,
					x,
					y,
					toJSON: () => {},
				};
			},
		};

		refs.setReference(virtualEl);
		update();

		const handleScroll = () => {
			update();
		};

		window.addEventListener('scroll', handleScroll, true);

		return () => {
			window.removeEventListener('scroll', handleScroll, true);
		};
	}, [isOpen, refs, update]);

	useEffect(() => {
		if (!isOpen) return;

		const clickHandler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('click', clickHandler);
		return () => document.removeEventListener('click', clickHandler);
	}, [isOpen]);

	return (
		<>
			{isOpen && (
				<Portal>
					<div
						ref={(node) => {
							menuRef.current = node;
							refs.setFloating(node);
						}}
						className='inline-flex'
						style={floatingStyles}>
						{children}
					</div>
				</Portal>
			)}
		</>
	);
});

ContextMenu.displayName = 'ContextMenu';

export default ContextMenu;
