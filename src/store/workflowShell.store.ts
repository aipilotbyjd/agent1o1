import { create } from 'zustand';

type TWorkspace = {
	id: string;
	name: string;
	description: string;
	initials: string;
	color: string;
};

type TWorkflowShellState = {
	sidebarCollapsed: boolean;
	mobileSidebarOpen: boolean;
	activeWorkspaceView:
		| 'dashboard'
		| 'agents'
		| 'skills'
		| 'artifacts'
		| 'apps'
		| 'history'
		| 'workflows'
		| 'automations'
		| 'integrations'
		| 'analytics'
		| 'team'
		| 'settings'
		| 'editor';
	isCreateFlowModalOpen: boolean;
	isGovModalOpen: boolean;
	govModalTab: string;
	setActiveWorkspaceView: (view: TWorkflowShellState['activeWorkspaceView']) => void;
	setCreateFlowModalOpen: (open: boolean) => void;
	setGovModalOpen: (open: boolean) => void;
	setGovModalTab: (tab: string) => void;
	closeMobileSidebar: () => void;
	toggleMobileSidebar: () => void;
	toggleSidebar: () => void;
	// Workspaces state
	activeWorkspaceId: string;
	setActiveWorkspaceId: (id: string) => void;
	workspaces: TWorkspace[];
	addWorkspace: (ws: TWorkspace) => void;
	updateWorkspace: (id: string, name: string) => void;
	deleteWorkspace: (id: string) => void;
};

export const useWorkflowShellStore = create<TWorkflowShellState>((set) => ({
	sidebarCollapsed: false,
	mobileSidebarOpen: false,
	activeWorkspaceView: 'workflows',
	isCreateFlowModalOpen: false,
	isGovModalOpen: false,
	govModalTab: 'versions',
	setActiveWorkspaceView: (view) => set({ activeWorkspaceView: view }),
	setCreateFlowModalOpen: (open) => set({ isCreateFlowModalOpen: open }),
	setGovModalOpen: (open) => set({ isGovModalOpen: open }),
	setGovModalTab: (tab) => set({ govModalTab: tab }),
	closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
	toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
	toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

	// Workspaces
	activeWorkspaceId: '',
	setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
	workspaces: [
		{
			id: 'amaan-studio',
			name: 'Amaan Studio',
			description: 'Production workspace',
			initials: 'AS',
			color: 'bg-primary-400',
		},
		{
			id: 'personal',
			name: 'Personal Space',
			description: 'Individual playground',
			initials: 'PS',
			color: 'bg-emerald-600',
		},
		{
			id: 'ai-lab',
			name: 'AI Research Lab',
			description: 'LLM agents and prompts',
			initials: 'AL',
			color: 'bg-fuchsia-600',
		},
	],
	addWorkspace: (ws) => set((state) => ({ workspaces: [...state.workspaces, ws] })),
	updateWorkspace: (id, name) => set((state) => ({
		workspaces: state.workspaces.map((ws) => ws.id === id ? { ...ws, name } : ws)
	})),
	deleteWorkspace: (id) => set((state) => ({
		workspaces: state.workspaces.filter((ws) => ws.id !== id)
	})),
}));
