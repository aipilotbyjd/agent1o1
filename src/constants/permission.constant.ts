/** Shown when the backend refuses an action the viewer's workspace role does not grant. */
export const NO_PERMISSION_MESSAGE = "You don't have permission to do that in this workspace.";

/** Hint for a control the viewer's workspace role does not grant, e.g. `noPermissionTo('change skills')`. */
export const noPermissionTo = (action: string) => `You don't have permission to ${action}.`;
