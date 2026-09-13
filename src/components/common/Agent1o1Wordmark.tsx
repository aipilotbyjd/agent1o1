import { FC } from 'react';

interface IProps {
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

export const Agent1o1Wordmark: FC<IProps> = ({ className = '', size = 'md' }) => {
	const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl';
	return (
		<div
			className={`inline-flex items-center justify-center gap-0.5 font-bold tracking-tight select-none ${textSize} ${className}`}>
			<span className='text-zinc-400'>agent</span>
			<span className='text-zinc-800 font-extrabold'>1o1</span>
		</div>
	);
};

export default Agent1o1Wordmark;
