import type { TBrand } from '@/types/brand.type';

/**
 * The brand shown before `GET /app-config` answers (and if it fails).
 * The only place in the frontend allowed to spell the assistant's name —
 * the backend config is the source of truth and replaces this at runtime.
 * See docs/ASSISTANT_BRANDING_PLAN.md in the API repo.
 */
export const DEFAULT_BRAND: TBrand = {
	name: 'Orb',
	tagline: 'Your personal AI agent',
	description: 'Reads your apps, preps your day and handles your inbox.',
	emoji: '🔮',
	color: '#7C3AED',
	icon_url: '',
	avatar_url: '',
	features: {
		daily: 'Orb Daily',
		inbox: 'Orb Inbox',
		meeting_prep: 'Orb Prep',
		situations: 'Situations',
	},
	email: '',
};
