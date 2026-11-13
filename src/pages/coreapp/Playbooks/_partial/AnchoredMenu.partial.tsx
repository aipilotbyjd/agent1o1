import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** The trigger's viewport rect at the moment the menu was opened. */
export type TMenuAnchor = { top: number; bottom: number; right: number };

const GAP = 6;
const VIEWPORT_GUTTER = 12;

type TPlacement = { top: number; left: number; flip: boolean; maxHeight: number };

/**
 * Renders a dropdown in a portal, right-aligned to its trigger. It opens below
 * unless the menu's measured height doesn't fit there and there is more room
 * above, and is capped to the space it has so it never runs off-screen. The
 * measurement happens before paint, so it never flashes in the wrong place.
 */
const AnchoredMenu = ({
	anchor,
	children,
}: {
	anchor: TMenuAnchor;
	children: (maxHeight: number) => ReactNode;
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [placement, setPlacement] = useState<TPlacement | null>(null);

	useLayoutEffect(() => {
		const height = ref.current?.scrollHeight ?? 0;
		const spaceBelow = window.innerHeight - anchor.bottom - GAP - VIEWPORT_GUTTER;
		const spaceAbove = anchor.top - GAP - VIEWPORT_GUTTER;
		const flip = height > spaceBelow && spaceAbove > spaceBelow;
		setPlacement({
			top: flip ? anchor.top - GAP : anchor.bottom + GAP,
			left: Math.min(anchor.right, window.innerWidth - VIEWPORT_GUTTER),
			flip,
			maxHeight: flip ? spaceAbove : spaceBelow,
		});
	}, [anchor]);

	return createPortal(
		<div
			ref={ref}
			className='fixed z-[120]'
			style={
				placement
					? {
							top: placement.top,
							left: placement.left,
							transform: `translateX(-100%)${placement.flip ? ' translateY(-100%)' : ''}`,
						}
					: { top: 0, left: 0, visibility: 'hidden' }
			}>
			{children(placement?.maxHeight ?? window.innerHeight)}
		</div>,
		document.body,
	);
};

export default AnchoredMenu;
