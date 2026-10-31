import { Activity, Bot, ClipboardCheck, FlaskConical, Lightbulb, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Everything the backend records as a `Run`, by its `runnable_type` morph alias. */
export const RUN_KINDS = {
	workflow: { label: 'Workflow', icon: Workflow },
	agent_session: { label: 'Chat', icon: Bot },
	reflection_run: { label: 'Reflection', icon: Lightbulb },
	agent_session_evaluation: { label: 'Chat grading', icon: ClipboardCheck },
	agent_eval_run: { label: 'Eval suite', icon: FlaskConical },
} satisfies Record<string, { label: string; icon: LucideIcon }>;

export type TRunKind = keyof typeof RUN_KINDS;

export const runKind = (runnableType: string): { label: string; icon: LucideIcon } =>
	RUN_KINDS[runnableType as TRunKind] ?? { label: 'Run', icon: Activity };
