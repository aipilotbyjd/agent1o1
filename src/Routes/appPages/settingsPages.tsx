import { lazy } from 'react';
import pages, { TPages } from '@/Routes/pages';

const settingsPages = pages.workspaceSettings.subPages as TPages;

// ── Billing ───────────────────────────────────────────────────────────────────
const BillingLayout = lazy(() => import('@/pages/settings/Billing/_layouts/Billing.layout'));
const BillingOverviewPage = lazy(() => import('@/pages/settings/Billing/index.page'));
const BillingCreditsPage = lazy(() => import('@/pages/settings/Billing/credits.page'));
const BillingHistoryPage = lazy(() => import('@/pages/settings/Billing/history.page'));

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * Workspace settings (`/:workspaceId/settings/...`), spread into the core app
 * routes so every screen keeps the aside and wrapper.
 *
 * Mirrors `settingsPages.tsx` from the old frontend, with one deliberate
 * difference: there, `/settings/billing` redirected its index to
 * `/settings/plan?tab=billing` because the Plan screen hosted the billing tab.
 * That screen is not ported yet, so the index renders `index.page` - the
 * overview the old app shipped but never routed to - and the `credits` /
 * `history` children stay exactly as they were.
 */
const SettingsPages = [
	// /:workspaceId/settings/billing
	{
		path: settingsPages.billing.to,
		element: <BillingLayout />,
		children: [
			{ index: true, element: <BillingOverviewPage /> },
			{
				path: 'credits',
				element: <BillingCreditsPage />,
			},
			{
				path: 'history',
				element: <BillingHistoryPage />,
			},
		],
	},
];

export default SettingsPages;
