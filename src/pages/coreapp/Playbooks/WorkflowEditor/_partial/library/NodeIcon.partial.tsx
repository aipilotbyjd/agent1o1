import Icon from '@/components/icon/Icon';

type TNodeIconProps = {
	icon?: string;
	size?: number;
	className?: string;
};

/** A node's Hugeicon by name, or its short initials when it has no icon. */
const NodeIcon = ({ icon, size = 18, className }: TNodeIconProps) => {
	const value = (icon ?? '').trim();

	if (value.length > 2) {
		return <Icon icon={value} className={className} style={{ fontSize: size }} aria-hidden />;
	}

	return <span className={className}>{value || '•'}</span>;
};

export default NodeIcon;
