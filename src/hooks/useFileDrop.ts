import { useRef, useState, type DragEvent } from 'react';

const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes('Files');

/**
 * Files dragged from the desktop onto an element. `isDragging` is true while
 * files hover over it — children firing their own enter/leave events don't
 * flicker it — and `onFiles` gets what was dropped. Spread `dropProps` on the
 * element that should accept the drop.
 */
const useFileDrop = (onFiles: (files: File[]) => void, enabled = true) => {
	const [isDragging, setIsDragging] = useState(false);
	const depth = useRef(0);

	const reset = () => {
		depth.current = 0;
		setIsDragging(false);
	};

	const dropProps = {
		onDragEnter: (event: DragEvent) => {
			if (!enabled || !carriesFiles(event)) return;
			event.preventDefault();
			depth.current += 1;
			setIsDragging(true);
		},
		onDragOver: (event: DragEvent) => {
			if (!enabled || !carriesFiles(event)) return;
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		},
		onDragLeave: (event: DragEvent) => {
			if (!enabled || !carriesFiles(event)) return;
			depth.current = Math.max(depth.current - 1, 0);
			if (depth.current === 0) setIsDragging(false);
		},
		onDrop: (event: DragEvent) => {
			if (!enabled || !carriesFiles(event)) return;
			event.preventDefault();
			reset();
			if (event.dataTransfer.files.length) onFiles(Array.from(event.dataTransfer.files));
		},
	};

	return { isDragging: enabled && isDragging, dropProps };
};

export default useFileDrop;
