import type {
	TAiKeyPolicy,
	TAiKeyPolicyImpact,
	TPlatformKeyUsage,
	TUpdateAiKeyPolicyDto,
} from '@/types/ai-provider.type';

const strictness: Record<TPlatformKeyUsage, number> = { fallback: 0, when_no_key: 1, never: 2 };

/** Only a change that takes something away is worth checking before it's saved. */
export const isStricter = (current: TAiKeyPolicy, change: TUpdateAiKeyPolicyDto) =>
	(change.platform_usage !== undefined &&
		strictness[change.platform_usage] > strictness[current.platform_usage]) ||
	(change.allow_personal_keys === false && current.allow_personal_keys);

export const hasImpact = (impact: TAiKeyPolicyImpact) =>
	impact.unavailable_models.length > 0 ||
	impact.affected_agents.length > 0 ||
	impact.models_losing_backup.length > 0 ||
	impact.ignored_personal_keys > 0;
