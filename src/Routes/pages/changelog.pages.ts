import { TPage } from './types';

/**
 * The changelog is public on purpose: it works signed out (and is what the
 * feed links to), and shows members more once they are signed in.
 */
export const changelog: TPage = {
	id: 'changelog',
	to: '/changelog',
	text: "What's new",
	icon: 'Megaphone01',
	subPages: {
		entry: {
			id: 'changelogEntry',
			to: '/changelog/:slug',
			text: 'Changelog entry',
			icon: 'Megaphone01',
		},
	},
};
