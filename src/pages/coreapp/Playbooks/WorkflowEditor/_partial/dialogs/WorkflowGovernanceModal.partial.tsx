import { useState } from 'react';
import {
	History,
	Share2,
	FileSignature,
	Disc,
	ShieldCheck,
	Trash2,
	Copy,
	Check,
	Play,
	Plus,
	AlertCircle,
	Lock,
	Unlock,
	Send,
	Clock,
	CheckCircle2,
	XCircle,
	Loader2
} from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { useWorkflowShellStore } from '@/store/workflowShell.store';
import { useWorkflowRouteParams } from '../../_hooks/useWorkflowRouteParams.hook';
import { useConfirm } from '@/context/confirm';
import Modal from './Modal.partial';
import {
	useWorkflowVersions,
	usePublishWorkflowVersion,
	useRollbackWorkflowVersion,
	useWorkflowShares,
	useCreateWorkflowShare,
	useDeleteWorkflowShare,
	useWorkflowApprovals,
	useRequestApproval,
	useApproveRequest,
	useRejectRequest,
	useWorkflowReleases,
	useDeployRelease,
	useWorkflowContracts,
	useGenerateContract,
	useRunContractTest,
} from '@/api/modules/workflows';

const WorkflowGovernanceModal = () => {
	const { state } = useWorkflowEditor();
	const isGovModalOpen = useWorkflowShellStore((store) => store.isGovModalOpen);
	const govModalTab = useWorkflowShellStore((store) => store.govModalTab);
	const setGovModalOpen = useWorkflowShellStore((store) => store.setGovModalOpen);
	const setGovModalTab = useWorkflowShellStore((store) => store.setGovModalTab);

	const { workspaceId, workflowId } = useWorkflowRouteParams();
	const { confirm } = useConfirm();

	// Tab selection
	const activeTab = govModalTab || 'versions';

	// ── 1. Versions Tab Data & Mutations ───────────────────
	const { data: versions, isLoading: isVersionsLoading } = useWorkflowVersions(
		workspaceId,
		workflowId
	);
	const publishVersion = usePublishWorkflowVersion(workspaceId);
	const rollbackVersion = useRollbackWorkflowVersion(workspaceId);

	// ── 2. Sharing Tab Data & Mutations ───────────────────
	const { data: shares, isLoading: isSharesLoading } = useWorkflowShares(
		workspaceId,
		workflowId
	);
	const createShare = useCreateWorkflowShare(workspaceId, workflowId);
	const deleteShare = useDeleteWorkflowShare(workspaceId, workflowId);

	const [isPublic, setIsPublic] = useState(true);
	const [allowClone, setAllowClone] = useState(true);
	const [sharePassword, setSharePassword] = useState('');
	const [shareExpiresAt, setShareExpiresAt] = useState('');
	const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

	// ── 3. Approvals Tab Data & Mutations ─────────────────
	const { data: approvalsRes, isLoading: isApprovalsLoading } = useWorkflowApprovals(
		workspaceId,
		workflowId
	);
	const approvals = approvalsRes?.data || [];
	const requestApproval = useRequestApproval(workspaceId, workflowId);
	const approveRequest = useApproveRequest(workspaceId, workflowId);
	const rejectRequest = useRejectRequest(workspaceId, workflowId);

	const [approvalNotes, setApprovalNotes] = useState('');
	const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

	// ── 4. Releases Tab Data & Mutations ──────────────────
	const { data: releasesRes, isLoading: isReleasesLoading } = useWorkflowReleases(
		workspaceId,
		workflowId
	);
	const releases = releasesRes?.data || [];
	const deployRelease = useDeployRelease(workspaceId, workflowId);

	const [releaseVersion, setReleaseVersion] = useState('');
	const [releaseEnv, setReleaseEnv] = useState('production');
	const [releaseNotes, setReleaseNotes] = useState('');

	// ── 5. Contracts Tab Data & Mutations ─────────────────
	const { data: contractsRes, isLoading: isContractsLoading } = useWorkflowContracts(
		workspaceId,
		workflowId
	);
	const contracts = contractsRes?.data || [];
	const generateContract = useGenerateContract(workspaceId, workflowId);
	const runContractTest = useRunContractTest(workspaceId, workflowId);

	const [testResults, setTestResults] = useState<Record<string, any>>({});
	const [runningTestId, setRunningTestId] = useState<string | null>(null);

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
			}
		);
	};

	const handleRequestApprovalSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		requestApproval.mutate(approvalNotes, {
			onSuccess: () => setApprovalNotes(''),
		});
	};

	const handleDeployReleaseSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!releaseVersion) return;
		deployRelease.mutate(
			{
				version_id: releaseVersion,
				environment_id: releaseEnv,
				notes: releaseNotes || undefined,
			},
			{
				onSuccess: () => {
					setReleaseVersion('');
					setReleaseNotes('');
				},
			}
		);
	};

	const handleRunVerification = (contractId: string) => {
		setRunningTestId(contractId);
		runContractTest.mutate(contractId, {
			onSuccess: (res) => {
				setTestResults((prev) => ({ ...prev, [contractId]: res }));
				setRunningTestId(null);
			},
			onError: () => {
				setRunningTestId(null);
			},
		});
	};

	const tabs = [
		{ id: 'versions', label: 'Version History', icon: History },
		{ id: 'sharing', label: 'Sharing', icon: Share2 },
		{ id: 'approvals', label: 'Approvals', icon: FileSignature },
		{ id: 'releases', label: 'Releases & Deploy', icon: Disc },
		{ id: 'contracts', label: 'Contracts & Tests', icon: ShieldCheck },
	];

	return (
		<Modal title="Workflow Governance & Management" onClose={handleClose} size="xl">
			<div className="flex h-[580px] -m-5 overflow-hidden">
				{/* Left Sidebar Navigation */}
				<aside className="w-56 border-r border-zinc-200 bg-zinc-50/50 p-4 dark:border-white/10 dark:bg-zinc-950/20 shrink-0">
					<nav className="space-y-1">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setGovModalTab(tab.id)}
									className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
										isActive
											? 'bg-primary-400 text-primary-950 dark:bg-primary-700'
											: 'text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200'
									}`}
								>
									<Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'} />
									<span>{tab.label}</span>
								</button>
							);
						})}
					</nav>
				</aside>

				{/* Right Content Panel */}
				<main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">
					{/* ─── VERSION HISTORY TAB ─── */}
					{activeTab === 'versions' && (
						<div className="space-y-5">
							<div>
								<h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Version Snapshots</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Manage save points, publish production versions, or rollback to a previous state.
								</p>
							</div>

							{isVersionsLoading ? (
								<div className="flex justify-center py-12 text-xs font-semibold text-zinc-500">
									<Loader2 size={16} className="animate-spin mr-2 text-primary-600" />
									Loading version history...
								</div>
							) : !versions || versions.length === 0 ? (
								<div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
									No saved versions found. Save your current canvas to create a version snapshot.
								</div>
							) : (
								<div className="space-y-3">
									{versions.map((version) => {
										const isCurrent = version.version_number === state.workflow.currentVersionNumber;
										const isPublished = version.is_published;

										return (
											<div
												key={version.id}
												className={`flex items-start justify-between rounded-xl border p-4 transition ${
													isCurrent
														? 'border-primary-200 bg-primary-50/15 dark:border-primary-800/40 dark:bg-primary-950/10'
														: 'border-zinc-200 bg-white dark:border-zinc-800/50 dark:bg-zinc-900/10'
												}`}
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">
															v{version.version_number}
														</span>
														{isPublished && (
															<span className="rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-0.5 text-[9px] font-bold dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-400">
																Published
															</span>
														)}
														{isCurrent && (
															<span className="rounded-full bg-primary-100 border border-primary-200 text-primary-700 px-2 py-0.5 text-[9px] font-bold dark:bg-primary-950/30 dark:border-primary-900/50 dark:text-primary-400">
																Active Workspace State
															</span>
														)}
													</div>
													<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
														{version.change_summary || 'No description provided'}
													</p>
													<div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
														<Clock size={10} />
														<span>
															{version.created_at
																? new Date(version.created_at).toLocaleString()
																: 'Unknown date'}
														</span>
														{version.created_by && (
															<>
																<span className="text-zinc-300 dark:text-zinc-700">•</span>
																<span>by {version.created_by}</span>
															</>
														)}
													</div>
												</div>

												<div className="flex items-center gap-2">
													{!isPublished && (
														<button
															type="button"
															onClick={() =>
																publishVersion.mutate({
																	id: workflowId,
																	version: version.id,
																})
															}
															disabled={publishVersion.isPending}
															className="rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 px-2.5 py-1.5 text-[10px] font-bold text-zinc-600 dark:border-zinc-800 dark:hover:bg-white/[0.04] dark:text-zinc-300 transition"
														>
															Publish
														</button>
													)}
													{!isCurrent && (
														<button
															type="button"
															onClick={() =>
																rollbackVersion.mutate({
																	id: workflowId,
																	version: version.id,
																})
															}
															disabled={rollbackVersion.isPending}
															className="rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-950 px-2.5 py-1.5 text-[10px] font-bold text-zinc-650 dark:border-zinc-800 dark:hover:bg-white/[0.04] dark:text-zinc-300 transition"
														>
															Rollback
														</button>
													)}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					)}

					{/* ─── SHARING TAB ─── */}
					{activeTab === 'sharing' && (
						<div className="space-y-6">
							<div>
								<h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Shareable Links</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Generate and manage public read-only copies or cloneable templates of this workflow.
								</p>
							</div>

							{/* Creation Form */}
							<form
								onSubmit={handleCreateShareSubmit}
								className="rounded-xl border border-zinc-200 p-4 space-y-4 dark:border-zinc-850 dark:bg-zinc-900/10"
							>
								<h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
									Generate New Share Link
								</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={isPublic}
											onChange={(e) => setIsPublic(e.target.checked)}
											className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-800"
										/>
										<div>
											<span className="block text-xs font-bold text-zinc-850 dark:text-zinc-200">
												Public Link
											</span>
											<span className="block text-[10px] text-zinc-500">
												Anyone with link can view read-only workflow.
											</span>
										</div>
									</label>

									<label className="flex items-center gap-3 cursor-pointer">
										<input
											type="checkbox"
											checked={allowClone}
											onChange={(e) => setAllowClone(e.target.checked)}
											className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-700 dark:bg-zinc-800"
										/>
										<div>
											<span className="block text-xs font-bold text-zinc-850 dark:text-zinc-200">
												Allow Cloning
											</span>
											<span className="block text-[10px] text-zinc-500">
												Users can duplicate this flow to their workspaces.
											</span>
										</div>
									</label>

									<div className="space-y-1">
										<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
											Password Access (Optional)
										</label>
										<div className="relative">
											<input
												type="password"
												placeholder="Create password protection"
												value={sharePassword}
												onChange={(e) => setSharePassword(e.target.value)}
												className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 py-1.5 pl-3 pr-8 text-xs outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
											/>
											<div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
												{sharePassword ? <Lock size={12} /> : <Unlock size={12} />}
											</div>
										</div>
									</div>

									<div className="space-y-1">
										<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
											Expiration Date (Optional)
										</label>
										<input
											type="date"
											value={shareExpiresAt}
											onChange={(e) => setShareExpiresAt(e.target.value)}
											className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
										/>
									</div>
								</div>

								<div className="flex justify-end pt-1">
									<button
										type="submit"
										disabled={createShare.isPending}
										className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-xs font-bold text-primary-950 hover:bg-primary-500 disabled:opacity-50 transition"
									>
										<Plus size={13} />
										Generate Link
									</button>
								</div>
							</form>

							{/* Active Links List */}
							<div className="space-y-3">
								<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
									Active Share Links
								</h4>

								{isSharesLoading ? (
									<div className="text-center py-6 text-xs text-zinc-400">Loading share list...</div>
								) : !shares || shares.length === 0 ? (
									<div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
										No active share links. Generate one above to share.
									</div>
								) : (
									<div className="space-y-2.5">
										{shares.map((share) => (
											<div
												key={share.id}
												className="flex flex-col gap-2 rounded-xl border border-zinc-150 bg-zinc-50/30 p-3.5 dark:border-zinc-850 dark:bg-zinc-900/20"
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-2">
														<span className="rounded-full bg-primary-50 border border-primary-100 text-primary-700 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider dark:bg-primary-950/20 dark:border-primary-900/30 dark:text-primary-400">
															{share.is_public ? 'Public' : 'Restricted'}
														</span>
														<span className="rounded-full bg-zinc-100 border border-zinc-200 text-zinc-650 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400">
															{share.allow_clone ? 'Cloneable' : 'View Only'}
														</span>
														{share.has_password && (
															<span className="flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-1.5 py-0.2 text-[8px] font-bold uppercase dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
																<Lock size={8} /> Password
															</span>
														)}
													</div>

													<button
														type="button"
														onClick={async () => {
															const confirmed = await confirm({
																title: 'Delete Share Link',
																message:
																	'Are you sure you want to delete this share link? Anyone using it will lose access. This action cannot be undone.',
															});
															if (!confirmed) return;
															deleteShare.mutate(share.id);
														}}
														disabled={deleteShare.isPending}
														className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition"
														title="Delete Share Link"
													>
														<Trash2 size={13} />
													</button>
												</div>

												<div className="flex items-center gap-2">
													<input
														type="text"
														readOnly
														value={share.share_url}
														className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none select-all dark:border-zinc-800 dark:bg-zinc-950"
													/>
													<button
														type="button"
														onClick={() => copyLink(share.id, share.share_url)}
														className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 transition"
													>
														{copiedShareId === share.id ? (
															<Check size={12} className="text-emerald-500" />
														) : (
															<Copy size={12} />
														)}
													</button>
												</div>

												<div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
													<span>Views: {share.view_count}</span>
													<span className="text-zinc-300 dark:text-zinc-700">•</span>
													<span>Clones: {share.clone_count}</span>
													<span className="text-zinc-300 dark:text-zinc-700">•</span>
													<span>
														Expires:{' '}
														{share.expires_at
															? new Date(share.expires_at).toLocaleDateString()
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
						<div className="space-y-6">
							<div>
								<h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Governance Approvals</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Submit reviews for changes, require peer approval prior to live deployments, and track audits.
								</p>
							</div>

							{/* Request Approval Form */}
							<form
								onSubmit={handleRequestApprovalSubmit}
								className="rounded-xl border border-zinc-200 p-4 space-y-3 dark:border-zinc-850 dark:bg-zinc-900/10"
							>
								<h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
									Request Production Approval
								</h4>
								<div className="space-y-1.5">
									<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
										Request Notes / Audit Context
									</label>
									<textarea
										rows={2}
										placeholder="Describe changes e.g. 'Optimized prompt token usage and resolved Google Calendar trigger mapping error'"
										value={approvalNotes}
										onChange={(e) => setApprovalNotes(e.target.value)}
										className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
										required
									/>
								</div>
								<div className="flex justify-end">
									<button
										type="submit"
										disabled={requestApproval.isPending}
										className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-xs font-bold text-primary-950 hover:bg-primary-500 disabled:opacity-50 transition"
									>
										<Send size={12} />
										Submit Request
									</button>
								</div>
							</form>

							{/* Approvals Audit Log */}
							<div className="space-y-3">
								<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
									Review Audit Log
								</h4>

								{isApprovalsLoading ? (
									<div className="text-center py-6 text-xs text-zinc-400">Loading audit log...</div>
								) : approvals.length === 0 ? (
									<div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
										No approval requests created. Submit one above to begin peer reviews.
									</div>
								) : (
									<div className="space-y-3">
										{approvals.map((appr) => {
											const isPending = appr.status === 'pending';
											const isApproved = appr.status === 'approved';

											return (
												<div
													key={appr.id}
													className={`rounded-xl border p-4 space-y-3.5 ${
														isApproved
															? 'border-emerald-250 bg-emerald-50/10 dark:border-emerald-800/40 dark:bg-emerald-950/10'
															: appr.status === 'rejected'
															? 'border-rose-250 bg-rose-50/10 dark:border-rose-800/40 dark:bg-rose-950/10'
															: 'border-zinc-200 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/10'
													}`}
												>
													<div className="flex items-start justify-between">
														<div className="space-y-0.5">
															<div className="flex items-center gap-2">
																<span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
																	Requested by {appr.requested_by.name}
																</span>
																<span
																	className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
																		isApproved
																			? 'bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
																			: appr.status === 'rejected'
																			? 'bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
																			: 'bg-amber-100 border border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
																	}`}
																>
																	{appr.status.toUpperCase()}
																</span>
															</div>
															<span className="block text-[10px] text-zinc-400">
																{new Date(appr.created_at).toLocaleString()}
															</span>
														</div>
													</div>

													<div className="text-xs font-medium text-zinc-650 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
														<p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-1">
															Audit Context
														</p>
														{appr.notes || 'No description provided'}
													</div>

													{/* Pending Approval Controls */}
													{isPending && (
														<div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
															<input
																type="text"
																placeholder="Optional reviewer notes..."
																value={reviewNotes[appr.id] || ''}
																onChange={(e) =>
																	setReviewNotes((prev) => ({
																		...prev,
																		[appr.id]: e.target.value,
																	}))
																}
																className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-950"
															/>
															<div className="flex justify-end gap-2">
																<button
																	type="button"
																	onClick={() =>
																		rejectRequest.mutate({
																			approvalId: appr.id,
																			notes: reviewNotes[appr.id],
																		})
																	}
																	disabled={rejectRequest.isPending}
																	className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold transition"
																>
																	Reject
																</button>
																<button
																	type="button"
																	onClick={() =>
																		approveRequest.mutate({
																			approvalId: appr.id,
																			notes: reviewNotes[appr.id],
																		})
																	}
																	disabled={approveRequest.isPending}
																	className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold transition"
																>
																	Approve
																</button>
															</div>
														</div>
													)}

													{/* Review Results */}
													{!isPending && appr.reviewed_by && (
														<div className="text-[11px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5">
															<span className="font-bold">Reviewed by:</span>{' '}
															{appr.reviewed_by.name} on{' '}
															{appr.reviewed_at
																? new Date(appr.reviewed_at).toLocaleString()
																: 'N/A'}
															{appr.notes && (
																<p className="mt-1 italic">
																	&ldquo;{appr.notes}&rdquo;
																</p>
															)}
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					)}

					{/* ─── RELEASES TAB ─── */}
					{activeTab === 'releases' && (
						<div className="space-y-6">
							<div>
								<h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Releases & Deployments</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Deploy specific version snapshots of your workflow to selected environments.
								</p>
							</div>

							{/* Deployment Form */}
							<form
								onSubmit={handleDeployReleaseSubmit}
								className="rounded-xl border border-zinc-200 p-4 space-y-4 dark:border-zinc-850 dark:bg-zinc-900/10"
							>
								<h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
									Deploy Target Release
								</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1">
										<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
											Select Version
										</label>
										<select
											value={releaseVersion}
											onChange={(e) => setReleaseVersion(e.target.value)}
											className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs text-zinc-800 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
											required
										>
											<option value="">Choose version snapshot...</option>
											{versions?.map((v) => (
												<option key={v.id} value={v.id}>
													Version {v.version_number} {v.is_published ? '(Published)' : ''}
												</option>
											))}
										</select>
									</div>

									<div className="space-y-1">
										<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
											Target Environment
										</label>
										<select
											value={releaseEnv}
											onChange={(e) => setReleaseEnv(e.target.value)}
											className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs text-zinc-800 outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
										>
											<option value="production">Production</option>
											<option value="staging">Staging</option>
											<option value="development">Development</option>
										</select>
									</div>
								</div>

								<div className="space-y-1.5">
									<label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">
										Release Notes / Changelog
									</label>
									<textarea
										rows={2}
										placeholder="Optional notes describing this release deployment"
										value={releaseNotes}
										onChange={(e) => setReleaseNotes(e.target.value)}
										className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs outline-none focus:border-primary-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-100"
									/>
								</div>

								<div className="flex justify-end pt-1">
									<button
										type="submit"
										disabled={deployRelease.isPending}
										className="flex items-center gap-1.5 rounded-lg bg-primary-400 px-4 py-2 text-xs font-bold text-primary-950 hover:bg-primary-500 disabled:opacity-50 transition"
									>
										<Disc size={13} className="animate-spin-slow" />
										Deploy Release
									</button>
								</div>
							</form>

							{/* Deployments List */}
							<div className="space-y-3">
								<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
									Deployment Logs
								</h4>

								{isReleasesLoading ? (
									<div className="text-center py-6 text-xs text-zinc-400">Loading release logs...</div>
								) : releases.length === 0 ? (
									<div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
										No environments have been deployed. Deploy a release version above.
									</div>
								) : (
									<div className="space-y-2">
										{releases.map((rel) => {
											const isProd = rel.environment_id === 'production';
											const isStaging = rel.environment_id === 'staging';

											return (
												<div
													key={rel.id}
													className="flex items-start justify-between rounded-xl border border-zinc-150 p-4 dark:border-zinc-850 dark:bg-zinc-900/10"
												>
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<span
																className={`inline-block h-2 w-2 rounded-full ${
																	isProd
																		? 'bg-emerald-500'
																		: isStaging
																		? 'bg-amber-400'
																		: 'bg-blue-400'
																}`}
															/>
															<span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 capitalize">
																{rel.environment_id} Environment
															</span>
															<span className="text-[10px] text-zinc-400">
																Deployed version ID: {rel.version_id.slice(0, 8)}...
															</span>
														</div>
														<p className="text-xs text-zinc-600 dark:text-zinc-450 font-medium">
															{rel.notes || 'No deployment notes provided'}
														</p>
														<div className="flex items-center gap-1 text-[9px] text-zinc-400">
															<Clock size={10} />
															<span>{new Date(rel.created_at).toLocaleString()}</span>
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					)}

					{/* ─── CONTRACTS TAB ─── */}
					{activeTab === 'contracts' && (
						<div className="space-y-6">
							<div>
								<h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Contract Verification</h3>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
									Pin structural specifications (contracts) for input/output schema validation and integrity testing.
								</p>
							</div>

							{/* Top generate action */}
							<div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/20 p-4 dark:border-zinc-850 dark:bg-zinc-900/20">
								<div>
									<h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
										Freeze Current Canvas State
									</h4>
									<p className="text-[11px] text-zinc-500">
										Creates a structure snapshot to run validations and detect schema drifts.
									</p>
								</div>
								<button
									type="button"
									onClick={() => generateContract.mutate()}
									disabled={generateContract.isPending}
									className="flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-white px-3.5 py-2 text-xs font-bold dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition"
								>
									<Plus size={13} />
									Generate Snapshot
								</button>
							</div>

							{/* Contracts list */}
							<div className="space-y-3.5">
								<h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
									Contracts Database
								</h4>

								{isContractsLoading ? (
									<div className="text-center py-6 text-xs text-zinc-400">Loading contracts...</div>
								) : contracts.length === 0 ? (
									<div className="rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400 dark:border-zinc-800">
										No contracts snapshots created. Create one above to lock down specifications.
									</div>
								) : (
									<div className="space-y-3">
										{contracts.map((contract) => {
											const runResult = testResults[contract.id];
											const isRunning = runningTestId === contract.id;
											const testStatus = runResult?.status || contract.status;

											return (
												<div
													key={contract.id}
													className="rounded-xl border border-zinc-200 p-4 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/10 space-y-3"
												>
													<div className="flex items-center justify-between">
														<div className="space-y-0.5">
															<span className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
																Contract Snapshot ID: {contract.id.slice(0, 8)}...
															</span>
															<span className="block text-[10px] text-zinc-400">
																Created:{' '}
																{new Date(contract.created_at).toLocaleString()}
															</span>
														</div>

														<div className="flex items-center gap-2.5">
															{testStatus && (
																<span
																	className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
																		testStatus === 'passed'
																			? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-455'
																			: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-455'
																	}`}
																>
																	{testStatus === 'passed' ? (
																		<CheckCircle2 size={10} />
																	) : (
																		<XCircle size={10} />
																	)}
																	{testStatus.toUpperCase()}
																</span>
															)}

															<button
																type="button"
																onClick={() => handleRunVerification(contract.id)}
																disabled={isRunning}
																className="flex items-center gap-1 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-655 dark:border-zinc-850 dark:hover:bg-white/[0.04] dark:text-zinc-400 transition"
															>
																{isRunning ? (
																	<Loader2 size={11} className="animate-spin text-zinc-500" />
																) : (
																	<Play size={11} fill="currentColor" />
																)}
																<span>Verify</span>
															</button>
														</div>
													</div>

													{/* Test verification output details */}
													{runResult && (
														<div className="rounded-lg bg-zinc-50/80 p-3 text-xs dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/40 space-y-1.5">
															<div className="flex items-center gap-1.5">
																{runResult.status === 'passed' ? (
																	<span className="text-emerald-600 font-bold flex items-center gap-1">
																		<CheckCircle2 size={12} />
																		Verification Passed
																	</span>
																) : (
																	<span className="text-rose-600 font-bold flex items-center gap-1">
																		<AlertCircle size={12} />
																		Verification Failed
																	</span>
																)}
																<span className="text-[10px] text-zinc-400 font-medium">
																	— Canvas structure matches contract rules.
																</span>
															</div>

															{runResult.results && (
																<div className="space-y-1 text-[11px] font-medium pl-4 text-zinc-500 dark:text-zinc-400">
																	{runResult.results.missing_nodes?.length > 0 && (
																		<div>
																			<span className="text-rose-500 font-bold">Missing nodes:</span>{' '}
																			{runResult.results.missing_nodes.join(', ')}
																		</div>
																	)}
																	{runResult.results.unexpected_nodes?.length > 0 && (
																		<div>
																			<span className="text-amber-500 font-bold">Unexpected nodes:</span>{' '}
																			{runResult.results.unexpected_nodes.join(', ')}
																		</div>
																	)}
																	{runResult.results.missing_nodes?.length === 0 &&
																		runResult.results.unexpected_nodes?.length === 0 && (
																			<div className="text-zinc-400 italic">
																				No node deviations found.
																			</div>
																		)}
																</div>
															)}
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					)}
				</main>
			</div>
		</Modal>
	);
};

export default WorkflowGovernanceModal;
