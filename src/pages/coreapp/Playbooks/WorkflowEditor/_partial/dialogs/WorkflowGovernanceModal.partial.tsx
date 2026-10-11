import { useState } from 'react';
import {
	Share2,
	FileSignature,
	Trash2,
	Copy,
	Check,
	Plus,
	Lock,
	Unlock,
	FormInput,
	Zap,
} from 'lucide-react';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useWorkflowRouteParams } from '../../_hooks/useWorkflowRouteParams.hook';
import { useConfirm } from '@/context/confirm';
import { notify } from '@/api/core';
import Modal from './Modal.partial';
import WorkflowApprovalsTab from './WorkflowApprovalsTab.partial';
import WorkflowInterfaceTab from './WorkflowInterfaceTab.partial';
import WorkflowTriggersTab from './WorkflowTriggersTab.partial';
import {
	useWorkflowShares,
	useCreateWorkflowShare,
	useDeleteWorkflowShare,
} from '@/api/modules/workflows';

const WorkflowGovernanceModal = () => {
	const isGovModalOpen = useWorkflowShellStore((store) => store.isGovModalOpen);
	const govModalTab = useWorkflowShellStore((store) => store.govModalTab);
	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setGovModalTab = useWorkflowShellStore((store) => store.setGovModalTab);

	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const { confirm } = useConfirm();

	// Tab selection
	const activeTab = govModalTab || 'sharing';

	// ── 2. Sharing Tab Data & Mutations ───────────────────
	const { data: shares, isLoading: isSharesLoading } = useWorkflowShares(workspaceId, workflowId);
	const createShare = useCreateWorkflowShare(workspaceId, workflowId);
	const deleteShare = useDeleteWorkflowShare(workspaceId, workflowId);

	const [isPublic, setIsPublic] = useState(true);
	const [allowClone, setAllowClone] = useState(true);
	const [sharePassword, setSharePassword] = useState('');
	const [shareExpiresAt, setShareExpiresAt] = useState('');
	const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

	if (!isGovModalOpen) return null;

	const handleClose = () => {
		setGovModalOpen(false);
	};

	const copyLink = (shareId: string, url: string) => {
		navigator.clipboard.writeText(url);
		setCopiedShareId(shareId);
		setTimeout(() => setCopiedShareId(null), 2000);
	};

	const handleCreateShareSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createShare.mutate(
			{
				is_public: isPublic,
				allow_clone: allowClone,
				password: sharePassword || undefined,
				expires_at: shareExpiresAt || undefined,
			},
			{
				onSuccess: () => {
					setSharePassword('');
					setShareExpiresAt('');
				},
			},
		);
	};

	const tabs = [
		{ id: 'sharing', label: 'Sharing', icon: Share2 },
		{ id: 'approvals', label: 'Approvals', icon: FileSignature },
		{ id: 'interface', label: 'Run Form', icon: FormInput },
		{ id: 'triggers', label: 'Triggers', icon: Zap },
	];

	return (
		<Modal title='Workflow Governance & Management' onClose={handleClose} size='xl'>
			<div className='-m-5 flex h-[580px] overflow-hidden'>
				{/* Left Sidebar Navigation */}
				<aside className='w-56 shrink-0 border-r border-zinc-200 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-zinc-950/20'>
					<nav className='space-y-1'>
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type='button'
									onClick={() => setGovModalTab(tab.id)}
									className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
										isActive
											? 'bg-primary-400 text-primary-950 dark:bg-primary-700'
											: 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200'
									}`}>
									<Icon
										size={14}
										className={
											isActive
												? 'text-white'
												: 'text-zinc-400 dark:text-zinc-500'
										}
									/>
									<span>{tab.label}</span>
								</button>
							);
						})}
					</nav>
				</aside>

				{/* Right Content Panel */}
				<main className='flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-950'>
					{/* ─── SHARING TAB ─── */}
					{activeTab === 'sharing' && (
						<div className='space-y-6'>
							<div>
								<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
									Shareable Links
								</h3>
								<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
									Generate and manage public read-only copies or cloneable
									templates of this workflow.
								</p>
							</div>

							{/* Creation Form */}
							<form
								onSubmit={handleCreateShareSubmit}
								className='dark:border-zinc-850 space-y-4 rounded-xl border border-zinc-200 p-4 dark:bg-zinc-900/10'>
								<h4 className='text-xs font-bold tracking-wider text-zinc-700 uppercase dark:text-zinc-300'>
									Generate New Share Link
								</h4>
								<div className='grid gap-4 sm:grid-cols-2'>
									<label className='flex cursor-pointer items-center gap-3'>
										<input
											type='checkbox'
											checked={isPublic}
											onChange={(e) => setIsPublic(e.target.checked)}
											className='text-primary-600 focus:ring-primary-500 rounded border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800'
										/>
										<div>
											<span className='text-zinc-850 block text-xs font-bold dark:text-zinc-200'>
												Public Link
											</span>
											<span className='block text-[10px] text-zinc-500'>
												Anyone with link can view read-only workflow.
											</span>
										</div>
									</label>

									<label className='flex cursor-pointer items-center gap-3'>
										<input
											type='checkbox'
											checked={allowClone}
											onChange={(e) => setAllowClone(e.target.checked)}
											className='text-primary-600 focus:ring-primary-500 rounded border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800'
										/>
										<div>
											<span className='text-zinc-850 block text-xs font-bold dark:text-zinc-200'>
												Allow Cloning
											</span>
											<span className='block text-[10px] text-zinc-500'>
												Users can duplicate this flow to their workspaces.
											</span>
										</div>
									</label>

									<div className='space-y-1'>
										<label
											htmlFor='workflowgovernancemodal-password-access-optional'
											className='block text-[10px] font-bold text-zinc-500 uppercase dark:text-zinc-400'>
											Password Access (Optional)
										</label>
										<div className='relative'>
											<input
												id='workflowgovernancemodal-password-access-optional'
												aria-label='Create password protection'
												type='password'
												placeholder='Create password protection'
												value={sharePassword}
												onChange={(e) => setSharePassword(e.target.value)}
												className='focus:border-primary-400 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-1.5 pr-8 pl-3 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100'
											/>
											<div className='absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400'>
												{sharePassword ? (
													<Lock size={12} />
												) : (
													<Unlock size={12} />
												)}
											</div>
										</div>
									</div>

									<div className='space-y-1'>
										<label
											htmlFor='workflowgovernancemodal-expiration-date-optional'
											className='block text-[10px] font-bold text-zinc-500 uppercase dark:text-zinc-400'>
											Expiration Date (Optional)
										</label>
										<input
											id='workflowgovernancemodal-expiration-date-optional'
											type='date'
											value={shareExpiresAt}
											onChange={(e) => setShareExpiresAt(e.target.value)}
											className='focus:border-primary-400 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100'
										/>
									</div>
								</div>

								<div className='flex justify-end pt-1'>
									<button
										type='submit'
										disabled={createShare.isPending}
										className='bg-primary-400 text-primary-950 hover:bg-primary-500 flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition disabled:opacity-50'>
										<Plus size={13} />
										Generate Link
									</button>
								</div>
							</form>

							{/* Active Links List */}
							<div className='space-y-3'>
								<h4 className='text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
									Active Share Links
								</h4>

								{isSharesLoading ? (
									<div className='py-6 text-center text-xs text-zinc-400'>
										Loading share list...
									</div>
								) : !shares || shares.length === 0 ? (
									<div className='rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800'>
										No active share links. Generate one above to share.
									</div>
								) : (
									<div className='space-y-2.5'>
										{shares.map((share) => (
											<div
												key={share.id}
												className='border-zinc-150 dark:border-zinc-850 flex flex-col gap-2 rounded-xl border bg-zinc-50/30 p-3.5 dark:bg-zinc-900/20'>
												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2'>
														<span className='bg-primary-50 border-primary-100 text-primary-700 py-0.2 dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400 rounded-full border px-1.5 text-[8px] font-bold tracking-wider uppercase'>
															{share.is_public
																? 'Public'
																: 'Restricted'}
														</span>
														<span className='text-zinc-650 py-0.2 rounded-full border border-zinc-200 bg-zinc-100 px-1.5 text-[8px] font-bold tracking-wider uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'>
															{share.allow_clone
																? 'Cloneable'
																: 'View Only'}
														</span>
														{share.has_password && (
															<span className='py-0.2 flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 text-[8px] font-bold text-amber-700 uppercase dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400'>
																<Lock size={8} /> Password
															</span>
														)}
													</div>

													<button
														type='button'
														onClick={async () => {
															const confirmed = await confirm({
																title: 'Delete Share Link',
																message:
																	'Are you sure you want to delete this share link? Anyone using it will lose access. This action cannot be undone.',
															});
															if (!confirmed) return;
															deleteShare.mutate(share.id, {
																onSuccess: () =>
																	notify.success(
																		'Share link revoked.',
																	),
															});
														}}
														disabled={deleteShare.isPending}
														className='text-zinc-400 transition hover:text-rose-500 dark:hover:text-rose-400'
														title='Delete Share Link'>
														<Trash2 size={13} />
													</button>
												</div>

												<div className='flex items-center gap-2'>
													<input
														type='text'
														readOnly
														aria-label='Share link'
														value={share.share_url}
														className='flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none select-all dark:border-zinc-800 dark:bg-zinc-950'
													/>
													<button
														aria-label='Copy'
														type='button'
														onClick={() =>
															copyLink(share.id, share.share_url)
														}
														className='flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'>
														{copiedShareId === share.id ? (
															<Check
																size={12}
																className='text-emerald-500'
															/>
														) : (
															<Copy size={12} />
														)}
													</button>
												</div>

												<div className='flex items-center gap-3 text-[10px] font-medium text-zinc-400'>
													<span>Views: {share.view_count}</span>
													<span className='text-zinc-300 dark:text-zinc-700'>
														•
													</span>
													<span>Clones: {share.clone_count}</span>
													<span className='text-zinc-300 dark:text-zinc-700'>
														•
													</span>
													<span>
														Expires:{' '}
														{share.expires_at
															? new Date(
																	share.expires_at,
																).toLocaleDateString()
															: 'Never'}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					)}

					{/* ─── APPROVALS TAB ─── */}
					{activeTab === 'approvals' && (
						<WorkflowApprovalsTab workspaceId={workspaceId} workflowId={workflowId} />
					)}

					{/* ─── RUN FORM TAB ─── */}
					{activeTab === 'interface' && (
						<WorkflowInterfaceTab workspaceId={workspaceId} workflowId={workflowId} />
					)}

					{/* ─── TRIGGERS TAB ─── */}
					{activeTab === 'triggers' && (
						<WorkflowTriggersTab workspaceId={workspaceId} workflowId={workflowId} />
					)}
				</main>
			</div>
		</Modal>
	);
};

export default WorkflowGovernanceModal;
