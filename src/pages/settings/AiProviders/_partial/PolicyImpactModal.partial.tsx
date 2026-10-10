import { AlertTriangle, Bot, Cpu, KeyRound, LifeBuoy } from 'lucide-react';
import type { ReactNode } from 'react';
import type { TAiKeyPolicyImpact } from '@/types/ai-provider.type';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';

interface IPolicyImpactModalProps {
	impact: TAiKeyPolicyImpact;
	isSaving: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

const MAX_LISTED = 6;

const ImpactGroup = ({
	icon,
	title,
	items,
	tone,
}: {
	icon: ReactNode;
	title: string;
	items: string[];
	tone: 'danger' | 'warn';
}) => (
	<div
		className={`rounded-xl p-4 ${tone === 'danger' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-amber-50 dark:bg-amber-950/30'}`}>
		<p
			className={`flex items-center gap-2 text-sm font-bold ${tone === 'danger' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
			{icon}
			{title}
		</p>
		{items.length > 0 && (
			<ul className='mt-2 flex flex-wrap gap-1.5'>
				{items.slice(0, MAX_LISTED).map((item) => (
					<li
						key={item}
						className='rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'>
						{item}
					</li>
				))}
				{items.length > MAX_LISTED && (
					<li className='px-1 text-[11px] font-bold text-zinc-500'>
						+{items.length - MAX_LISTED} more
					</li>
				)}
			</ul>
		)}
	</div>
);

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const PolicyImpactModal = ({ impact, isSaving, onConfirm, onCancel }: IPolicyImpactModalProps) => (
	<Modal isOpen setIsOpen={(open) => !open && onCancel()} size='md'>
		<ModalHeader setIsOpen={onCancel}>
			<div className='flex items-center gap-3'>
				<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'>
					<AlertTriangle size={18} />
				</div>
				<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
					Before you change this
				</span>
			</div>
		</ModalHeader>
		<ModalBody>
			<div className='space-y-3'>
				{impact.unavailable_models.length > 0 && (
					<ImpactGroup
						tone='danger'
						icon={<Cpu size={15} />}
						title={`${plural(impact.unavailable_models.length, 'model')} will become unavailable`}
						items={impact.unavailable_models.map((m) => m.display_name)}
					/>
				)}
				{impact.affected_agents.length > 0 && (
					<ImpactGroup
						tone='danger'
						icon={<Bot size={15} />}
						title={`${plural(impact.affected_agents.length, 'agent')} will stop answering until you change their model`}
						items={impact.affected_agents.map((a) => `${a.name} · ${a.model}`)}
					/>
				)}
				{impact.models_losing_backup.length > 0 && (
					<ImpactGroup
						tone='warn'
						icon={<LifeBuoy size={15} />}
						title={`${plural(impact.models_losing_backup.length, 'model')} will lose our key as a backup — if your key is busy or out of quota, the call fails`}
						items={impact.models_losing_backup.map((m) => m.display_name)}
					/>
				)}
				{impact.ignored_personal_keys > 0 && (
					<ImpactGroup
						tone='warn'
						icon={<KeyRound size={15} />}
						title={`${plural(impact.ignored_personal_keys, 'personal key')} will stop being used (they're kept, not deleted)`}
						items={[]}
					/>
				)}
			</div>
		</ModalBody>
		<ModalFooter>
			<ModalFooterChild className='flex w-full justify-end gap-3'>
				<Button
					variant='outline'
					color='zinc'
					onClick={onCancel}
					className='h-11 border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50'>
					Keep current policy
				</Button>
				<Button
					variant='solid'
					color='red'
					isLoading={isSaving}
					onClick={onConfirm}
					className='h-11 font-bold'>
					Apply anyway
				</Button>
			</ModalFooterChild>
		</ModalFooter>
	</Modal>
);

export default PolicyImpactModal;
