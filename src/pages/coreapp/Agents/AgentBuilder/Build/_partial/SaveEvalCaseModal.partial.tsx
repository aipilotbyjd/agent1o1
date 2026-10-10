import { useState } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useAgentEvalSuites, useSaveChatAsEvalCase } from '@/api/modules/agents';
import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';

const NEW_SUITE = '__new__';

const fieldClass =
	'w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none focus:border-primary-500/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200';

export type TEvalCaseDraft = {
	/** The user message the reply answered — replayed as the case input. */
	input: string;
	/** The reply being saved, shown for reference while writing the expectation. */
	reply: string;
};

/**
 * Turns one chat exchange into an eval case, usually a reply that went wrong,
 * so the suite catches it if it ever happens again. The expectation is an
 * AI-judge rubric describing what a good reply does.
 */
const SaveEvalCaseModal = ({
	ws,
	agentId,
	draft,
	onClose,
}: {
	ws: string;
	agentId: string;
	/** `null` closes the modal. */
	draft: TEvalCaseDraft | null;
	onClose: () => void;
}) => {
	const { data: suites } = useAgentEvalSuites(ws, draft ? agentId : '');
	const save = useSaveChatAsEvalCase(ws, agentId);
	const [suiteId, setSuiteId] = useState(NEW_SUITE);
	const [name, setName] = useState('');
	const [expectation, setExpectation] = useState('');

	const [syncedDraft, setSyncedDraft] = useState<typeof draft | undefined>(undefined);
	if (syncedDraft !== draft) {
		setSyncedDraft(draft);
		if (draft) {
			setName(draft.input.slice(0, 60));
			setExpectation('');
		}
	}

	const [syncedSuites, setSyncedSuites] = useState<typeof suites | null>(null);
	if (syncedSuites !== suites) {
		setSyncedSuites(suites);
		if (suiteId === NEW_SUITE && suites?.length) setSuiteId(String(suites[0].id));
	}

	const canSave = !!draft && !!name.trim() && !!expectation.trim() && !save.isPending;

	const submit = () => {
		if (!draft || !canSave) return;
		save.mutate(
			{
				suite: suiteId === NEW_SUITE ? { name: 'From chats' } : { id: suiteId },
				body: {
					name: name.trim(),
					input: draft.input,
					assertions: [{ type: 'llm_rubric', value: expectation.trim() }],
				},
			},
			{
				onSuccess: () => {
					notify.success('Saved as an eval case.');
					onClose();
				},
			},
		);
	};

	return (
		<Modal isOpen={!!draft} setIsOpen={(open) => !open && onClose()} size='md'>
			<ModalHeader setIsOpen={() => onClose()}>
				<div className='flex items-center gap-3'>
					<div className='bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-9 w-9 items-center justify-center rounded-xl'>
						<FlaskConical size={18} />
					</div>
					<div className='flex min-w-0 flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Save as eval case
						</span>
						<span className='mt-1 text-xs font-semibold text-zinc-400'>
							Re-test this message whenever the agent changes.
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-3 pt-1 pb-2'>
					<label className='block space-y-1'>
						<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
							Suite
						</span>
						<select
							value={suiteId}
							onChange={(e) => setSuiteId(e.target.value)}
							className={fieldClass}>
							{(suites ?? []).map((suite) => (
								<option key={suite.id} value={String(suite.id)}>
									{suite.name}
								</option>
							))}
							<option value={NEW_SUITE}>New suite: From chats</option>
						</select>
					</label>

					<label className='block space-y-1'>
						<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
							Case name
						</span>
						<input
							type='text'
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={fieldClass}
						/>
					</label>

					<div className='space-y-1'>
						<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
							Message sent
						</span>
						<p className='no-scrollbar max-h-24 overflow-y-auto rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs whitespace-pre-wrap text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
							{draft?.input}
						</p>
					</div>

					<div className='space-y-1'>
						<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
							What the agent replied
						</span>
						<p className='no-scrollbar max-h-24 overflow-y-auto rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs whitespace-pre-wrap text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'>
							{draft?.reply}
						</p>
					</div>

					<label className='block space-y-1'>
						<span className='text-[10px] font-black tracking-wide text-zinc-400 uppercase'>
							A good reply…
						</span>
						<textarea
							value={expectation}
							onChange={(e) => setExpectation(e.target.value)}
							rows={3}
							placeholder='e.g. Looks the order up with the tool before answering, and gives the delivery date.'
							className={`${fieldClass} resize-none`}
						/>
						<span className='block text-[10px] font-semibold text-zinc-400'>
							An AI judge checks every future reply against this. Add exact checks,
							like which tool to call, from the Evals panel.
						</span>
					</label>

					<div className='flex justify-end gap-2 pt-1'>
						<button
							type='button'
							onClick={onClose}
							className='rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'>
							Cancel
						</button>
						<button
							type='button'
							onClick={submit}
							disabled={!canSave}
							className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black disabled:opacity-50'>
							{save.isPending && <Loader2 size={12} className='animate-spin' />}
							Save case
						</button>
					</div>
				</div>
			</ModalBody>
		</Modal>
	);
};

export default SaveEvalCaseModal;
