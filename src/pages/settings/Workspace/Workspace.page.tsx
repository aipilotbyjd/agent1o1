import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
	Building2,
	Calendar,
	ChevronDown,
	Globe,
	Link2,
	ShieldCheck,
	Trash2,
} from 'lucide-react';
import { useWorkspaceContext } from '@/context/workspaceContext';
import { useConfirm } from '@/context/confirmContext';
import { useUpdateWorkspace, useDeleteWorkspace } from '@/api/modules/workspaces';
import { primaryBtn, secondaryBtn, dangerBtn } from '@/pages/settings/_shared/buttons';

const inputClass =
	'h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-xs outline-none placeholder:text-zinc-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-primary-500 dark:focus:ring-primary-500/20';

const readOnlyClass =
	'h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center text-sm font-semibold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-500';

const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const getInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return 'W';
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
};

const formatDate = (value?: string | null) => {
	if (!value) return 'Not available';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Not available';
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date);
};

const formatRole = (role?: string | null) => {
	if (!role) return 'Member';
	return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
};

const SettingsFieldRow = ({
	icon: FieldIcon,
	title,
	description,
	children,
}: {
	icon: ComponentType<{ size?: number; className?: string }>;
	title: string;
	description: string;
	children: ReactNode;
}) => (
	<div className='grid gap-4 border-b border-zinc-100/80 py-5 lg:grid-cols-[260px_1fr] lg:items-center dark:border-zinc-800/80'>
		<div className='flex items-start gap-4'>
			<div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-500 dark:bg-primary-950/30 dark:text-primary-400'>
				<FieldIcon size={16} />
			</div>
			<div>
				<div className='text-sm font-bold text-zinc-950 dark:text-zinc-50'>{title}</div>
				<div className='mt-0.5 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
					{description}
				</div>
			</div>
		</div>
		<div className='flex w-full min-w-0 items-center justify-start'>{children}</div>
	</div>
);

