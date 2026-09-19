import { useEffect } from 'react';
import { useWorkflowEditor } from '../_context/WorkflowEditorProvider.context';
import { useRunWorkflow } from '../_hooks/useRunWorkflow.hook';

export const isTypingTarget = (target: EventTarget | null) => {
	if (!(target instanceof HTMLElement)) return false;
	return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
};

export const useEditorHotkeys = () => {
	const { dispatch, state } = useWorkflowEditor();
	const { runWorkflow, stopRun } = useRunWorkflow();

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const mod = event.metaKey || event.ctrlKey;

			// Undo/Redo
			if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
				event.preventDefault();
				dispatch({ type: 'UNDO' });
				return;
			}
			if (
				(mod && event.shiftKey && event.key.toLowerCase() === 'z') ||
				(mod && event.key.toLowerCase() === 'y')
			) {
				event.preventDefault();
				dispatch({ type: 'REDO' });
				return;
			}

			// Run/Stop workflow
			if (mod && event.key === 'Enter') {
				event.preventDefault();
				if (state.run.status === 'running') {
					stopRun();
				} else {
					runWorkflow();
				}
				return;
			}

			// Quick add node
			if (mod && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				dispatch({ type: 'SET_QUICK_ADD', open: true });
				return;
			}

			// Command palette
			if (mod && event.key.toLowerCase() === 'p') {
				event.preventDefault();
				dispatch({ type: 'SET_COMMAND_PALETTE', open: true });
				return;
			}

			// AI Builder
			if (mod && event.key.toLowerCase() === 'j' && !event.shiftKey) {
				event.preventDefault();
				dispatch({ type: 'TOGGLE_AI_PANEL' });
				return;
			}

			// Toggle panels
			if (mod && event.shiftKey && event.key.toLowerCase() === 'l') {
				event.preventDefault();
				dispatch({ type: 'TOGGLE_LEFT_PANEL' });
				return;
			}
			if (mod && event.shiftKey && event.key.toLowerCase() === 'r') {
				event.preventDefault();
				dispatch({ type: 'TOGGLE_RUN_PANEL' });
				return;
			}
			if (mod && event.shiftKey && event.key.toLowerCase() === 'e') {
				event.preventDefault();
				dispatch({ type: 'SET_IMPORT_EXPORT', open: true });
				return;
			}

			// Canvas search
			if (mod && event.key.toLowerCase() === 'f') {
				event.preventDefault();
				dispatch({ type: 'SET_CANVAS_SEARCH', open: true });
				return;
			}

			// Keyboard shortcuts cheat sheet
			if (!isTypingTarget(event.target) && event.key === '?') {
				event.preventDefault();
				dispatch({ type: 'SET_SHORTCUTS_OPEN', open: true });
				return;
			}

			// Template library
			if (mod && event.shiftKey && event.key.toLowerCase() === 't') {
				event.preventDefault();
				dispatch({ type: 'SET_TEMPLATE_LIBRARY', open: true });
				return;
			}

			// Node documentation (Cmd+I)
			if (mod && event.key.toLowerCase() === 'i') {
				event.preventDefault();
				dispatch({ type: 'SET_NODE_DOC', open: !state.ui.nodeDocOpen });
				return;
			}

			// Version diff viewer (Cmd+Shift+V)
			if (mod && event.shiftKey && event.key.toLowerCase() === 'v') {
				event.preventDefault();
				dispatch({ type: 'SET_DIFF_VIEWER', open: true });
				return;
			}

			// Toggle step-through debug mode (Cmd+Shift+D)
			if (mod && event.shiftKey && event.key.toLowerCase() === 'd') {
				event.preventDefault();
				dispatch({ type: 'SET_STEP_MODE', enabled: !state.ui.stepMode });
				return;
			}

			// Step next (Space — when in step mode and waiting)
			if (
				!isTypingTarget(event.target) &&
				event.key === ' ' &&
				state.ui.stepMode &&
				state.ui.waitingForStep
			) {
				event.preventDefault();
				dispatch({ type: 'STEP_NEXT' });
				return;
			}

			// Breakpoint toggle (B key)
			if (
				!isTypingTarget(event.target) &&
				event.key.toLowerCase() === 'b' &&
				state.ui.selectedNodeId
			) {
				event.preventDefault();
				dispatch({ type: 'TOGGLE_NODE_BREAKPOINT', id: state.ui.selectedNodeId });
				return;
			}

			// Auto-layout
			if (!isTypingTarget(event.target) && event.key.toLowerCase() === 'l') {
				event.preventDefault();
				dispatch({ type: 'AUTO_LAYOUT' });
				return;
			}

			// Select all nodes (Cmd/Ctrl+A)
			if (mod && event.key.toLowerCase() === 'a' && !isTypingTarget(event.target)) {
				event.preventDefault();
				dispatch({ type: 'SELECT_ALL_NODES' });
				return;
			}

			// Node operations
			if (mod && event.key.toLowerCase() === 'd') {
				event.preventDefault();
				dispatch({ type: 'DUPLICATE_SELECTED' });
				return;
			}
			if (
				!isTypingTarget(event.target) &&
				['Backspace', 'Delete'].includes(event.key) &&
				(state.ui.selectedNodeIds.length > 0 || state.ui.selectedNodeId)
			) {
				event.preventDefault();
				dispatch({ type: 'DELETE_SELECTED' });
				return;
			}

			// Escape — close any open floating UI
			if (event.key === 'Escape') {
				if (state.ui.canvasSearchOpen) {
					dispatch({ type: 'SET_CANVAS_SEARCH', open: false, query: '' });
				}
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [
		dispatch,
		state.run.status,
		state.ui.selectedNodeId,
		state.ui.selectedNodeIds,
		state.ui.canvasSearchOpen,
		state.ui.nodeDocOpen,
		state.ui.stepMode,
		state.ui.waitingForStep,
		runWorkflow,
		stopRun,
	]);
};
