import { RefObject, useEffect, useLayoutEffect, useState } from 'react';

const useDomRect = (ref: RefObject<HTMLElement>): [DOMRect | null] => {
	const [domRect, setDomRect] = useState<DOMRect | null>(null);

	useLayoutEffect(() => {
		const element = ref?.current;
		if (!element) return;

		setDomRect(element.getBoundingClientRect());

		const resizeObserver = new ResizeObserver(() => {
			setDomRect(element.getBoundingClientRect());
		});

		resizeObserver.observe(element);
		return () => {
			resizeObserver.unobserve(element);
			resizeObserver.disconnect();
		};
	}, [ref, ref.current]);

	useEffect(() => {
		const scrollHandler = () => {
			if (ref?.current) {
				setDomRect(ref.current.getBoundingClientRect());
			}
		};
		window.addEventListener('scroll', scrollHandler, true);
		return () => {
			window.removeEventListener('scroll', scrollHandler, true);
		};
	}, [ref, ref.current]);

	return [domRect];
};

export default useDomRect;
