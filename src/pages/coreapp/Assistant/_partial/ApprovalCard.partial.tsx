import { ShieldAlert } from 'lucide-react';
import { useBrand } from '@/context/brand';
import type { TAssistantAction } from '@/types/assistant.type';

interface IApprovalCardProps {
	actions: TAssistantAction[];
	onDecide: (toolCallId: string, approve: boolean) => void;
	isDeciding?: boolean;
}

/** Calls the assistant is waiting on before it goes ahead. */
const ApprovalCardPartial = ({ actions, onDecide, isDeciding = false }: IApprovalCardProps) => {
	const brand = useBrand();
	const pending = actions.filter((action) => action.status === 'pending');

	if (pending.length === 0) return null;

	return (
		<div className='flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/5'>
			<p className='flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200'>
				<ShieldAlert className='h-4 w-4' />
				{brand.name} needs your OK before going ahead
			</p>
			{pending.map((action) => (
				<div key={action.id} className='rounded-xl bg-white p-3 dark:bg-black/20'>
					<p className='text-sm font-medium text-zinc-900 dark:text-white'>
						{action.reason ?? action.tool}
					</p>
					<pre className='mt-2 max-h-40 overflow-auto rounded-lg bg-zinc-100 p-2 text-[11px] text-zinc-700 dark:bg-white/5 dark:text-zinc-300'>
						{JSON.stringify(action.arguments, null, 2)}
					</pre>
					<div className='mt-3 flex gap-2'>
						<button
							type='button'
							disabled={isDeciding}
							onClick={() => onDecide(action.tool_call_id, true)}
							className='bg-assistant rounded-lg px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50'>
							Approve
						</button>
						<button
							type='button'
							disabled={isDeciding}
							onClick={() => onDecide(action.tool_call_id, false)}
							className='rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 disabled:opacity-50 dark:border-white/20 dark:text-zinc-200'>
							Decline
						</button>
					</div>
				</div>
			))}
		</div>
	);
};

export default ApprovalCardPartial;
