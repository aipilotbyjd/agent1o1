import type { ReactNode } from 'react';
import {
	AlertTriangle,
	BookOpen,
	CheckCircle2,
	Pencil,
	Plus,
	RefreshCw,
	Star,
	Trash2,
	User,
	Users,
} from 'lucide-react';
import relativeTime from '@/utils/relativeTime.util';
import type {
	TAiProvider,
	TAiProviderCredential,
	TAiProviderCredentialStatus,
} from '@/types/ai-provider.type';
import Spinner from '@/components/ui/Spinner';
import ProviderLogo from './ProviderLogo.partial';

const MAX_MODEL_CHIPS = 5;

const statusBadge: Record<
	TAiProviderCredentialStatus,
	{ label: string; className: string; icon: typeof CheckCircle2 }
> = {
	valid: {
		label: 'Working',
		className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
		icon: CheckCircle2,
	},
	invalid: {
		label: 'Rejected',
		className: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
		icon: AlertTriangle,
	},
	unvalidated: {
		label: 'Not checked yet',
		className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
		icon: RefreshCw,
	},
};

interface IProviderCardProps {
	provider: TAiProvider;
	keys: TAiProviderCredential[];
	canAdd: boolean;
	busyId: string | null;
	onAdd: () => void;
	onValidate: (credential: TAiProviderCredential) => void;
	onSetDefault: (credential: TAiProviderCredential) => void;
	onEdit: (credential: TAiProviderCredential) => void;
	onRemove: (credential: TAiProviderCredential) => void;
}

const ProviderCard = ({
	provider,
	keys,
	canAdd,
	busyId,
	onAdd,
	onValidate,
	onSetDefault,
	onEdit,
	onRemove,
}: IProviderCardProps) => {
	const extraModels = provider.models.length - MAX_MODEL_CHIPS;
	const working = keys.some((k) => k.validation_status === 'valid' && !k.ignored_by_policy);

	return (
		<section className='rounded-2xl border border-zinc-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/40'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex min-w-0 items-start gap-3'>
					<ProviderLogo provider={provider.key} label={provider.label} />
					<div className='min-w-0'>
						<div className='flex items-center gap-2'>
							<h2 className='text-base font-black text-zinc-900 dark:text-zinc-100'>
								{provider.label}
							</h2>
							<span
								className={`h-2 w-2 rounded-full ${working ? 'bg-emerald-500' : 'bg-amber-500'}`}
								title={
									working ? 'A working key is in use' : 'No working key in use'
								}
							/>
						</div>
						<div className='mt-1.5 flex flex-wrap items-center gap-1.5'>
							{provider.models.slice(0, MAX_MODEL_CHIPS).map((model) => (
								<span
									key={model}
									className='rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
									{model}
								</span>
							))}
							{extraModels > 0 && (
								<span
									title={provider.models.slice(MAX_MODEL_CHIPS).join(', ')}
									className='text-[11px] font-bold text-zinc-400 dark:text-zinc-500'>
									+{extraModels} more
								</span>
							)}
							{provider.covers_knowledge_base && (
								<span className='inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'>
									<BookOpen size={11} />
									Knowledge base
								</span>
							)}
						</div>
					</div>
				</div>
				{canAdd && (
					<button
						type='button'
						onClick={onAdd}
						className='inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'>
						<Plus size={14} />
						Add another key
					</button>
				)}
			</div>

			<ul className='mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800'>
				{keys.map((credential) => (
					<KeyRow
						key={credential.id}
						credential={credential}
						showDefault={keys.filter((k) => k.scope === credential.scope).length > 1}
						isBusy={busyId === credential.id}
						onValidate={() => onValidate(credential)}
						onSetDefault={() => onSetDefault(credential)}
						onEdit={() => onEdit(credential)}
						onRemove={() => onRemove(credential)}
					/>
				))}
			</ul>
		</section>
	);
};

interface IKeyRowProps {
	credential: TAiProviderCredential;
	showDefault: boolean;
	isBusy: boolean;
	onValidate: () => void;
	onSetDefault: () => void;
	onEdit: () => void;
	onRemove: () => void;
}

const KeyRow = ({
	credential,
	showDefault,
	isBusy,
	onValidate,
	onSetDefault,
	onEdit,
	onRemove,
}: IKeyRowProps) => {
	const status = statusBadge[credential.validation_status];
	const ScopeIcon = credential.scope === 'personal' ? User : Users;
	const lastUsed = relativeTime(credential.last_used_at);
	const lastChecked = relativeTime(credential.last_validated_at);

	return (
		<li className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
			<div className='flex min-w-0 items-start gap-3'>
				<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
					<ScopeIcon size={15} />
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-1.5'>
						<p className='text-sm font-black text-zinc-900 dark:text-zinc-100'>
							{credential.name || `${credential.provider_label} key`}
						</p>
						<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
							{credential.scope === 'personal' ? 'Only you' : 'Team'}
						</span>
						{credential.ignored_by_policy && (
							<span className='rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
								Not used: personal keys are off
							</span>
						)}
						{showDefault && credential.is_default && (
							<span className='bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-400 rounded-full px-2 py-0.5 text-[11px] font-bold'>
								Default
							</span>
						)}
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${status.className}`}>
							<status.icon size={11} />
							{status.label}
						</span>
					</div>
					<p className='mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
						<code className='font-mono text-zinc-500 dark:text-zinc-400'>
							{credential.key_hint}
						</code>
						{' · '}
						{lastUsed ? `Last used ${lastUsed}` : 'Not used yet'}
						{lastChecked && ` · Checked ${lastChecked}`}
					</p>
					{credential.validation_status !== 'valid' && credential.validation_message && (
						<p className='mt-1 text-xs font-medium text-red-600 dark:text-red-400'>
							{credential.validation_message}
						</p>
					)}
				</div>
			</div>

			{credential.can_manage && (
				<div className='flex shrink-0 items-center gap-1 pl-11 sm:pl-0'>
					{isBusy ? (
						<Spinner color='primary' className='mx-2 size-4' />
					) : (
						<>
							<IconButton label='Check key now' onClick={onValidate}>
								<RefreshCw size={15} />
							</IconButton>
							{showDefault && !credential.is_default && (
								<IconButton label='Make default' onClick={onSetDefault}>
									<Star size={15} />
								</IconButton>
							)}
						</>
					)}
					<IconButton label='Edit key' onClick={onEdit}>
						<Pencil size={15} />
					</IconButton>
					<IconButton label='Remove key' onClick={onRemove} danger>
						<Trash2 size={15} />
					</IconButton>
				</div>
			)}
		</li>
	);
};

const IconButton = ({
	label,
	onClick,
	danger,
	children,
}: {
	label: string;
	onClick: () => void;
	danger?: boolean;
	children: ReactNode;
}) => (
	<button
		type='button'
		aria-label={label}
		title={label}
		onClick={onClick}
		className={`rounded-lg p-2 text-zinc-400 transition ${
			danger
				? 'hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
				: 'hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
		}`}>
		{children}
	</button>
);

export default ProviderCard;
