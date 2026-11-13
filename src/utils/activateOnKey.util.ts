import type { KeyboardEvent } from 'react';

/** Keyboard counterpart of `onClick` for an element with `role='button'`. */
export const activateOnKey = (action: () => void) => (event: KeyboardEvent<HTMLElement>) => {
	if (event.key !== 'Enter' && event.key !== ' ') return;
	event.preventDefault();
	action();
};
