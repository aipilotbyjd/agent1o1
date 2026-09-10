import type { ComponentType, SVGProps } from 'react';
import * as OutlineIcons from '@heroicons/react/24/outline';

type THeroIcon = ComponentType<SVGProps<SVGSVGElement> & { title?: string }>;

const ICONS = OutlineIcons as unknown as Record<string, THeroIcon>;

const toIconName = (name: string) =>
	name
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('')
		.concat('Icon');

type TNodeIconProps = {
	icon?: string;
	size?: number;
	className?: string;
};

const NodeIcon = ({ icon, size = 18, className }: TNodeIconProps) => {
	const value = (icon ?? '').trim();

	if (value) {
		const Icon = ICONS[toIconName(value)];
		if (Icon) return <Icon width={size} height={size} className={className} aria-hidden />;
	}

	return <span className={className}>{value || '•'}</span>;
};

export default NodeIcon;