const WorkspacePage = () => {
	const navigate = useNavigate();
	const { confirm } = useConfirm();
	const { activeWorkspaceId, activeWorkspace, role } = useWorkspaceContext();

	const updateWorkspace = useUpdateWorkspace();
	const deleteWorkspace = useDeleteWorkspace();

	const [workspaceName, setWorkspaceName] = useState('');
	const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
	const [isDangerZoneOpen, setIsDangerZoneOpen] = useState(false);

	useEffect(() => {
		if (activeWorkspace) {
			setWorkspaceName(activeWorkspace.name);
			setTimezone(activeWorkspace.settings?.timezone ?? DEFAULT_TIMEZONE);
		}
	}, [activeWorkspace]);

	const isDirty = useMemo(() => {
		if (!activeWorkspace) return false;
		return (
			workspaceName.trim() !== activeWorkspace.name ||
			timezone !== (activeWorkspace.settings?.timezone ?? DEFAULT_TIMEZONE)
		);
	}, [activeWorkspace, workspaceName, timezone]);

	const displayName = workspaceName || activeWorkspace?.name || 'Workspace';
	const createdAt = formatDate(activeWorkspace?.created_at);
	const workspaceRole = formatRole(role);
	const isOwner = role === 'owner';

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!workspaceName.trim() || !activeWorkspaceId) return;

		try {
			await updateWorkspace.mutateAsync({
				id: activeWorkspaceId,
				body: {
					name: workspaceName.trim(),
					settings: { timezone },
				},
			});
		} catch {
			// Toast notification is managed by hook
		}
	};

	const handleReset = () => {
		if (activeWorkspace) {
			setWorkspaceName(activeWorkspace.name);
			setTimezone(activeWorkspace.settings?.timezone ?? DEFAULT_TIMEZONE);
		}
	};

	const handleDeleteWorkspace = async () => {
		if (!activeWorkspaceId || !activeWorkspace) return;
		const confirmed = await confirm({
			title: 'Delete Workspace',
			confirmText: 'Delete Workspace',
			message: (
				<>
					Are you sure you want to permanently delete workspace{' '}
					<strong className='font-semibold text-zinc-800 dark:text-zinc-200'>
						"{activeWorkspace.name}"
					</strong>
					? This action cannot be undone.
				</>
			),
		});
		if (!confirmed) return;

		try {
			await deleteWorkspace.mutateAsync(activeWorkspaceId);
			navigate('/workspaces');
		} catch {
			// Toast notification is managed by hook
		}
	};

	return (
		<div className='mx-auto w-full max-w-[1180px] px-6 py-8 sm:px-10 lg:px-14'>
			<div className='mb-6 flex items-start justify-between'>
				<div>
					<h1 className='text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
						Workspace
					</h1>
					<p className='mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
						Manage your workspace configuration and preferences
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit}>
				{/* Workspace Identity Card */}
				<div className='dark:border-zinc-800 mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
					<div className='flex flex-wrap items-center gap-5'>
						<div className='flex h-20 w-20 items-center justify-center rounded-[22px] bg-primary-100 text-3xl font-black text-primary-600 dark:bg-primary-400/15 dark:text-primary-300'>
							{getInitials(displayName)}
						</div>
						<div>
							<h2 className='flex items-center gap-2 text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50'>
								<span>{displayName}</span>
								<span className='rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400'>
									{workspaceRole}
								</span>
							</h2>
							<div className='mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								<Calendar size={13.5} />
								<span>Created on {createdAt}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Fields Card */}
				<div className='dark:border-zinc-800 rounded-2xl border border-zinc-100 bg-white px-6 py-2 shadow-sm dark:bg-zinc-950'>
					{/* Workspace Name */}
					<SettingsFieldRow
						icon={Building2}
						title='Workspace Name'
						description='Visible to members inside this environment.'>
						<div className='w-full'>
							<input
								className={inputClass}
								value={workspaceName}
								onChange={(e) => setWorkspaceName(e.target.value)}
								placeholder='Workspace name'
								aria-label='Workspace name'
							/>
						</div>
					</SettingsFieldRow>

					{/* Workspace URL / Slug */}
					<SettingsFieldRow
						icon={Link2}
						title='Workspace URL / Slug'
						description='Unique identifier for the workspace path.'>
						<div className={readOnlyClass}>
							{activeWorkspace?.slug || 'Not available'}
						</div>
					</SettingsFieldRow>

					{/* Access Role */}
					<SettingsFieldRow
						icon={ShieldCheck}
						title='Your Access Role'
						description='Your permissions within this workspace.'>
						<div className={`${readOnlyClass} capitalize`}>{role || 'member'}</div>
					</SettingsFieldRow>

					{/* Timezone */}
					<SettingsFieldRow
						icon={Globe}
						title='Workspace Timezone'
						description='Timezone for scheduling cron events and executions.'>
						<div className='relative w-full'>
							<select
								aria-label='Timezone'
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								className={`${inputClass} appearance-none pr-11`}>
								<option value='Asia/Kolkata'>Asia/Kolkata</option>
								<option value='America/New_York'>America/New_York</option>
								<option value='Europe/London'>Europe/London</option>
								<option value='UTC'>UTC</option>
							</select>
							<ChevronDown
								size={18}
								className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-zinc-400'
							/>
						</div>
					</SettingsFieldRow>
				</div>

				{/* Save / Reset Actions */}
				<div className='mt-5 flex items-center justify-end gap-3'>
					<button
						type='button'
						disabled={!isDirty || updateWorkspace.isPending}
						onClick={handleReset}
						className={secondaryBtn}>
						Reset
					</button>
					<button
						type='submit'
						disabled={!isDirty || updateWorkspace.isPending}
						className={primaryBtn}>
						{updateWorkspace.isPending ? 'Saving...' : 'Save changes'}
					</button>
				</div>
			</form>

			{/* Collapsible Danger Zone */}
			{isOwner && (
				<div className='dark:border-zinc-800 mt-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:bg-zinc-950'>
					<button
						type='button'
						onClick={() => setIsDangerZoneOpen(!isDangerZoneOpen)}
						className='flex w-full items-center justify-between text-left'>
						<div>
							<h2 className='text-base font-bold text-red-500'>Danger zone</h2>
							<p className='mt-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
								Irreversible and sensitive actions.
							</p>
						</div>
						<ChevronDown
							size={20}
							className={`text-zinc-400 transition-transform duration-200 ${
								isDangerZoneOpen ? 'rotate-180' : ''
							}`}
						/>
					</button>

					{isDangerZoneOpen && (
						<div className='mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-5 dark:border-zinc-800'>
							<div className='max-w-2xl'>
								<div className='flex items-center gap-2 text-sm font-bold text-red-500'>
									<Trash2 size={16} />
									<span>Delete workspace</span>
								</div>
								<p className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
									This action cannot be undone. This will permanently delete your
									workspace and all resources, workflows, and logs inside it.
								</p>
							</div>
							<button
								type='button'
								disabled={deleteWorkspace.isPending}
								onClick={handleDeleteWorkspace}
								className={dangerBtn}>
								{deleteWorkspace.isPending ? 'Deleting...' : 'Delete workspace'}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default WorkspacePage;
