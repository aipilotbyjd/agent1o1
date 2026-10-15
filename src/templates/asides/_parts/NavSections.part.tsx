import { FC, Fragment } from 'react';
import { NavCollapse, NavItem, NavSeparator, NavTitle } from '@/components/layout/Navigation/Nav';
import { TNavEntry, TNavSection } from '@/Routes/navigation';
import useResolvePath from '@/hooks/useResolvePath';
import { useBrand } from '@/context/brand';
import pages from '@/Routes/pages';
import ApprovalsBadgePart from '@/templates/asides/_parts/ApprovalsBadge.part';

const NavEntry: FC<{ entry: TNavEntry; resolvePath: (to: string) => string }> = ({
	entry,
	resolvePath,
}) => {
	const brand = useBrand();
	const { collapsible, subPages, end, defaultOpen, ...page } = entry;
	const text = page.id === pages.workspace.subPages!.assistant.id ? brand.name : page.text;

	if (collapsible && subPages) {
		return (
			<NavCollapse {...page} to={resolvePath(page.to)} defaultOpen={defaultOpen}>
				{Object.values(subPages).map((child) => (
					<NavItem key={child.id} {...child} to={resolvePath(child.to)} />
				))}
			</NavCollapse>
		);
	}

	return (
		<NavItem {...page} text={text} to={resolvePath(page.to)} end={end}>
			{page.id === pages.workspace.subPages!.approvals.id && <ApprovalsBadgePart />}
		</NavItem>
	);
};

/**
 * Renders a sidebar from `@/Routes/navigation`. Both asides use this, so adding
 * a page to a sidebar never means touching a template.
 */
const NavSectionsPart: FC<{ sections: TNavSection[] }> = ({ sections }) => {
	const { resolvePath } = useResolvePath();

	return (
		<>
			{sections.map((section, index) => (
				<Fragment key={section.title ?? `section-${index}`}>
					{section.divider && <NavSeparator />}
					{section.title && (
						<NavTitle className={index > 0 ? 'mt-3' : undefined}>
							{section.title}
						</NavTitle>
					)}
					{section.items.map((entry) => (
						<NavEntry key={entry.id} entry={entry} resolvePath={resolvePath} />
					))}
				</Fragment>
			))}
		</>
	);
};

export default NavSectionsPart;
