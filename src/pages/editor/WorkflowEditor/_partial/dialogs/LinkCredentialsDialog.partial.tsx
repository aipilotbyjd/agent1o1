import { motion } from 'framer-motion';
import { X, Info, User, Check, AlertCircle } from 'lucide-react';
import { useWorkflowEditor } from '../../_context/WorkflowEditorProvider.context';
import { getNodeDefinition } from '../../_helper/nodeCatalog.constants';
import { useMemo, useState } from 'react';
import {
	useCredentials,
	useConnectOAuthCredential,
	useCreateCredential,
} from '@/api/modules/credentials';
import { useCredentialTypes } from '@/api/modules/credential-types';
import type { TCredentialType } from '@/types/credentialType.type';
import { useWorkspaceContext } from '@/context/workspace';
import { useQueryClient } from '@tanstack/react-query';

const LinkCredentialsDialog = () => {
	const { state, dispatch } = useWorkflowEditor();
	const open = state.ui.linkCredentialsOpen;
	const [linkedIds, setLinkedIds] = useState<Record<string, boolean>>({});

	const { activeWorkspaceId } = useWorkspaceContext();
	const queryClient = useQueryClient();
	const { data: credentials = [] } = useCredentials(
		activeWorkspaceId,
		{ per_page: 100 },
	);
	const connectOAuthMutation = useConnectOAuthCredential(activeWorkspaceId);
	const createCredentialMutation = useCreateCredential(activeWorkspaceId);
	const { data: credentialTypes = [] } = useCredentialTypes({ per_page: 200 });
	const [selectedCredentials, setSelectedCredentials] = useState<Record<string, string>>({});
	const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});
	// Inline "create credential" forms, keyed by node id.
	const [forms, setForms] = useState<
		Record<string, { name: string; data: Record<string, string>; error?: string }>
	>({});

	// Look up a credential type definition by its key (e.g. "slack").
	const credTypeByKey = useMemo(() => {
		const map: Record<string, TCredentialType> = {};
		credentialTypes.forEach((ct) => {
			map[(ct.type || '').toLowerCase()] = ct;
		});
		return map;
	}, [credentialTypes]);

	if (!open) return null;

	const handleClose = () => {
		dispatch({ type: 'SET_LINK_CREDENTIALS_OPEN', open: false });
	};

	const getCredentialType = (node: any, def: any): string => {
		const credField = def?.fields?.find((f: any) => f.kind === 'credential');
		if (credField?.credentialType) return credField.credentialType;
		if (def?.credentialType) return def.credentialType;
		if (def?.credential_type) return def.credential_type;

		const key = (node.data.defKey || '').toLowerCase();
		if (key.includes('slack')) return 'slack';
		if (key.includes('google_drive') || key.includes('google-drive')) return 'google_drive';
		if (key.includes('google_sheets') || key.includes('google-sheets')) return 'google_sheets';
		if (key.includes('google_calendar') || key.includes('google-calendar')) return 'google_calendar';
		if (key.includes('gmail')) return 'gmail';
		if (key.includes('hubspot')) return 'hubspot';
		if (key.includes('zendesk')) return 'zendesk';
		if (key.includes('linear')) return 'linear';
		if (key.includes('jira')) return 'jira';
		if (key.includes('typeform')) return 'typeform';
		if (key.includes('incident_io') || key.includes('incidentio')) return 'incident_io';
		if (key.includes('teams')) return 'microsoft_teams';
		return 'api_key';
	};

	// Find all nodes that require credentials but don't have them configured
	const missingNodes = state.nodes.filter((node) => {
		const def = getNodeDefinition(node.data.defKey, node.data.definition);
		return Boolean(def?.requiresCredential) && !node.data.values.credential_id && !linkedIds[node.id];
	});

	const showMockGoogle = state.nodes.length === 0 && !linkedIds['mock-google'];

	const handleLink = (nodeId: string, credentialId: string) => {
		setLinkedIds((prev) => ({ ...prev, [nodeId]: true }));
		if (nodeId !== 'mock-google') {
			dispatch({
				type: 'UPDATE_NODE_VALUE',
				id: nodeId,
				fieldKey: 'credential_id',
				value: credentialId,
			});
		}
	};

	// "+ Connect New" — OAuth types open the provider popup; everything else
	// (api_key / basic) opens an inline form to enter the key/token manually.
	const handleConnect = async (nodeId: string, credentialType: string) => {
		const credType = credTypeByKey[credentialType.toLowerCase()];

		if (credType?.auth_type === 'oauth') {
			setIsConnecting((prev) => ({ ...prev, [nodeId]: true }));
			try {
				const res = await connectOAuthMutation.mutateAsync({ credentialType });
				if (res.success && res.credentialId) {
					handleLink(nodeId, res.credentialId);
					queryClient.invalidateQueries({ queryKey: ['credentials', activeWorkspaceId] });
				}
			} catch (error) {
				console.error('OAuth connection error:', error);
			} finally {
				setIsConnecting((prev) => ({ ...prev, [nodeId]: false }));
			}
			return;
		}

		// Toggle the manual credential form for this node.
		setForms((prev) => {
			if (prev[nodeId]) {
				const { [nodeId]: _omit, ...rest } = prev;
				return rest;
			}
			return {
				...prev,
				[nodeId]: { name: `${credType?.name ?? credentialType} account`, data: {} },
			};
		});
	};

	const setFormField = (nodeId: string, key: string, value: string) => {
		setForms((prev) => ({
			...prev,
			[nodeId]: {
				...prev[nodeId],
				data: { ...prev[nodeId].data, [key]: value },
				error: undefined,
			},
		}));
	};

	const submitCredentialForm = async (
		nodeId: string,
		credentialType: string,
		credType?: TCredentialType,
	) => {
		const form = forms[nodeId];
		if (!form) return;

		const required = credType?.fields_schema?.required ?? [];
		const missing = required.filter((key) => !form.data[key]?.trim());
		if (!form.name.trim() || missing.length > 0) {
			setForms((prev) => ({
				...prev,
				[nodeId]: {
					...prev[nodeId],
					error: !form.name.trim() ? 'Please enter a name.' : 'Please fill in all required fields.',
				},
			}));
			return;
		}

		setIsConnecting((prev) => ({ ...prev, [nodeId]: true }));
		try {
			const created = await createCredentialMutation.mutateAsync({
				name: form.name.trim(),
				type: credentialType,
				data: form.data,
			});
			handleLink(nodeId, created.id);
			setForms((prev) => {
				const { [nodeId]: _omit, ...rest } = prev;
				return rest;
			});
			queryClient.invalidateQueries({ queryKey: ['credentials', activeWorkspaceId] });
		} catch {
			setForms((prev) => ({
				...prev,
				[nodeId]: { ...prev[nodeId], error: 'Failed to create credential. Please try again.' },
			}));
		} finally {
			setIsConnecting((prev) => ({ ...prev, [nodeId]: false }));
		}
	};

	// If no missing nodes, show success state or auto-close
	const allResolved = missingNodes.length === 0 && !showMockGoogle;

	return (
		<div className='fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 dark:bg-black/75 p-4 backdrop-blur-xs sm:backdrop-blur-sm select-none'>
			<motion.div
				initial={{ opacity: 0, scale: 0.96, y: 15 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.96, y: 15 }}
				transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
				className='relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl shadow-zinc-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/96 dark:text-zinc-100 dark:shadow-black/50'>
				
				{/* Top-Right Close Button */}
				<button
					type='button'
					onClick={handleClose}
					className='absolute top-4 right-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:border-white/10 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white transition'>
					<X size={14} />
				</button>

				{/* Modal Body */}
				<div className='p-6'>
					<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight'>
						Please link your accounts
					</h2>
					<p className='mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal'>
						The following credentials need to be authenticated to run the flow:
					</p>

					{/* Credentials List */}
					<div className='mt-5 space-y-3.5 max-h-[350px] overflow-y-auto pr-1'>
						{allResolved ? (
							<div className='flex flex-col items-center justify-center py-6 text-center text-zinc-500 dark:text-zinc-400'>
								<div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400 mb-3'>
									<Check size={24} strokeWidth={3} />
								</div>
								<h3 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>All Accounts Linked</h3>
								<p className='text-[11px] text-zinc-400 mt-1 max-w-[280px]'>
									All node credentials have been verified. You can now execute the workflow.
								</p>
							</div>
						) : (
							<>
								{showMockGoogle && (
									<div className='flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-850 p-4 bg-zinc-50/50 dark:bg-zinc-900/40 transition hover:border-zinc-200 dark:hover:border-zinc-800'>
										<div className='flex items-start'>
											{/* Icon */}
											<div className='mr-3.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600'>
												<svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
													<rect x='3' y='4' width='18' height='17' rx='2' fill='#4285F4' />
													<path d='M3 9h18v12h-18z' fill='#fff' />
													<text x='12' y='18' fill='#4285F4' fontSize='10' fontWeight='bold' textAnchor='middle'>31</text>
												</svg>
											</div>

											{/* Account details */}
											<div className='min-w-0'>
												<div className='text-[13px] font-bold text-zinc-850 dark:text-zinc-200'>
													Google Calendar
												</div>
												<div className='mt-1 flex items-center gap-1.5'>
													<User size={12} className='text-zinc-400 shrink-0' />
													<span className='text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
														Default personal
													</span>
													<span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200/50 text-amber-600 px-1.5 py-0.2 text-[8px] font-bold tracking-wide uppercase dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400'>
														0/2
													</span>
													<Info size={11} className='text-zinc-400' />
												</div>
												<div className='mt-0.5 text-[9px] text-zinc-400 dark:text-zinc-500'>
													Currently none
												</div>
											</div>
										</div>

										{/* Link Button */}
										<div>
											<button
												type='button'
												onClick={() => handleLink('mock-google', 'mock-google-id')}
												className='flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs transition active:scale-97'>
												Link
											</button>
										</div>
									</div>
								)}

								{missingNodes.map((node) => {
									const def = getNodeDefinition(node.data.defKey, node.data.definition);
									const credentialType = getCredentialType(node, def);
									const credType = credTypeByKey[credentialType.toLowerCase()];
									const isOAuth = credType?.auth_type === 'oauth';
									const form = forms[node.id];
									const fieldEntries = Object.entries(credType?.fields_schema?.properties ?? {});

									const matchingCredentials = credentials.filter(
										(c) => (c.type || '').toLowerCase() === credentialType.toLowerCase()
									);

									const isGoogle = node.data.defKey.includes('google') || credentialType.startsWith('google') || credentialType === 'gmail';
									const labelName = isGoogle ? 'Google Calendar' : node.data.label || 'API Account';
									const currentSelectedId = selectedCredentials[node.id] || (matchingCredentials[0]?.id ?? '');

									return (
										<div
											key={node.id}
											className='flex flex-col gap-3 rounded-xl border border-zinc-100 dark:border-zinc-850 p-4 bg-zinc-50/50 dark:bg-zinc-900/40 transition hover:border-zinc-200 dark:hover:border-zinc-800'>
											<div className='flex items-center justify-between w-full'>
												<div className='flex items-start'>
													{/* Icon */}
													<div className='mr-3.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600'>
														{isGoogle ? (
															<svg className='w-5 h-5' viewBox='0 0 24 24' fill='none'>
																<rect x='3' y='4' width='18' height='17' rx='2' fill='#4285F4' />
																<path d='M3 9h18v12h-18z' fill='#fff' />
																<text x='12' y='18' fill='#4285F4' fontSize='10' fontWeight='bold' textAnchor='middle'>31</text>
															</svg>
														) : (
															<AlertCircle size={18} className='text-zinc-500 dark:text-zinc-400' />
														)}
													</div>

													{/* Account details */}
													<div className='min-w-0'>
														<div className='text-[13px] font-bold text-zinc-850 dark:text-zinc-200'>
															{labelName}
														</div>
														<div className='mt-1 flex items-center gap-1.5'>
															<User size={12} className='text-zinc-400 shrink-0' />
															<span className='text-[11px] font-semibold text-zinc-700 dark:text-zinc-300'>
																{credentialType}
															</span>
															<span className='inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200/50 text-amber-600 px-1.5 py-0.2 text-[8px] font-bold tracking-wide uppercase dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400'>
																{matchingCredentials.length} active
															</span>
														</div>
													</div>
												</div>

												{/* Quick Connect Button */}
												<button
													type='button'
													disabled={isConnecting[node.id]}
													onClick={() => handleConnect(node.id, credentialType)}
													className='flex items-center justify-center rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-2xs transition active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed'>
													{isConnecting[node.id]
														? 'Connecting…'
														: form
															? 'Cancel'
															: isOAuth
																? '+ Connect New'
																: '+ Add Key'}
												</button>
											</div>

											{/* Manual credential form (api_key / basic types) */}
											{form && (
												<div className='flex flex-col gap-2.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-3'>
													<div>
														<label className='mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
															Name
														</label>
														<input
															type='text'
															value={form.name}
															onChange={(e) =>
																setForms((prev) => ({
																	...prev,
																	[node.id]: { ...prev[node.id], name: e.target.value, error: undefined },
																}))
															}
															placeholder='My connection'
															className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none transition focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
														/>
													</div>

													{fieldEntries.length === 0 && (
														<p className='text-[10px] text-zinc-400'>
															No fields defined for this credential type.
														</p>
													)}

													{fieldEntries.map(([key, field]) => {
														const isRequired = (
															credType?.fields_schema?.required ?? []
														).includes(key);
														return (
															<div key={key}>
																<label className='mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
																	{field.label || key}
																	{isRequired && <span className='ml-0.5 text-rose-500'>*</span>}
																</label>
																<input
																	type={field.secret ? 'password' : 'text'}
																	autoComplete='off'
																	value={form.data[key] ?? ''}
																	onChange={(e) => setFormField(node.id, key, e.target.value)}
																	placeholder={field.placeholder ?? ''}
																	className='w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 outline-none transition focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
																/>
																{field.description && (
																	<p className='mt-0.5 text-[9px] text-zinc-400'>{field.description}</p>
																)}
															</div>
														);
													})}

													{form.error && (
														<p className='text-[10px] font-semibold text-rose-500'>{form.error}</p>
													)}

													<div className='flex items-center justify-end gap-2 pt-0.5'>
														{credType?.docs_url && (
															<a
																href={credType.docs_url}
																target='_blank'
																rel='noreferrer'
																className='mr-auto text-[10px] font-semibold text-primary-500 hover:underline'>
																How to get this?
															</a>
														)}
														<button
															type='button'
															disabled={isConnecting[node.id]}
															onClick={() => submitCredentialForm(node.id, credentialType, credType)}
															className='flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-97 disabled:opacity-50'>
															{isConnecting[node.id] ? 'Saving…' : 'Create & Link'}
														</button>
													</div>
												</div>
											)}

											{/* Select existing workspace connection */}
											{!form && matchingCredentials.length > 0 ? (
												<div className='flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-3'>
													<select
														value={currentSelectedId}
														onChange={(e) => setSelectedCredentials(prev => ({ ...prev, [node.id]: e.target.value }))}
														className='flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none transition focus:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'>
														{matchingCredentials.map((c) => (
															<option key={c.id} value={c.id}>
																{c.name}
															</option>
														))}
													</select>
													<button
														type='button'
														disabled={!currentSelectedId}
														onClick={() => handleLink(node.id, currentSelectedId)}
														className='flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-97'>
														Link
													</button>
												</div>
											) : !form ? (
												<div className='text-[10px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5'>
													No matching connections. Click "{isOAuth ? '+ Connect New' : '+ Add Key'}" to add one.
												</div>
											) : null}
										</div>
									);
								})}
							</>
						)}
					</div>
				</div>

				{/* Footer bar */}
				<div className='flex items-center justify-end border-t border-zinc-150 bg-zinc-50/70 px-6 py-3.5 dark:border-zinc-850 dark:bg-zinc-900/40'>
					<button
						type='button'
						onClick={handleClose}
						className='flex h-8 items-center justify-center rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-4 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition active:scale-97'>
						Close
					</button>
				</div>
			</motion.div>
		</div>
	);
};

export default LinkCredentialsDialog;
