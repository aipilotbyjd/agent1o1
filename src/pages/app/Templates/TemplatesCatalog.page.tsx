import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Search,
	Layers,
	Cpu,
	Workflow,
	Check,
	Loader2,
	X,
	Settings,
	ExternalLink,
	Play,
	Send,
	Sparkles,
	ChevronDown,
	SlidersHorizontal,
	Grid,
	List,
	Users,
} from 'lucide-react';
import { OutletContextType } from './_layouts/Templates.layout';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Container from '@/components/layout/Container';
import pages from '@/Routes/pages';
import { useWorkspaceContext } from '@/context/workspace';
import {
	useTemplates,
	useTemplate,
	useUseTemplate,
	useAgentTemplates,
	useAgentTemplate,
	useDeployAgent,
	useTemplateCollections,
	useTemplateCollection,
} from '@/api/modules/templates';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';

// Helper for credentials styling
const getCredentialStyle = (cred: string) => {
	switch (cred.toLowerCase()) {
		case 'slack':
			return {
				bg: 'bg-[#ECFDF5] dark:bg-[#059669]/10',
				border: 'border-[#D1FAE5] dark:border-[#059669]/20',
				text: 'text-[#059669] dark:text-[#34D399]',
			};
		case 'smtp':
		case 'email':
			return {
				bg: 'bg-[#EFF6FF] dark:bg-[#2563EB]/10',
				border: 'border-[#DBEAFE] dark:border-[#2563EB]/20',
				text: 'text-[#2563EB] dark:text-[#60A5FA]',
			};
		case 'google-sheets':
		case 'google':
			return {
				bg: 'bg-[#F0FDF4] dark:bg-[#16A34A]/10',
				border: 'border-[#DCFCE7] dark:border-[#16A34A]/20',
				text: 'text-[#16A34A] dark:text-[#4ADE80]',
			};
		case 'stripe':
			return {
				bg: 'bg-[#F5F3FF] dark:bg-[#7C3AED]/10',
				border: 'border-[#DDD6FE] dark:border-[#7C3AED]/20',
				text: 'text-[#7C3AED] dark:text-[#A78BFA]',
			};
		case 'clearbit':
		case 'enrichment':
			return {
				bg: 'bg-[#FFFBEB] dark:bg-[#D97706]/10',
				border: 'border-[#FEF3C7] dark:border-[#D97706]/20',
				text: 'text-[#D97706] dark:text-[#FBBF24]',
			};
		default:
			return {
				bg: 'bg-[#F8FAFC] dark:bg-zinc-800/30',
				border: 'border-[#E2E8F0] dark:border-zinc-800/50',
				text: 'text-[#64748B] dark:text-zinc-400',
			};
	}
};

const formatUsageCount = (count?: number) => {
	if (!count) return '1.2K';
	if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}K`;
	}
	return count.toString();
};

interface IPreviewNode {
	id: string;
	type?: string;
	position?: { x: number; y: number };
	data?: { label?: string };
}

interface IPreviewEdge {
	id: string;
	source: string;
	target: string;
}

// Mini read-only node graph visualizer
const GraphPreview = ({
	nodes = [],
	edges = [],
}: {
	nodes?: IPreviewNode[];
	edges?: IPreviewEdge[];
}) => {
	if (!nodes || nodes.length === 0) {
		return (
			<div className='flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/30'>
				No graph layout available
			</div>
		);
	}

	// Normalise coordinates to fit in container
	const coords = nodes.map((n) => ({ x: n.position?.x ?? 0, y: n.position?.y ?? 0 }));
	const minX = Math.min(...coords.map((c) => c.x));
	const maxX = Math.max(...coords.map((c) => c.x));
	const minY = Math.min(...coords.map((c) => c.y));
	const maxY = Math.max(...coords.map((c) => c.y));

	const widthRange = maxX - minX || 1;
	const heightRange = maxY - minY || 1;

	// Scale variables
	const containerWidth = 500;
	const containerHeight = 200;
	const padding = 50;

	const scaledNodes = nodes.map((node) => {
		const nx = node.position?.x ?? 0;
		const ny = node.position?.y ?? 0;
		const x = padding + ((nx - minX) / widthRange) * (containerWidth - padding * 2);
		const y = padding + ((ny - minY) / heightRange) * (containerHeight - padding * 2);
		return { ...node, x, y };
	});

	return (
		<div className='relative h-[240px] w-full overflow-hidden rounded-xl border border-zinc-100 bg-zinc-900/5 p-4 dark:border-zinc-800 dark:bg-zinc-900/20'>
			<svg className='pointer-events-none absolute inset-0 h-full w-full'>
				<defs>
					<marker
						id='arrow'
						viewBox='0 0 10 10'
						refX='22'
						refY='5'
						markerWidth='6'
						markerHeight='6'
						orient='auto-start-reverse'>
						<path d='M 0 1 L 10 5 L 0 9 z' fill='#8B5CF6' />
					</marker>
				</defs>
				{edges.map((edge) => {
					const sourceNode = scaledNodes.find((n) => n.id === edge.source);
					const targetNode = scaledNodes.find((n) => n.id === edge.target);
					if (!sourceNode || !targetNode) return null;

					return (
						<line
							key={edge.id}
							x1={sourceNode.x}
							y1={sourceNode.y}
							x2={targetNode.x}
							y2={targetNode.y}
							stroke='#8B5CF6'
							strokeWidth='2'
							strokeDasharray='4 4'
							markerEnd='url(#arrow)'
							className='opacity-70'
						/>
					);
				})}
			</svg>
			{scaledNodes.map((node) => (
				<div
					key={node.id}
					style={{
						position: 'absolute',
						left: `${node.x}px`,
						top: `${node.y}px`,
						transform: 'translate(-50%, -50%)',
					}}
					className='flex max-w-[150px] items-center gap-2 overflow-hidden rounded-lg border border-primary-200 bg-white px-3 py-1.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950'>
					<div className='h-2 w-2 shrink-0 rounded-full bg-primary-400' />
					<div className='truncate text-[10px] font-bold text-zinc-800 select-none dark:text-zinc-200'>
						{node.data?.label || node.type || 'Action'}
					</div>
				</div>
			))}
		</div>
	);
};

// Simulated Interactive Agent chat component inside Agent Detail preview
const AgentChatMock = ({
	systemPrompt = '',
	agentName = '',
	exampleConversations = [],
}: {
	systemPrompt?: string;
	agentName: string;
	exampleConversations?: { user: string; assistant: string }[];
}) => {
	const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>(
		() => {
			if (exampleConversations && exampleConversations.length > 0) {
				return [
					{ role: 'user', text: exampleConversations[0].user },
					{ role: 'assistant', text: exampleConversations[0].assistant },
				];
			}
			return [
				{
					role: 'assistant',
					text: `Hello! I am the ${agentName}. How can I assist you today?`,
				},
			];
		},
	);
	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);

	const handleSend = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isTyping) return;

		const userMsg = input;
		setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
		setInput('');
		setIsTyping(true);

		setTimeout(() => {
			setIsTyping(false);
			setMessages((prev) => [
				...prev,
				{
					role: 'assistant',
					text: `I've received your request: "${userMsg}". As a deployed agent with system instructions: "${systemPrompt.slice(0, 50)}...", I will process this once you connect actual integrations!`,
				},
			]);
		}, 1200);
	};

	return (
		<div className='flex h-[300px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950'>
			{/* Chat header */}
			<div className='flex shrink-0 items-center gap-2.5 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900'>
				<div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white'>
					{agentName.slice(0, 2).toUpperCase()}
				</div>
				<div className='text-xs font-semibold text-zinc-800 dark:text-zinc-200'>
					{agentName}{' '}
					<span className='text-[10px] font-medium text-emerald-500'>
						• Ready to deploy
					</span>
				</div>
			</div>
			{/* Chat bubble screen */}
			<div className='flex flex-1 flex-col gap-3 overflow-y-auto p-4'>
				{messages.map((m, i) => (
					<div
						key={i}
						className={`flex max-w-[85%] gap-2 ${m.role === 'user' ? 'flex-row-reverse self-end' : 'self-start'}`}>
						<div
							className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${m.role === 'user' ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
							{m.role === 'user' ? 'U' : 'A'}
						</div>
						<div
							className={`rounded-lg p-2.5 text-xs leading-relaxed ${m.role === 'user' ? 'rounded-tr-none bg-blue-500 text-white' : 'rounded-tl-none border border-zinc-100 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'}`}>
							{m.text}
						</div>
					</div>
				))}
				{isTyping && (
					<div className='flex max-w-[85%] gap-2 self-start'>
						<div className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 dark:bg-blue-900'>
							A
						</div>
						<div className='flex items-center gap-1 rounded-lg rounded-tl-none border border-zinc-100 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900'>
							<span
								className='h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600'
								style={{ animationDelay: '0ms' }}
							/>
							<span
								className='h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600'
								style={{ animationDelay: '150ms' }}
							/>
							<span
								className='h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 dark:bg-zinc-600'
								style={{ animationDelay: '300ms' }}
							/>
						</div>
					</div>
				)}
			</div>
			{/* Chat input bar */}
			<form
				onSubmit={handleSend}
				className='flex shrink-0 gap-2 border-t border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900'>
				<input
					type='text'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder={`Ask ${agentName}...`}
					className='flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200'
				/>
				<button
					type='submit'
					className='rounded-lg bg-blue-500 p-1.5 text-white transition-colors hover:bg-blue-600'>
					<Send className='h-3.5 w-3.5' />
				</button>
			</form>
		</div>
	);
};

const TemplatesCatalogPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	const navigate = useNavigate();
	const { activeWorkspaceId } = useWorkspaceContext();

	// Tabs: 'workflows' | 'agents' | 'collections'
	const [activeTab, setActiveTab] = useState<'workflows' | 'agents' | 'collections'>('workflows');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<string>('');

	// Details dialog trigger
	const [previewId, setPreviewId] = useState<string | null>(null);

	// Batch deployer progress state
	const [deployingCollectionId, setDeployingCollectionId] = useState<string | null>(null);
	const [deployProgress, setDeployProgress] = useState<
		Array<{
			name: string;
			type: 'workflow' | 'agent';
			status: 'pending' | 'loading' | 'success' | 'failed';
			link?: string;
		}>
	>([]);

	useEffect(() => {
		setHeaderLeft(
			<Breadcrumb
				list={[
					{ text: 'Dashboard', to: pages.app.subPages.dashboard.to },
					{ text: 'Templates', to: pages.app.subPages.templates.to },
				]}
			/>,
		);
		return () => setHeaderLeft('');
	}, [setHeaderLeft]);

	// React-Query filter args
	const filters = useMemo(() => {
		const f: any = {};
		if (searchQuery.trim()) f.search = searchQuery;
		if (selectedCategory) f.category = selectedCategory;
		return f;
	}, [searchQuery, selectedCategory]);

	// Query lists
	const { data: workflows, isLoading: isWfsLoading } = useTemplates(
		activeTab === 'workflows' ? filters : undefined,
	);
	// Unfiltered fetch to derive the category dropdown options/counts (no dedicated categories endpoint)
	const { data: allWorkflowTemplates } = useTemplates(
		activeTab === 'workflows' ? { per_page: 100 } : undefined,
	);
	const wfCategories = useMemo(() => {
		if (!allWorkflowTemplates) return [];
		const counts = new Map<string, number>();
		for (const t of allWorkflowTemplates) {
			counts.set(t.category, (counts.get(t.category) || 0) + 1);
		}
		return Array.from(counts, ([category, count]) => ({ category, count }));
	}, [allWorkflowTemplates]);
	const { data: agents, isLoading: isAgentsLoading } = useAgentTemplates(
		activeTab === 'agents' ? filters : undefined,
	);
	const { data: collections, isLoading: isCollsLoading } = useTemplateCollections(
		activeTab === 'collections' ? { search: searchQuery } : undefined,
	);

	// Fetch details when previewId is active
	const { data: wfDetail } = useTemplate(previewId && activeTab === 'workflows' ? previewId : '');
	const { data: agentDetail } = useAgentTemplate(
		previewId && activeTab === 'agents' ? previewId : '',
	);
	const { data: collectionDetail } = useTemplateCollection(
		previewId && activeTab === 'collections' ? previewId : '',
	);

	// Deployment mutations
	const useWfMutation = useUseTemplate(activeWorkspaceId || '');
	const deployAgentMutation = useDeployAgent(activeWorkspaceId || '');

	// Featured lists
	const featuredWorkflows = useMemo(
		() => workflows?.filter((w) => w.is_featured) || [],
		[workflows],
	);
	const featuredAgents = useMemo(() => agents?.filter((a) => a.is_featured) || [], [agents]);
	const featuredCollections = useMemo(
		() => collections?.filter((c) => c.is_featured) || [],
		[collections],
	);

	// Dynamic categorisation lists
	const agentCategories = ['support', 'sales', 'devops', 'data', 'creative'];

	// Deploy Collection (batch loader)
	const handleDeployCollection = async (coll: any) => {
		if (!activeWorkspaceId) return;
		setDeployingCollectionId(coll.id);

		const progressItems = coll.items.map((item: any) => {
			let name = 'Item';
			if (item.type === 'agent') {
				name = agents?.find((a) => a.id === item.template_id)?.name || 'Agent';
			} else {
				name = workflows?.find((w) => w.id === item.template_id)?.name || 'Workflow';
			}
			return {
				name,
				type: item.type,
				template_id: item.template_id,
				status: 'pending' as const,
			};
		});

		setDeployProgress(progressItems);

		// Execute sequential deploy
		for (let i = 0; i < progressItems.length; i++) {
			const item = progressItems[i];
			setDeployProgress((prev) =>
				prev.map((p, idx) => (idx === i ? { ...p, status: 'loading' } : p)),
			);
			try {
				if (item.type === 'workflow') {
					const res = await useWfMutation.mutateAsync({ templateId: item.template_id });
					const link = `/editor/edit-workflow/${activeWorkspaceId}/${res.workflow_id}`;
					setDeployProgress((prev) =>
						prev.map((p, idx) => (idx === i ? { ...p, status: 'success', link } : p)),
					);
				} else {
					const res = await deployAgentMutation.mutateAsync(item.template_id);
					const link = `/agent/edit/${res.agent_id}`;
					setDeployProgress((prev) =>
						prev.map((p, idx) => (idx === i ? { ...p, status: 'success', link } : p)),
					);
				}
			} catch (err) {
				setDeployProgress((prev) =>
					prev.map((p, idx) => (idx === i ? { ...p, status: 'failed' } : p)),
				);
			}
		}
	};
	return (
		<Container className='relative overflow-x-hidden overflow-y-auto bg-[#F8F9FC] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] !p-0 dark:bg-zinc-950 dark:bg-[radial-gradient(#27272a_1px,transparent_1px)]'>
			{/* Custom 3D float keyframes */}
			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(-10deg) skewX(2deg); }
					50% { transform: translateY(-12px) rotate(-8deg) skewX(1deg); }
				}
				@keyframes float-teal {
					0%, 100% { transform: translateY(0px) rotate(15deg) skewX(-2deg); }
					50% { transform: translateY(-8px) rotate(12deg) skewX(-1deg); }
				}
				@keyframes float-coral {
					0%, 100% { transform: translateY(0px) rotate(-5deg); }
					50% { transform: translateY(-10px) rotate(-8deg); }
				}
				.animate-3d-float {
					animation: float 6s ease-in-out infinite;
				}
				.animate-3d-float-teal {
					animation: float-teal 5s ease-in-out infinite;
				}
				.animate-3d-float-coral {
					animation: float-coral 7s ease-in-out infinite;
				}
			`}</style>

			<div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
				{/* Hero header banner */}
				<div className='relative mb-8 overflow-hidden rounded-3xl border border-primary-500/20 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 px-6 py-8 text-[#101828] shadow-xl sm:px-10 sm:py-12 dark:border-zinc-800 dark:bg-gradient-to-r dark:from-[#111315] dark:via-[#141619] dark:to-[#0d0e10] dark:text-white'>
					<div className='grid grid-cols-1 items-center gap-8 lg:grid-cols-12'>
						<div className='relative z-10 lg:col-span-8'>
							<div className='flex items-center gap-3 mb-4'>
								<div className='inline-block rounded-md border border-white/30 bg-white/40 px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#101828] uppercase backdrop-blur-md dark:border-primary-500/20 dark:bg-primary-950/30 dark:text-primary-400'>
									Ready to use
								</div>
							</div>
							<h1 className='mb-3 text-3xl font-extrabold tracking-tight text-[#101828] sm:text-4xl dark:text-white'>
								Templates Center
							</h1>
							<p className='mb-6 max-w-2xl text-xs leading-relaxed text-zinc-850 sm:text-sm dark:text-zinc-400'>
								Deploy pre-configured workflows, conversational AI agents, or
								bundles of matching stacks to build your automation platform in
								seconds.
							</p>

							{/* Stats Cards Row inside Hero */}
							<div className='mt-6 flex flex-wrap items-center gap-4'>
								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Workflow className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											120+
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Templates
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Layers className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											9
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Categories
										</div>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-2xl border border-white/20 bg-white/40 px-4 py-2.5 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60'>
									<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/50 dark:bg-zinc-850'>
										<Sparkles className='h-4.5 w-4.5 text-[#101828] dark:text-primary-400' />
									</div>
									<div>
										<div className='text-sm leading-none font-extrabold text-[#101828] dark:text-white'>
											2.4K+
										</div>
										<div className='mt-0.5 text-[10px] font-semibold text-slate-800 dark:text-zinc-500'>
											Deployments
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* 3D Graphic Column */}
						<div className='pointer-events-none relative hidden h-56 justify-center select-none lg:col-span-4 lg:flex'>
							<div className='transform-style-3d relative flex h-64 w-64 items-center justify-center perspective-[1000px]'>
								{/* Main Violet Card */}
								<div className='animate-3d-float absolute flex h-36 w-36 rotate-x-[15deg] rotate-y-[-20deg] items-center justify-center rounded-3xl border border-white/25 bg-gradient-to-br from-primary-400 to-primary-500 shadow-[0_25px_50px_-12px_rgba(196,238,61,0.25)]'>
									<div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/15 via-transparent to-transparent' />
									<Sparkles className='h-16 w-16 text-zinc-900 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]' />
								</div>
								{/* Teal floating card */}
								<div className='animate-3d-float-teal absolute top-28 left-4 flex h-12 w-12 rotate-x-[10deg] rotate-y-[-30deg] items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-[#7B37FC] to-[#501EE3] shadow-lg'>
									<Workflow className='h-5 w-5 text-white' />
								</div>
								{/* Coral floating card */}
								<div className='animate-3d-float-coral absolute top-12 right-6 flex h-10 w-10 rotate-x-[-15deg] rotate-y-[25deg] items-center justify-center rounded-xl border border-white/20 bg-gradient-to-tr from-orange-400 to-primary-400 shadow-lg'>
									<Cpu className='h-4.5 w-4.5 text-white' />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Tabs & Search controls */}
				<div className='mb-8 flex flex-col items-stretch justify-between gap-4 border-b border-zinc-200/50 pb-5 md:flex-row md:items-center dark:border-zinc-800'>
					{/* Tab pills */}
					<div className='flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 scroll-smooth'>
						<button
							onClick={() => {
								setActiveTab('workflows');
								setSelectedCategory('');
							}}
							className={`flex cursor-pointer shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'workflows'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Workflow className='h-3.5 w-3.5' />
							Workflows
						</button>
						<button
							onClick={() => {
								setActiveTab('agents');
								setSelectedCategory('');
							}}
							className={`flex cursor-pointer shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'agents'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Cpu className='h-3.5 w-3.5' />
							AI Agents
						</button>
						<button
							onClick={() => {
								setActiveTab('collections');
								setSelectedCategory('');
							}}
							className={`flex cursor-pointer shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
								activeTab === 'collections'
									? 'border border-primary-500/20 bg-primary-50 text-primary-600 shadow-2xs dark:border-primary-800/40 dark:bg-primary-950/30 dark:text-primary-400'
									: 'border border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
							}`}>
							<Layers className='h-3.5 w-3.5' />
							Collections
						</button>
					</div>

					{/* Filter & Search actions */}
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center w-full sm:w-auto'>
						{/* Search field */}
						<div className='relative w-full sm:w-64'>
							<Search className='pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-600' />
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={`Search ${activeTab === 'workflows' ? 'workflows' : activeTab === 'agents' ? 'agents' : 'collections'}...`}
								className='dark:focus:ring-primary-600 shadow-3xs w-full rounded-xl border border-zinc-200/80 bg-white py-2 pr-4 pl-9 text-xs text-zinc-700 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'
							/>
						</div>

						{/* Category Select (only for workflows / agents) */}
						{activeTab !== 'collections' && (
							<div className='relative w-full sm:w-auto'>
								<SlidersHorizontal className='pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600' />
								<select
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
									className='shadow-3xs w-full cursor-pointer appearance-none rounded-xl border border-zinc-200/80 bg-white py-2 pr-8 pl-9 text-xs text-zinc-700 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300'>
									<option value=''>All Categories</option>
									{activeTab === 'workflows'
										? wfCategories?.map((cat: any) => (
												<option key={cat.category} value={cat.category}>
													{cat.category.charAt(0).toUpperCase() +
														cat.category.slice(1)}{' '}
													({cat.count})
												</option>
											))
										: agentCategories.map((cat) => (
												<option key={cat} value={cat}>
													{cat.charAt(0).toUpperCase() + cat.slice(1)}
												</option>
											))}
								</select>
								<ChevronDown className='pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-600' />
							</div>
						)}
					</div>
				</div>

				{/* Featured Shelf */}
				{searchQuery === '' && !selectedCategory && (
					<div className='mb-10'>
						{activeTab === 'workflows' && featuredWorkflows.length > 0 && (
							<div>
								<div className='mb-5 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Sparkles className='h-4.5 w-4.5 text-primary-500' />
										<h2 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
											Featured Workflows
										</h2>
									</div>
									<button className='flex cursor-pointer items-center gap-1.5 text-xs font-bold text-primary-600 transition-opacity hover:opacity-80 dark:text-primary-400'>
										View all <span className='text-sm'>→</span>
									</button>
								</div>
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
									{featuredWorkflows.slice(0, 3).map((wf) => {
										const displayColor = wf.color || '#C4EE3D';
										return (
											<div
												key={wf.id}
												className='group relative flex cursor-pointer flex-col rounded-2xl border border-zinc-200/50 bg-white p-5 transition-all duration-300 hover:border-primary-300 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-primary-800'
												onClick={() => setPreviewId(wf.id)}>
												<div className='mb-4 flex items-start justify-between'>
													<div className='flex items-center gap-3'>
														<div
															style={{
																backgroundColor: `${displayColor}12`,
															}}
															className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50'>
															<Workflow
																className='h-5 w-5'
																style={{ color: displayColor }}
															/>
														</div>
														<div className='truncate'>
															<h3 className='truncate text-xs font-bold text-zinc-800 transition-colors group-hover:text-primary-600 sm:text-sm dark:text-zinc-200 dark:group-hover:text-primary-400'>
																{wf.name}
															</h3>
															<span className='mt-0.5 block text-[10px] font-medium text-zinc-400 capitalize'>
																{wf.category}
															</span>
														</div>
													</div>
													<button className='rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
														<span className='text-sm leading-none font-bold'>
															...
														</span>
													</button>
												</div>
												<p className='mb-5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
													{wf.description}
												</p>
												<div className='mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-900'>
													<div className='flex flex-wrap gap-1'>
														{wf.required_credentials
															?.slice(0, 2)
															.map((cred: string) => {
																const style =
																	getCredentialStyle(cred);
																return (
																	<span
																		key={cred}
																		className={`rounded-md border px-2 py-0.5 text-[9px] font-bold ${style.bg} ${style.border} ${style.text}`}>
																		{cred}
																	</span>
																);
															})}
														{(!wf.required_credentials ||
															wf.required_credentials.length ===
																0) && (
															<span className='rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60'>
																No credentials
															</span>
														)}
														{wf.required_credentials &&
															wf.required_credentials.length > 2 && (
																<span className='rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 dark:border-zinc-800 dark:bg-[#18181b]'>
																	+
																	{wf.required_credentials
																		.length - 2}
																</span>
															)}
													</div>
													<button
														onClick={async (e) => {
															e.stopPropagation();
															if (!activeWorkspaceId) return;
															try {
																const res =
																	await useWfMutation.mutateAsync(
																		{ templateId: wf.id },
																	);
																navigate(
																	`/editor/edit-workflow/${activeWorkspaceId}/${res.workflow_id}`,
																);
															} catch (err) {}
														}}
														className='cursor-pointer rounded-xl border border-primary-500/40 px-3.5 py-1.5 text-[10px] font-bold text-primary-600 transition-all duration-200 hover:bg-primary-500 hover:text-zinc-950 dark:border-primary-500/40 dark:text-primary-400 dark:hover:bg-primary-500 dark:hover:text-zinc-950'>
														Use Template
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{activeTab === 'agents' && featuredAgents.length > 0 && (
							<div>
								<div className='mb-5 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Sparkles className='h-4.5 w-4.5 text-primary-500' />
										<h2 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
											Featured AI Agents
										</h2>
									</div>
									<button className='flex cursor-pointer items-center gap-1.5 text-xs font-bold text-primary-600 transition-opacity hover:opacity-80 dark:text-primary-400'>
										View all <span className='text-sm'>→</span>
									</button>
								</div>
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
									{featuredAgents.slice(0, 3).map((agent) => {
										const displayColor = agent.color || '#C4EE3D';
										return (
											<div
												key={agent.id}
												className='group relative flex cursor-pointer flex-col rounded-2xl border border-zinc-200/50 bg-white p-5 transition-all duration-300 hover:border-primary-300 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-primary-800'
												onClick={() => setPreviewId(agent.id)}>
												<div className='mb-4 flex items-start justify-between'>
													<div className='flex items-center gap-3'>
														<div
															style={{
																backgroundColor: `${displayColor}12`,
															}}
															className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50'>
															<Cpu
																className='h-5 w-5'
																style={{ color: displayColor }}
															/>
														</div>
														<div className='truncate'>
															<h3 className='truncate text-xs font-bold text-zinc-800 transition-colors group-hover:text-primary-600 sm:text-sm dark:text-zinc-200 dark:group-hover:text-primary-400'>
																{agent.name}
															</h3>
															<span className='mt-0.5 block text-[10px] font-medium text-zinc-400 capitalize'>
																{agent.category}
															</span>
														</div>
													</div>
													<button className='rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
														<span className='text-sm leading-none font-bold'>
															...
														</span>
													</button>
												</div>
												<p className='mb-5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
													{agent.description}
												</p>
												<div className='mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-900'>
													<span className='truncate rounded-md border border-primary-200/30 bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-600 dark:bg-primary-950/20 dark:text-primary-400'>
														{agent.llm_model}
													</span>
													<button
														onClick={async (e) => {
															e.stopPropagation();
															if (!activeWorkspaceId) return;
															try {
																const res =
																	await deployAgentMutation.mutateAsync(
																		agent.id,
																	);
																navigate(
																	`/agent/edit/${res.agent_id}`,
																);
															} catch (err) {}
														}}
														className='dark:hover:bg-primary-500 cursor-pointer rounded-xl border border-primary-600 px-3.5 py-1.5 text-[10px] font-bold text-primary-600 transition-all duration-200 hover:bg-primary-600 hover:text-zinc-900 dark:border-primary-500 dark:text-primary-400 dark:hover:text-zinc-900'>
														Deploy Agent
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}

						{activeTab === 'collections' && featuredCollections.length > 0 && (
							<div>
								<div className='mb-5 flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Sparkles className='h-4.5 w-4.5 text-amber-500' />
										<h2 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
											Featured Collections
										</h2>
									</div>
									<button className='flex cursor-pointer items-center gap-1.5 text-xs font-bold text-amber-600 transition-opacity hover:opacity-80 dark:text-amber-400'>
										View all <span className='text-sm'>→</span>
									</button>
								</div>
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
									{featuredCollections.slice(0, 3).map((coll) => {
										const displayColor = coll.color || '#F59E0B';
										return (
											<div
												key={coll.id}
												className='group relative flex cursor-pointer flex-col rounded-2xl border border-zinc-200/50 bg-white p-5 transition-all duration-300 hover:border-amber-300 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-amber-800'
												onClick={() => setPreviewId(coll.id)}>
												<div className='mb-4 flex items-start justify-between'>
													<div className='flex items-center gap-3'>
														<div
															style={{
																backgroundColor: `${displayColor}12`,
															}}
															className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50'>
															<Layers
																className='h-5 w-5'
																style={{ color: displayColor }}
															/>
														</div>
														<div className='truncate'>
															<h3 className='truncate text-xs font-bold text-zinc-800 transition-colors group-hover:text-amber-600 sm:text-sm dark:text-zinc-200 dark:group-hover:text-amber-400'>
																{coll.name}
															</h3>
															<span className='mt-0.5 block text-[10px] font-medium text-zinc-400'>
																Bundle Collection
															</span>
														</div>
													</div>
													<button className='hover:text-zinc-600 rounded p-1 text-zinc-400 dark:hover:text-zinc-300'>
														<span className='text-sm leading-none font-bold'>
															...
														</span>
													</button>
												</div>
												<p className='mb-5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
													{coll.description}
												</p>
												<div className='mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-900'>
													<span className='rounded-full border border-amber-200/40 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'>
														{coll.items.length} items
													</span>
													<button
														onClick={(e) => {
															e.stopPropagation();
															setPreviewId(coll.id);
														}}
														className='cursor-pointer rounded-xl border border-amber-600 px-3.5 py-1.5 text-[10px] font-bold text-amber-600 transition-all duration-200 hover:bg-amber-600 hover:text-white dark:border-amber-500 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white'>
														Deploy Stack
													</button>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Main Grid list */}
				<div className='mt-8'>
					<div className='mb-6 flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<h2 className='text-sm font-bold text-zinc-800 dark:text-zinc-200'>
								{activeTab === 'workflows'
									? 'All Workflows'
									: activeTab === 'agents'
										? 'All Agents'
										: 'All Collections'}
							</h2>
							<span className='rounded-full bg-zinc-200/50 px-2.5 py-0.5 text-[10px] font-extrabold text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400'>
								{activeTab === 'workflows'
									? (workflows?.length ?? 0)
									: activeTab === 'agents'
										? (agents?.length ?? 0)
										: (collections?.length ?? 0)}
							</span>
						</div>

						<div className='flex items-center gap-3'>
							{/* Sort Dropdown */}
							<div className='relative'>
								<select
									style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
									className='shadow-3xs cursor-pointer appearance-none rounded-xl border border-zinc-200/80 bg-white py-1.5 pr-8 pl-3 text-[11px] text-zinc-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'>
									<option>Latest Added</option>
									<option>Popularity</option>
									<option>Alphabetical</option>
								</select>
								<ChevronDown className='pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-zinc-400' />
							</div>

							{/* Layout Switcher */}
							<div className='flex items-center rounded-lg border border-zinc-200/20 bg-zinc-200/55 p-0.5 dark:bg-zinc-900'>
								<button className='text-primary-600 shadow-3xs cursor-pointer rounded-md bg-white p-1.5 dark:bg-zinc-800 dark:text-primary-400'>
									<Grid className='h-3.5 w-3.5' />
								</button>
								<button className='cursor-pointer rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
									<List className='h-3.5 w-3.5' />
								</button>
							</div>
						</div>
					</div>

					{/* Loaders */}
					{(activeTab === 'workflows' && isWfsLoading) ||
					(activeTab === 'agents' && isAgentsLoading) ||
					(activeTab === 'collections' && isCollsLoading) ? (
						<div className='flex flex-col items-center justify-center gap-2 py-24'>
							<Loader2 className='h-8 w-8 animate-spin text-primary-500' />
							<span className='dark:text-zinc-400 text-xs text-zinc-500'>
								Loading catalog...
							</span>
						</div>
					) : null}

					{/* Empty lists */}
					{activeTab === 'workflows' && workflows?.length === 0 && (
						<div className='rounded-2xl border border-dashed border-zinc-200 bg-white/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/50'>
							<Workflow className='text-zinc-300 dark:text-zinc-600 mx-auto mb-2 h-10 w-10' />
							<h3 className='mb-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								No workflow templates found
							</h3>
							<p className='text-xs text-zinc-400'>
								Try broadening your search query or filters.
							</p>
						</div>
					)}
					{activeTab === 'agents' && agents?.length === 0 && (
						<div className='rounded-2xl border border-dashed border-zinc-200 bg-white/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/50'>
							<Cpu className='text-zinc-300 dark:text-zinc-600 mx-auto mb-2 h-10 w-10' />
							<h3 className='mb-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								No AI agent templates found
							</h3>
							<p className='text-xs text-zinc-400'>
								Try broadening your search query or filters.
							</p>
						</div>
					)}
					{activeTab === 'collections' && collections?.length === 0 && (
						<div className='rounded-2xl border border-dashed border-zinc-200 bg-white/50 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/50'>
							<Layers className='text-zinc-300 dark:text-zinc-600 mx-auto mb-2 h-10 w-10' />
							<h3 className='mb-1 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
								No collections found
							</h3>
							<p className='text-xs text-zinc-400'>
								Try broadening your search query or filters.
							</p>
						</div>
					)}

					{/* Render list grid */}
					<div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{activeTab === 'workflows' &&
							workflows?.map((wf) => {
								const displayColor = wf.color || '#C4EE3D';
								return (
									<div
										key={wf.id}
										className='group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 dark:border-zinc-800/80 dark:bg-zinc-950 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:hover:border-primary-400/50 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]'
										onClick={() => setPreviewId(wf.id)}>
										<div className='mb-3.5 flex items-start justify-between'>
											<div className='flex items-center gap-3 truncate'>
												<div
													style={{ backgroundColor: `${displayColor}12` }}
													className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 group-hover:scale-105 transition-transform duration-300'>
													<Workflow
														className='h-5 w-5'
														style={{ color: displayColor }}
													/>
												</div>
												<div className='truncate space-y-0.5'>
													<h4 className='truncate text-[13px] font-black text-slate-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400 leading-snug'>
														{wf.name}
													</h4>
													<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase'>
														{wf.category}
													</span>
												</div>
											</div>
											<button className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors'>
												<span className='text-sm leading-none font-bold'>
													...
												</span>
											</button>
										</div>
										<p className='mb-4 line-clamp-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
											{wf.description}
										</p>
										<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
											<div className='flex flex-wrap gap-1'>
												{wf.required_credentials
													?.slice(0, 1)
													.map((cred: string) => {
														const style = getCredentialStyle(cred);
														return (
															<span
																key={cred}
																className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${style.bg} ${style.border} ${style.text}`}>
																{cred}
															</span>
														);
													})}
												{(!wf.required_credentials ||
													wf.required_credentials.length === 0) && (
													<span className='rounded-full border border-zinc-200/60 bg-zinc-50/50 px-2.5 py-0.5 text-[9px] font-semibold text-zinc-450 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-500'>
														No creds
													</span>
												)}
												{wf.required_credentials &&
													wf.required_credentials.length > 1 && (
														<span className='rounded-full border border-zinc-200/60 bg-zinc-50/50 px-2 py-0.5 text-[9px] font-bold text-zinc-450 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-500'>
															+{wf.required_credentials.length - 1}
														</span>
													)}
											</div>
											<div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
												<Users className='h-3.5 w-3.5 text-slate-400/80 dark:text-zinc-650' />
												<span>{formatUsageCount(wf.usage_count)}</span>
											</div>
										</div>
									</div>
								);
							})}

						{activeTab === 'agents' &&
							agents?.map((agent) => {
								const displayColor = agent.color || '#C4EE3D';
								return (
									<div
										key={agent.id}
										className='group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 dark:border-zinc-800/80 dark:bg-zinc-950 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:hover:border-primary-400/50 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]'
										onClick={() => setPreviewId(agent.id)}>
										<div className='mb-3.5 flex items-start justify-between'>
											<div className='flex items-center gap-3 truncate'>
												<div
													style={{ backgroundColor: `${displayColor}12` }}
													className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 group-hover:scale-105 transition-transform duration-300'>
													<Cpu
														className='h-5 w-5'
														style={{ color: displayColor }}
													/>
												</div>
												<div className='truncate space-y-0.5'>
													<h4 className='truncate text-[13px] font-black text-slate-900 transition-colors group-hover:text-primary-600 dark:text-zinc-50 dark:group-hover:text-primary-400 leading-snug'>
														{agent.name}
													</h4>
													<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase'>
														{agent.category}
													</span>
												</div>
											</div>
											<button className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors'>
												<span className='text-sm leading-none font-bold'>
													...
												</span>
											</button>
										</div>
										<p className='mb-4 line-clamp-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
											{agent.description}
										</p>
										<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
											<span className='max-w-[100px] truncate rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[9px] font-bold text-primary-700 dark:border-primary-500/20 dark:bg-primary-950/20 dark:text-primary-400'>
												{agent.llm_model}
											</span>
											<div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
												<Users className='h-3.5 w-3.5 text-slate-400/80 dark:text-zinc-650' />
												<span>{formatUsageCount(agent.usage_count)}</span>
											</div>
										</div>
									</div>
								);
							})}

						{activeTab === 'collections' &&
							collections?.map((coll) => {
								const displayColor = coll.color || '#F59E0B';
								return (
									<div
										key={coll.id}
										className='group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 dark:border-zinc-800/80 dark:bg-zinc-950 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.06)] dark:hover:border-amber-400/50 dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.5)]'
										onClick={() => setPreviewId(coll.id)}>
										<div className='mb-3.5 flex items-start justify-between'>
											<div className='flex items-center gap-3 truncate'>
												<div
													style={{ backgroundColor: `${displayColor}12` }}
													className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-100/50 dark:border-zinc-800/50 group-hover:scale-105 transition-transform duration-300'>
													<Layers
														className='h-5 w-5'
														style={{ color: displayColor }}
													/>
												</div>
												<div className='truncate space-y-0.5'>
													<h4 className='truncate text-[13px] font-black text-slate-900 transition-colors group-hover:text-amber-600 dark:text-zinc-50 dark:group-hover:text-amber-400 leading-snug'>
														{coll.name}
													</h4>
													<span className='block truncate text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-zinc-500 uppercase'>
														Collection Bundle
													</span>
												</div>
											</div>
											<button className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition-colors'>
												<span className='text-sm leading-none font-bold'>
													...
												</span>
											</button>
										</div>
										<p className='mb-4 line-clamp-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400'>
											{coll.description}
										</p>
										<div className='mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3.5 dark:border-zinc-900/60'>
											<span className='max-w-[100px] truncate rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400'>
												{coll.items?.length || 0} items
											</span>
											<div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-zinc-500'>
												<Users className='h-3.5 w-3.5 text-slate-400/80 dark:text-zinc-650' />
												<span>{formatUsageCount(coll.usage_count)}</span>
											</div>
										</div>
									</div>
								);
							})}
					</div>
				</div>
			</div>

			{/* Modal Preview Detail Slide-over */}
			<AnimatePresence>
				{previewId && (
					<div className='fixed inset-0 z-50 flex justify-end'>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.5 }}
							exit={{ opacity: 0 }}
							onClick={() => {
								if (!deployingCollectionId) setPreviewId(null);
							}}
							className='absolute inset-0 bg-black/60 backdrop-blur-xs'
						/>
						{/* Slide-over Card */}
						<motion.div
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'spring', damping: 25, stiffness: 220 }}
							className='relative z-10 flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950'>
							{/* Close trigger button */}
							{!deployingCollectionId && (
								<button
									onClick={() => setPreviewId(null)}
									className='absolute top-4 right-4 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900'>
									<X className='h-5 w-5' />
								</button>
							)}

							{/* Active tab details content */}
							<div className='flex-1 overflow-y-auto p-6 md:p-8'>
								{/* Workflow Template Preview Details */}
								{activeTab === 'workflows' && (
									<>
										{!wfDetail ? (
											<div className='flex h-full flex-col items-center justify-center gap-2'>
												<Loader2 className='h-6 w-6 animate-spin text-primary-500' />
												<span className='text-xs text-zinc-500'>
													Fetching template metadata...
												</span>
											</div>
										) : (
											<div className='flex flex-col gap-6'>
												{/* Header info */}
												<div className='flex items-center gap-4'>
													<div
														style={{
															backgroundColor: `${wfDetail.color}15`,
														}}
														className='flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800'>
														<Workflow
															className='h-6 w-6'
															style={{
																color: wfDetail.color ?? undefined,
															}}
														/>
													</div>
													<div>
														<h2 className='text-lg font-bold text-zinc-800 dark:text-zinc-100'>
															{wfDetail.name}
														</h2>
														<div className='mt-1 flex items-center gap-2'>
															<span className='text-xs text-zinc-400 capitalize'>
																{wfDetail.category}
															</span>
															<span className='text-zinc-300'>•</span>
															<span className='text-[10px] text-zinc-400'>
																{wfDetail.usage_count || 0} active
																deployments
															</span>
														</div>
													</div>
												</div>

												{/* Description */}
												<div>
													<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														About this Template
													</h3>
													<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-400'>
														{wfDetail.description ||
															'Pre-configured node layout to easily connect tools and run task sequences automatically.'}
													</p>
												</div>

												{/* Required Credentials */}
												<div>
													<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														Required Credentials
													</h3>
													<div className='flex flex-wrap gap-2'>
														{wfDetail.required_credentials?.map(
															(cred: any) => {
																const name =
																	typeof cred === 'string'
																		? cred
																		: cred.service_name || '';
																const style =
																	getCredentialStyle(name);
																return (
																	<div
																		key={name}
																		className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold ${style.bg} ${style.border} ${style.text}`}>
																		<div className='h-1.5 w-1.5 rounded-full bg-current' />
																		{name.toUpperCase()}
																	</div>
																);
															},
														)}
														{(!wfDetail.required_credentials ||
															wfDetail.required_credentials.length ===
																0) && (
															<div className='text-xs text-zinc-500 italic'>
																No external credentials required.
																Out-of-the-box system utilities.
															</div>
														)}
													</div>
												</div>

												{/* Instructions */}
												{wfDetail.instructions && (
													<div>
														<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
															Setup Instructions
														</h3>
														<div className='rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed whitespace-pre-line text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'>
															{wfDetail.instructions}
														</div>
													</div>
												)}

												{/* Visual Graph Preview */}
												<div>
													<h3 className='mb-3 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														Workflow Graph Preview
													</h3>
													<GraphPreview
														nodes={
															(wfDetail.workflow_json
																?.nodes as any[]) || []
														}
														edges={
															(wfDetail.workflow_json
																?.edges as any[]) || []
														}
													/>
												</div>

												{/* Use Template Action */}
												<div className='mt-4 border-t border-zinc-200 pt-6 dark:border-zinc-800'>
													<Button
														color='violet'
														variant='solid'
														dimension='lg'
														className='flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg transition-all hover:shadow-xl'
														isLoading={useWfMutation.isPending}
														onClick={async () => {
															if (!activeWorkspaceId) return;
															try {
																const res =
																	await useWfMutation.mutateAsync(
																		{ templateId: wfDetail.id },
																	);
																setPreviewId(null);
																navigate(
																	`/editor/edit-workflow/${activeWorkspaceId}/${res.workflow_id}`,
																);
															} catch (err) {}
														}}>
														{!useWfMutation.isPending && (
															<Play className='h-4 w-4 fill-current' />
														)}
														Use Template
													</Button>
												</div>
											</div>
										)}
									</>
								)}

								{/* Agent Template Preview Details */}
								{activeTab === 'agents' && (
									<>
										{!agentDetail ? (
											<div className='flex h-full flex-col items-center justify-center gap-2'>
												<Loader2 className='h-6 w-6 animate-spin text-primary-500' />
												<span className='text-xs text-zinc-500'>
													Fetching agent metadata...
												</span>
											</div>
										) : (
											<div className='flex flex-col gap-6'>
												{/* Header info */}
												<div className='flex items-center gap-4'>
													<div
														style={{
															backgroundColor: `${agentDetail.color}15`,
														}}
														className='flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800'>
														<Cpu
															className='h-6 w-6'
															style={{
																color:
																	agentDetail.color ?? undefined,
															}}
														/>
													</div>
													<div>
														<h2 className='text-lg font-bold text-zinc-800 dark:text-zinc-100'>
															{agentDetail.name}
														</h2>
														<div className='mt-1 flex items-center gap-2'>
															<span className='text-xs text-zinc-400 capitalize'>
																{agentDetail.category}
															</span>
															<span className='text-zinc-300'>•</span>
															<span className='text-[10px] text-zinc-400'>
																{agentDetail.usage_count || 0}{' '}
																deploys
															</span>
														</div>
													</div>
												</div>

												{/* Description */}
												<div>
													<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														Description
													</h3>
													<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-400'>
														{agentDetail.description ||
															'Pre-configured autonomous conversational AI agent, with full system instructions, system prompts, and pre-packaged tools.'}
													</p>
												</div>

												{/* Model specifications */}
												<div className='grid grid-cols-2 gap-4'>
													<div className='rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900'>
														<div className='mb-1 text-[10px] font-bold text-zinc-400 uppercase'>
															Model Provider
														</div>
														<div className='text-xs font-bold text-zinc-800 capitalize dark:text-zinc-200'>
															{agentDetail.llm_provider ||
																'Anthropic'}
														</div>
													</div>
													<div className='rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900'>
														<div className='mb-1 text-[10px] font-bold text-zinc-400 uppercase'>
															LLM Model
														</div>
														<div className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
															{agentDetail.llm_model}
														</div>
													</div>
												</div>

												{/* LLM Settings */}
												{agentDetail.llm_settings && (
													<div>
														<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
															Agent Parameters
														</h3>
														<div className='grid grid-cols-4 gap-2.5'>
															<div className='rounded-lg border border-zinc-100 bg-white p-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/40'>
																<div className='mb-0.5 text-[9px] font-bold text-zinc-400 uppercase'>
																	Temp
																</div>
																<div className='text-xs font-bold text-zinc-800 dark:text-zinc-100'>
																	{
																		agentDetail.llm_settings
																			.temperature
																	}
																</div>
															</div>
															<div className='rounded-lg border border-zinc-100 bg-white p-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/40'>
																<div className='mb-0.5 text-[9px] font-bold text-zinc-400 uppercase'>
																	Max Tokens
																</div>
																<div className='text-xs font-bold text-zinc-800 dark:text-zinc-100'>
																	{
																		agentDetail.llm_settings
																			.max_tokens
																	}
																</div>
															</div>
															<div className='rounded-lg border border-zinc-100 bg-white p-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/40'>
																<div className='mb-0.5 text-[9px] font-bold text-zinc-400 uppercase'>
																	Max Steps
																</div>
																<div className='text-xs font-bold text-zinc-800 dark:text-zinc-100'>
																	{
																		agentDetail.llm_settings
																			.max_steps
																	}
																</div>
															</div>
															<div className='rounded-lg border border-zinc-100 bg-white p-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/40'>
																<div className='mb-0.5 text-[9px] font-bold text-zinc-400 uppercase'>
																	Timeout
																</div>
																<div className='text-xs font-bold text-zinc-800 dark:text-zinc-100'>
																	{
																		agentDetail.llm_settings
																			.timeout_seconds
																	}
																	s
																</div>
															</div>
														</div>
													</div>
												)}

												{/* Pre-packaged tools */}
												{agentDetail.tool_configs &&
													agentDetail.tool_configs.length > 0 && (
														<div>
															<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
																Available System Tools
															</h3>
															<div className='flex flex-col gap-2'>
																{agentDetail.tool_configs.map(
																	(t, idx) => (
																		<div
																			key={idx}
																			className='flex gap-2.5 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900'>
																			<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded border border-primary-100 bg-primary-50 text-primary-500 dark:border-primary-900 dark:bg-primary-950/20'>
																				<Settings className='animate-spin-slow h-4 w-4' />
																			</div>
																			<div>
																				<div className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																					{t.name}
																				</div>
																				<div className='mt-0.5 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
																					{t.description}
																				</div>
																			</div>
																		</div>
																	),
																)}
															</div>
														</div>
													)}

												{/* System Prompt */}
												{agentDetail.system_prompt && (
													<div>
														<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
															System Instructions
														</h3>
														<div className='max-h-[120px] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-900/5 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-zinc-700 select-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'>
															{agentDetail.system_prompt}
														</div>
													</div>
												)}

												{/* Interactive chat simulation */}
												<div>
													<h3 className='mb-3.5 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														Interactive Chat Simulator
													</h3>
													<AgentChatMock
														key={agentDetail.id}
														agentName={agentDetail.name}
														systemPrompt={
															agentDetail.system_prompt || ''
														}
														exampleConversations={
															agentDetail.example_conversations
														}
													/>
												</div>

												{/* Deploy Agent action */}
												<div className='mt-4 border-t border-zinc-200 pt-6 dark:border-zinc-800'>
													<Button
														color='primary'
														variant='solid'
														dimension='lg'
														className='flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg transition-all hover:shadow-xl'
														isLoading={deployAgentMutation.isPending}
														onClick={async () => {
															if (!activeWorkspaceId) return;
															try {
																const res =
																	await deployAgentMutation.mutateAsync(
																		agentDetail.id,
																	);
																setPreviewId(null);
																navigate(
																	`/agent/edit/${res.agent_id}`,
																);
															} catch (err) {}
														}}>
														{!deployAgentMutation.isPending && (
															<Play className='h-4 w-4 fill-current' />
														)}
														Deploy Agent
													</Button>
												</div>
											</div>
										)}
									</>
								)}

								{/* Template Collection Preview Details */}
								{activeTab === 'collections' && (
									<>
										{!collectionDetail ? (
											<div className='flex h-full flex-col items-center justify-center gap-2'>
												<Loader2 className='h-6 w-6 animate-spin text-primary-500' />
												<span className='text-xs text-zinc-500'>
													Fetching collection stack...
												</span>
											</div>
										) : (
											<div className='flex flex-col gap-6'>
												{/* Header info */}
												<div className='flex items-center gap-4'>
													<div
														style={{
															backgroundColor: `${collectionDetail.color}15`,
														}}
														className='flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800'>
														<Layers
															className='h-6 w-6'
															style={{
																color:
																	collectionDetail.color ??
																	undefined,
															}}
														/>
													</div>
													<div>
														<h2 className='text-lg font-bold text-zinc-800 dark:text-zinc-100'>
															{collectionDetail.name}
														</h2>
														<div className='mt-1 flex items-center gap-2'>
															<span className='text-xs text-zinc-400'>
																Template Stack
															</span>
															<span className='text-zinc-300'>•</span>
															<span className='text-[10px] text-zinc-400'>
																{collectionDetail.items.length}{' '}
																assets included
															</span>
														</div>
													</div>
												</div>

												{/* Description */}
												<div>
													<h3 className='mb-2 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														About this Bundle
													</h3>
													<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-400'>
														{collectionDetail.description}
													</p>
												</div>

												{/* List of items included */}
												<div>
													<h3 className='mb-3 text-xs font-bold tracking-wider text-zinc-800 uppercase dark:text-zinc-200'>
														Included Assets (
														{collectionDetail.items.length})
													</h3>

													{/* Batch progress overlay */}
													{deployingCollectionId ===
													collectionDetail.id ? (
														<div className='mb-4 rounded-xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900 dark:bg-amber-950/20'>
															<div className='mb-4 flex items-center justify-between'>
																<div className='flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300'>
																	<Loader2 className='h-4 w-4 animate-spin text-amber-500' />
																	Batch Deploying Stack Assets...
																</div>
																<div className='text-xs font-bold text-amber-700 dark:text-amber-400'>
																	{
																		deployProgress.filter(
																			(p) =>
																				p.status ===
																					'success' ||
																				p.status ===
																					'failed',
																		).length
																	}{' '}
																	/ {deployProgress.length}
																</div>
															</div>
															<div className='flex flex-col gap-2.5'>
																{deployProgress.map((item, idx) => (
																	<div
																		key={idx}
																		className='flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950'>
																		<div className='flex items-center gap-2'>
																			{item.type ===
																			'agent' ? (
																				<Cpu className='h-3.5 w-3.5 text-primary-500' />
																			) : (
																				<Workflow className='h-3.5 w-3.5 text-primary-500' />
																			)}
																			<span className='font-semibold text-zinc-800 dark:text-zinc-200'>
																				{item.name}
																			</span>
																			<span className='rounded border border-zinc-100 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400 capitalize dark:border-zinc-800 dark:bg-zinc-900'>
																				{item.type}
																			</span>
																		</div>
																		<div className='flex items-center gap-2'>
																			{item.status ===
																				'pending' && (
																				<span className='text-[10px] font-medium text-zinc-400'>
																					Queued
																				</span>
																			)}
																			{item.status ===
																				'loading' && (
																				<Loader2 className='h-3.5 w-3.5 animate-spin text-amber-500' />
																			)}
																			{item.status ===
																				'success' && (
																				<div className='flex items-center gap-1.5'>
																					<span className='flex items-center gap-0.5 text-[10px] font-bold text-emerald-500'>
																						<Check className='h-3 w-3' />{' '}
																						Deployed
																					</span>
																					{item.link && (
																						<Link
																							to={
																								item.link
																							}
																							target='_blank'
																							className='rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900'>
																							<ExternalLink className='h-3 w-3' />
																						</Link>
																					)}
																				</div>
																			)}
																			{item.status ===
																				'failed' && (
																				<span className='text-[10px] font-bold text-red-500'>
																					Error
																				</span>
																			)}
																		</div>
																	</div>
																))}
															</div>

															{/* Done button */}
															{deployProgress.every(
																(p) =>
																	p.status === 'success' ||
																	p.status === 'failed',
															) && (
																<div className='mt-5 text-center'>
																	<Button
																		color='amber'
																		variant='solid'
																		className='w-full animate-pulse text-xs font-bold'
																		onClick={() => {
																			setDeployingCollectionId(
																				null,
																			);
																			setPreviewId(null);
																			navigate('/workflows');
																		}}>
																		Go to Dashboard
																	</Button>
																</div>
															)}
														</div>
													) : (
														<div className='flex flex-col gap-3'>
															{collectionDetail.items.map(
																(item, idx) => {
																	let name = 'Asset';
																	let color = '#7C3AED';
																	let desc = '';
																	if (item.type === 'agent') {
																		const agentObj =
																			agents?.find(
																				(a) =>
																					a.id ===
																					item.template_id,
																			);
																		name =
																			agentObj?.name ||
																			'Agent';
																		color =
																			agentObj?.color ||
																			'#3B82F6';
																		desc =
																			agentObj?.description ||
																			'';
																	} else {
																		const wfObj =
																			workflows?.find(
																				(w) =>
																					w.id ===
																					item.template_id,
																			);
																		name =
																			wfObj?.name ||
																			'Workflow';
																		color =
																			wfObj?.color ||
																			'#10B981';
																		desc =
																			wfObj?.description ||
																			'';
																	}

																	return (
																		<div
																			key={idx}
																			className='flex gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'>
																			<div
																				style={{
																					backgroundColor: `${color}15`,
																				}}
																				className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-100 dark:border-zinc-800'>
																				{item.type ===
																				'agent' ? (
																					<Cpu
																						className='h-5 w-5'
																						style={{
																							color,
																						}}
																					/>
																				) : (
																					<Workflow
																						className='h-5 w-5'
																						style={{
																							color,
																						}}
																					/>
																				)}
																			</div>
																			<div className='flex-1'>
																				<div className='flex items-center gap-2.5'>
																					<h4 className='text-xs font-bold text-zinc-800 dark:text-zinc-200'>
																						{name}
																					</h4>
																					<span className='rounded border border-zinc-200/40 bg-zinc-50 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 uppercase dark:bg-zinc-950'>
																						{item.type}
																					</span>
																				</div>
																				<p className='mt-1 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400'>
																					{desc}
																				</p>
																				{item.note && (
																					<div className='mt-2.5 rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-[10px] text-zinc-600 italic dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'>
																						Note:{' '}
																						{item.note}
																					</div>
																				)}
																			</div>
																		</div>
																	);
																},
															)}
														</div>
													)}
												</div>

												{/* Deploy Collection action */}
												{!deployingCollectionId && (
													<div className='mt-4 border-t border-zinc-200 pt-6 dark:border-zinc-800'>
														<Button
															color='amber'
															variant='solid'
															dimension='lg'
															className='flex w-full cursor-pointer items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg transition-all hover:shadow-xl'
															onClick={() =>
																handleDeployCollection(
																	collectionDetail,
																)
															}>
															<Play className='h-4 w-4 fill-current' />
															Deploy Collection
														</Button>
													</div>
												)}
											</div>
										)}
									</>
								)}
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</Container>
	);
};

export default TemplatesCatalogPage;
