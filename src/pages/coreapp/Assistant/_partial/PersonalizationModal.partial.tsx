import { useState } from 'react';
import dayjs from 'dayjs';
import { useBrand } from '@/context/brand';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import {
	useAssistantStyles,
	useRestoreAssistantStyle,
	useUpdateAssistantStyle,
} from '@/api/modules/assistant';
import type { TAssistantStyleKind, TAssistantStyleRevision } from '@/types/assistant.type';

interface IPersonalizationModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
}

const KINDS: TAssistantStyleKind[] = ['tone', 'design'];

const KIND_LABELS: Record<TAssistantStyleKind, string> = { tone: 'Tone', design: 'Design' };

const KIND_HINTS: Record<TAssistantStyleKind, string> = {
	tone: 'Length, formality, language, emoji.',
	design: 'Bullets, tables, headings, what comes first.',
};

const KIND_PLACEHOLDERS: Record<TAssistantStyleKind, string> = {
	tone: '- Keep answers short\n- No emoji',
	design: '- Lead with a one-line summary\n- Use tables for comparisons',
};

const SOURCE_LABELS: Record<TAssistantStyleRevision['source'], string> = {
	owner: 'Edited by you',
	assistant: 'Saved from chat',
	feedback: 'Learned from feedback',
	restore: 'Restored',
};

/**
 * The owner's Tone and Design notes: edit them directly, see every change
 * (theirs, the assistant's, or learned from feedback) and restore any of them.
 */
const PersonalizationModalPartial = ({
	workspaceId,
	isOpen,
	onClose,
}: IPersonalizationModalProps) => {
	const brand = useBrand();
	const [kind, setKind] = useState<TAssistantStyleKind>('tone');
	const [draft, setDraft] = useState('');
	const { data: styles = [] } = useAssistantStyles(workspaceId, isOpen);
	const update = useUpdateAssistantStyle(workspaceId);
	const restore = useRestoreAssistantStyle(workspaceId);

	const style = styles.find((entry) => entry.kind === kind);

	const styleKey = `${style?.version ?? ''}:${style?.notes ?? ''}`;
	const [syncedStyleKey, setSyncedStyleKey] = useState<string | null>(null);
	if (syncedStyleKey !== styleKey) {
		setSyncedStyleKey(styleKey);
		setDraft(style?.notes ?? '');
	}

	const isDirty = draft.trim() !== (style?.notes ?? '').trim();

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex flex-col'>
					<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
						Personalization
					</span>
					<span className='mt-1 text-xs text-zinc-500'>
						How {brand.name} writes to you and lays out answers. It also learns from
						your feedback — every change is kept here.
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4 pt-2'>
					<div className='flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-white/5'>
						{KINDS.map((entry) => (
							<button
								key={entry}
								type='button'
								onClick={() => setKind(entry)}
								className={
									entry === kind
										? 'flex-1 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white'
										: 'flex-1 rounded-md px-3 py-1.5 text-sm text-zinc-500'
								}>
								{KIND_LABELS[entry]}
							</button>
						))}
					</div>

					<p className='text-xs text-zinc-500'>{KIND_HINTS[kind]}</p>

					<label htmlFor='assistant-style-notes' className='sr-only'>
						{KIND_LABELS[kind]}
					</label>
					<textarea
						id='assistant-style-notes'
						rows={7}
						value={draft}
						onChange={(event) => setDraft(event.target.value)}
						placeholder={KIND_PLACEHOLDERS[kind]}
						className='w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-white/5 dark:text-white'
					/>

					<div className='flex justify-end'>
						<button
							type='button'
							disabled={!isDirty || update.isPending}
							onClick={() => update.mutate({ kind, notes: draft.trim() || null })}
							className='bg-assistant rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40'>
							Save
						</button>
					</div>

					{style && style.revisions.length > 0 && (
						<section className='flex flex-col gap-2'>
							<p className='text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
								History
							</p>
							<ul className='flex max-h-56 flex-col gap-1 overflow-y-auto'>
								{style.revisions.map((revision) => (
									<li
										key={revision.id}
										className='flex items-start gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-white/5'>
										<span className='w-8 shrink-0 font-semibold text-zinc-500'>
											v{revision.version}
										</span>
										<span className='min-w-0 flex-1'>
											<span className='block text-zinc-700 dark:text-zinc-200'>
												{SOURCE_LABELS[revision.source]}
												{revision.reason ? ` — ${revision.reason}` : ''}
											</span>
											<span className='text-zinc-400'>
												{dayjs(revision.created_at).format('MMM D, HH:mm')}
											</span>
										</span>
										{revision.version !== style.version && (
											<button
												type='button'
												disabled={restore.isPending}
												onClick={() =>
													restore.mutate({
														kind,
														revisionId: revision.id,
													})
												}
												className='shrink-0 font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white'>
												Restore
											</button>
										)}
									</li>
								))}
							</ul>
						</section>
					)}
				</div>
			</ModalBody>
		</Modal>
	);
};

export default PersonalizationModalPartial;
