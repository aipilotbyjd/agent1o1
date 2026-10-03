import { useBrand } from '@/context/brand';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { useAssistantToolRules, useUpdateAssistantToolRules } from '@/api/modules/assistant';
import type {
	TAssistantToolDescription,
	TAssistantToolEffect,
	TAssistantToolRule,
} from '@/types/assistant.type';

interface IPermissionsModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
}

const RULES: TAssistantToolRule[] = ['allow', 'ask', 'deny'];

const RULE_LABELS: Record<TAssistantToolRule, string> = {
	allow: 'Allow',
	ask: 'Ask',
	deny: 'Never',
};

/** "Group" a tool by its name's prefix — `gmail_send_email` → `gmail`. */
const groupOf = (tool: TAssistantToolDescription) =>
	tool.name.includes('_') ? tool.name.split('_')[0] : 'general';

const labelOf = (name: string) => name.replace(/_/g, ' ');

/**
 * Per tool: run without asking, ask first, or never. Destructive tools always
 * ask, so "allow" is not offered for them.
 */
const PermissionsModalPartial = ({ workspaceId, isOpen, onClose }: IPermissionsModalProps) => {
	const brand = useBrand();
	const effectLabels: Record<TAssistantToolEffect, string> = {
		read: 'Reads data',
		internal: `Changes only ${brand.name}'s own notes`,
		write: 'Creates or changes data',
		external: 'Sends or shares with others',
		destructive: 'Deletes data — always asks',
	};
	const { data: tools = [] } = useAssistantToolRules(workspaceId, isOpen);
	const update = useUpdateAssistantToolRules(workspaceId);

	const groups = tools.reduce<Record<string, TAssistantToolDescription[]>>((all, tool) => {
		(all[groupOf(tool)] ??= []).push(tool);
		return all;
	}, {});

	const setRule = (tool: TAssistantToolDescription, rule: TAssistantToolRule) => {
		update.mutate([{ tool: tool.name, rule: rule === tool.default_rule ? null : rule }]);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={(open) => !open && onClose()} size='lg'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex flex-col'>
					<span className='text-lg font-semibold text-zinc-950 dark:text-white'>
						Permissions
					</span>
					<span className='mt-1 text-xs text-zinc-500'>
						Choose what {brand.name} may do on its own, what it should ask about first,
						and what it should never do.
					</span>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='flex max-h-[60vh] flex-col gap-5 overflow-y-auto pt-2'>
					{Object.entries(groups).map(([group, groupTools]) => (
						<section key={group} className='flex flex-col gap-1'>
							<p className='text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
								{group}
							</p>
							{groupTools.map((tool) => {
								const current = tool.rule ?? tool.default_rule;
								return (
									<div
										key={tool.name}
										className='flex items-center justify-between gap-3 py-1.5'>
										<div className='min-w-0'>
											<p className='truncate text-sm text-zinc-800 dark:text-zinc-100'>
												{labelOf(tool.name)}
											</p>
											<p className='text-[11px] text-zinc-500'>
												{effectLabels[tool.effect]}
											</p>
										</div>
										<div className='flex shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10'>
											{RULES.filter(
												(rule) => rule !== 'allow' || tool.can_auto_allow,
											).map((rule) => (
												<button
													key={rule}
													type='button'
													disabled={update.isPending}
													onClick={() => setRule(tool, rule)}
													className={
														current === rule
															? 'bg-assistant px-2.5 py-1 text-xs font-semibold text-white'
															: 'px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5'
													}>
													{RULE_LABELS[rule]}
												</button>
											))}
										</div>
									</div>
								);
							})}
						</section>
					))}
				</div>
			</ModalBody>
		</Modal>
	);
};

export default PermissionsModalPartial;
