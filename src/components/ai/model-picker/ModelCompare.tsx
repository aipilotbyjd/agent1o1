import type { ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import ProviderLogo from '../ProviderLogo';
import {
	brandLabel,
	costTierLabel,
	formatContext,
	speedLabels,
	unavailableText,
} from './modelPicker.helper';

interface IModelCompareProps {
	models: TModelCatalogEntry[];
	onSelect: (model: TModelCatalogEntry) => void;
	onClose: () => void;
}

const yesNo = (value: boolean | undefined) =>
	value ? (
		<Check size={14} className='text-emerald-600' />
	) : (
		<Minus size={14} className='text-zinc-300' />
	);

const rows: { label: string; value: (m: TModelCatalogEntry) => ReactNode }[] = [
	{ label: 'Best for', value: (m) => m.strengths.join(', ') || '-' },
	{ label: 'Context', value: (m) => formatContext(m.capabilities?.context_window) ?? '-' },
	{ label: 'Tools', value: (m) => yesNo(m.capabilities?.tool_use) },
	{ label: 'Vision', value: (m) => yesNo(m.capabilities?.vision) },
	{ label: 'Speed', value: (m) => (m.speed ? speedLabels[m.speed] : '-') },
	{ label: 'Cost tier', value: (m) => costTierLabel(m.cost_tier) ?? '-' },
	{
		label: 'Per message',
		value: (m) => (m.credits_per_message !== null ? `≈ ${m.credits_per_message} credits` : '-'),
	},
	{
		label: 'Runs on',
		value: (m) =>
			m.own_key
				? `Your ${m.own_key.label} key`
				: m.is_available
					? 'Our key'
					: unavailableText(m),
	},
];

const ModelCompare = ({ models, onSelect, onClose }: IModelCompareProps) => (
	<Modal isOpen setIsOpen={(open) => !open && onClose()} size='xl'>
		<ModalHeader setIsOpen={onClose}>
			<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
				Compare models
			</span>
		</ModalHeader>
		<ModalBody>
			<div className='overflow-x-auto'>
				<table className='w-full min-w-[480px] text-left text-xs'>
					<thead>
						<tr>
							<th className='w-28'>
								<span className='sr-only'>Detail</span>
							</th>
							{models.map((m) => (
								<th key={m.id} className='px-3 pb-3 align-top'>
									<div className='flex items-center gap-2'>
										<ProviderLogo
											provider={m.brand}
											label={brandLabel(m.brand)}
											size='sm'
										/>
										<div>
											<p className='text-sm font-black text-zinc-900 dark:text-white'>
												{m.display_name}
											</p>
											<p className='text-[10px] font-semibold text-zinc-400'>
												{brandLabel(m.brand)}
											</p>
										</div>
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody className='divide-y divide-zinc-100 dark:divide-zinc-800'>
						{rows.map((row) => (
							<tr key={row.label}>
								<th
									scope='row'
									className='py-2.5 pe-3 text-[10px] font-black tracking-wider text-zinc-400 uppercase'>
									{row.label}
								</th>
								{models.map((m) => (
									<td
										key={m.id}
										className='px-3 py-2.5 font-semibold text-zinc-700 dark:text-zinc-200'>
										{row.value(m)}
									</td>
								))}
							</tr>
						))}
						<tr>
							<td>
								<span className='sr-only'>Choose</span>
							</td>
							{models.map((m) => (
								<td key={m.id} className='px-3 pt-3'>
									<button
										type='button'
										disabled={!m.is_available}
										onClick={() => onSelect(m)}
										className='rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900'>
										Use this model
									</button>
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		</ModalBody>
	</Modal>
);

export default ModelCompare;
