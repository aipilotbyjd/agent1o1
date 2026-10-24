import type { TWorkflowInterfaceField } from '@/types/workflow-extras.type';

export type TRunFormValues = Record<string, unknown>;

export class RunFormJsonError extends Error {
	constructor(public readonly field: TWorkflowInterfaceField) {
		super(`${field.label || field.key} is not valid JSON.`);
	}
}

const emptyValue = (field: TWorkflowInterfaceField) => (field.type === 'boolean' ? false : '');

const toFormValue = (field: TWorkflowInterfaceField, value: unknown) =>
	field.type === 'json' && value != null && typeof value !== 'string'
		? JSON.stringify(value, null, 2)
		: (value ?? emptyValue(field));

/** Form values for `fields`, preferring what was entered last time over defaults. */
export const initialRunFormValues = (
	fields: TWorkflowInterfaceField[],
	previous: TRunFormValues = {},
): TRunFormValues =>
	Object.fromEntries(
		fields.map((field) => [
			field.key,
			field.key in previous ? previous[field.key] : toFormValue(field, field.default),
		]),
	);

/** The run `input` for the filled-in form; empty fields are left out so defaults apply. */
export const runFormInput = (
	fields: TWorkflowInterfaceField[],
	values: TRunFormValues,
): Record<string, unknown> => {
	const input: Record<string, unknown> = {};
	for (const field of fields) {
		const raw = values[field.key];
		if (raw === '' || raw === undefined || raw === null) continue;
		if (field.type === 'number') {
			input[field.key] = Number(raw);
		} else if (field.type === 'json' && typeof raw === 'string') {
			try {
				input[field.key] = JSON.parse(raw);
			} catch {
				throw new RunFormJsonError(field);
			}
		} else {
			input[field.key] = raw;
		}
	}
	return input;
};
