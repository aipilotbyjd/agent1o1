import type { TSkillSourceConflict } from '@/types/agent-skill.type';

export const isValidSkillExportPath = (path: string) =>
	path.length > 0 &&
	path.length <= 200 &&
	!/(^\/|\\|[\x00-\x1f\x7f]|(^|\/)\.{1,2}(\/|$)|\/\/|\/$)/.test(path);

export const conflictFingerprint = (conflict: TSkillSourceConflict) =>
	JSON.stringify([conflict.commit_sha, conflict.local, conflict.remote]);

export const changedConflictFiles = (conflict: TSkillSourceConflict) =>
	[
		...new Set([
			...Object.keys(conflict.base ?? {}),
			...Object.keys(conflict.local ?? {}),
			...Object.keys(conflict.remote ?? {}),
		]),
	]
		.filter((file) => conflict.local?.[file] !== conflict.remote?.[file])
		.sort();

export type TConflictChoice = {
	fingerprint: string;
	resolution: 'local' | 'remote' | 'merged';
	files?: Record<string, string>;
};
export const selectedConflictResolution = (
	conflict: TSkillSourceConflict,
	choice?: TConflictChoice,
) =>
	choice?.fingerprint === conflictFingerprint(conflict) ? choice.resolution : conflict.resolution;

export const selectedConflictFiles = (conflict: TSkillSourceConflict, choice?: TConflictChoice) =>
	choice?.fingerprint === conflictFingerprint(conflict) ? choice.files : conflict.merged;
