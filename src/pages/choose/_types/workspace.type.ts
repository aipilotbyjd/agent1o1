export interface ITeammate {
	name: string;
	initials: string;
	color: string;
}

export interface IWorkspaceCard {
	id: string;
	name: string;
	tier: 'Free' | 'Pro' | 'Enterprise';
	role: 'Owner' | 'Admin' | 'Member';
	activeFlowsCount: number;
	totalNodes: number;
	activeAgentsCount: number;
	members: ITeammate[];
	gradientFrom: string;
	gradientTo: string;
	accentColor: string;
	lastActive: string;
	hasActiveRuns: boolean;
}
