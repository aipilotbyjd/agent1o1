/** What an agent run was, by its `runnable_type` morph alias. A chat turn has none. */
export const AGENT_RUN_KINDS: Record<string, string> = {
	reflection_run: 'Reflection',
	agent_session_evaluation: 'Chat grading',
	agent_eval_run: 'Eval suite',
};
