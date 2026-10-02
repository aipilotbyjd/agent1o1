import { FC, Fragment } from 'react';
import { NavCollapse, NavItem, NavTitle } from '@/components/layout/Navigation/Nav';
import { TNavEntry, TNavSection } from '@/Routes/navigation';
import useResolvePath from '@/hooks/useResolvePath';

const NavEntry: FC<{ entry: TNavEntry; resolvePath: (to: string) => string }> = ({
	entry,
	resolvePath,
}) => {
	const { collapsible, subPages, end, ...page } = entry;

	if (collapsible && subPages) {
		return (
			<NavCollapse {...page} to={resolvePath(page.to)}>
				{Object.values(subPages).map((child) => (
					<NavItem key={child.id} {...child} to={resolvePath(child.to)} />
				))}
			</NavCollapse>
		);
	}

	return <NavItem {...page} to={resolvePath(page.to)} end={end} />;
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
					{section.title && <NavTitle>{section.title}</NavTitle>}
					{section.items.map((entry) => (
						<NavEntry key={entry.id} entry={entry} resolvePath={resolvePath} />
					))}
				</Fragment>
			))}
		</>
	);
};

export default NavSectionsPart;
