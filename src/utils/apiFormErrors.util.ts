import type { FormikErrors, FormikProps, FormikTouched } from 'formik';
import { ApiError } from '@/api/core';

/**
 * Pushes a 422's field errors onto the matching formik fields. Form field
 * names are kept identical to the backend's (`password_confirmation`, not
 * `repeatPassword`) so this stays a straight copy with no mapping table.
 *
 * Returns true when the error was a validation failure that has now been
 * shown on the form.
 */
export const applyApiFieldErrors = <TValues extends object>(
	error: unknown,
	form: FormikProps<TValues>,
): boolean => {
	if (!ApiError.is(error) || !error.isValidation) return false;

	const fieldErrors = error.fieldErrors();
	const names = Object.keys(fieldErrors);
	if (names.length === 0) return false;

	const touched = names.reduce<Record<string, boolean>>((acc, name) => {
		acc[name] = true;
		return acc;
	}, {});

	// Touch first: formik only renders an error for a field the user is
	// considered to have visited.
	form.setTouched(touched as FormikTouched<TValues>, false);
	form.setErrors(fieldErrors as FormikErrors<TValues>);
	return true;
};

export default applyApiFieldErrors;
