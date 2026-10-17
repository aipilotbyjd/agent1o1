import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/api/core';
import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';
import type { TPageSubmissionResult } from '@/types/workflow-page.type';
import safeStorage from '@/utils/safeStorage.util';
import {
	initialRunFormValues,
	RunFormJsonError,
	runFormInput,
	type TRunFormValues,
} from '@/utils/runForm.util';

/**
 * How a page starts a run and reads its result: through the member API
 * inside the app, or the public link outside it. `secret` is what the
 * public link hands back to read a result; members don't need one.
 */
export type TPageTransport = {
	submit: (input: Record<string, unknown>) => Promise<{ result: TPageSubmissionResult; secret?: string }>;
	poll: (submissionId: string, secret: string | undefined, signal: AbortSignal) => Promise<TPageSubmissionResult>;
	/** Where the run in progress is remembered, so a reload picks it back up.
	 *  `submit` and `poll` must keep their identity between renders. */
	storageKey?: string;
	/** Called once, when the visitor first changes a field. */
	onStart?: () => void;
};

export type TPageRunPhase = 'idle' | 'submitting' | 'running' | 'done';

export type TPageRun = {
	values: TRunFormValues;
	errors: Record<string, string>;
	formError: string | null;
	phase: TPageRunPhase;
	result: TPageSubmissionResult | null;
	setValue: (key: string, value: unknown) => void;
	submit: () => void;
	reset: () => void;
};

type TStored = { id: string; secret?: string };

const INPUT_ERROR_PREFIX = 'input.';

const isFinished = (result: TPageSubmissionResult) =>
	result.state === 'completed' || result.state === 'failed';

/** Quick at first, when most runs finish, then backing off for long ones. */
const pollDelay = (attempt: number, state: TPageSubmissionResult['state']) => {
	if (state === 'waiting') return 5000;
	if (attempt < 10) return 1000;
	if (attempt < 30) return 2000;
	return 4000;
};

const readStored = (key?: string): TStored | null => {
	if (!key) return null;
	try {
		const parsed = JSON.parse(safeStorage.get(key, 'session') ?? 'null');
		return parsed && typeof parsed.id === 'string' ? parsed : null;
	} catch {
		return null;
	}
};

export const usePageRun = (fields: TWorkflowInterfaceField[], transport: TPageTransport): TPageRun => {
	const fieldsKey = fields.map((field) => `${field.key}:${field.type}`).join('|');
	const [syncedFieldsKey, setSyncedFieldsKey] = useState(fieldsKey);
	const [values, setValues] = useState<TRunFormValues>(() => initialRunFormValues(fields));
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [tracking, setTracking] = useState<TStored | null>(() => readStored(transport.storageKey));
	const [phase, setPhase] = useState<TPageRunPhase>(() => (tracking ? 'running' : 'idle'));
	const [result, setResult] = useState<TPageSubmissionResult | null>(null);

	// The fields can arrive after the first render, or change while the
	// builder edits the page; keep what was typed for the fields that stay.
	if (syncedFieldsKey !== fieldsKey) {
		setSyncedFieldsKey(fieldsKey);
		setValues((current) => initialRunFormValues(fields, current));
	}

	const { poll, submit: send, storageKey } = transport;

	useEffect(() => {
		if (!tracking) return;
		const controller = new AbortController();
		let timer: number | undefined;
		let attempt = 0;

		const tick = () => {
			poll(tracking.id, tracking.secret, controller.signal)
				.then((next) => {
					if (controller.signal.aborted) return;
					setResult(next);
					if (isFinished(next)) {
						setPhase('done');
						setTracking(null);
						if (storageKey) safeStorage.remove(storageKey, 'session');
						return;
					}
					setPhase('running');
					timer = window.setTimeout(tick, pollDelay(attempt++, next.state));
				})
				.catch(() => {
					if (controller.signal.aborted) return;
					// A result that can no longer be read (expired, link rotated)
					// just ends the wait; a network blip is retried.
					attempt++;
					if (attempt > 40) {
						setPhase('idle');
						setTracking(null);
						return;
					}
					timer = window.setTimeout(tick, 3000);
				});
		};

		tick();

		return () => {
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [tracking, poll, storageKey]);

	const submit = useCallback(() => {
		let input: Record<string, unknown>;
		try {
			input = runFormInput(fields, values);
		} catch (error) {
			if (error instanceof RunFormJsonError) {
				setErrors({ [error.field.key]: error.message });
				return;
			}
			throw error;
		}

		setErrors({});
		setFormError(null);
		setResult(null);
		setPhase('submitting');

		send(input)
			.then(({ result: started, secret }) => {
				setResult(started);
				if (isFinished(started)) {
					setPhase('done');
					return;
				}
				const stored = { id: started.id, secret };
				if (storageKey) safeStorage.set(storageKey, JSON.stringify(stored), 'session');
				setPhase('running');
				setTracking(stored);
			})
			.catch((error: unknown) => {
				setPhase('idle');
				if (ApiError.is(error) && error.isValidation) {
					const fieldErrors: Record<string, string> = {};
					const other: string[] = [];
					for (const [key, message] of Object.entries(error.fieldErrors())) {
						if (key.startsWith(INPUT_ERROR_PREFIX)) {
							fieldErrors[key.slice(INPUT_ERROR_PREFIX.length)] = message;
						} else {
							other.push(message);
						}
					}
					setErrors(fieldErrors);
					// A required input the page doesn't show can only be reported here.
					const hidden = Object.keys(fieldErrors).filter(
						(key) => !fields.some((field) => field.key === key),
					);
					setFormError(
						other[0] ??
							(hidden.length > 0
								? fieldErrors[hidden[0]]
								: Object.keys(fieldErrors).length === 0
									? error.message
									: null),
					);
					return;
				}
				setFormError(ApiError.is(error) ? error.message : 'Something went wrong. Try again.');
			});
	}, [fields, values, send, storageKey]);

	const started = useRef(false);
	const onStart = transport.onStart;

	const setValue = useCallback((key: string, value: unknown) => {
		if (!started.current) {
			started.current = true;
			onStart?.();
		}
		setValues((current) => ({ ...current, [key]: value }));
		setErrors((current) => {
			if (!(key in current)) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}, [onStart]);

	const reset = useCallback(() => {
		setTracking(null);
		setResult(null);
		setPhase('idle');
		setErrors({});
		setFormError(null);
		if (storageKey) safeStorage.remove(storageKey, 'session');
	}, [storageKey]);

	return { values, errors, formError, phase, result, setValue, submit, reset };
};
