import type { ReactNode } from 'react';

type TProps = {
	title: ReactNode;
	description?: ReactNode;
	align?: 'left' | 'center';
};

/** The title and one line of help every step opens with. */
const StepHeading = ({ title, description, align = 'left' }: TProps) => (
	<div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
		<h1 className='text-3xl font-black tracking-tight text-balance sm:text-4xl'>{title}</h1>
		{description && (
			<p className='mt-3 text-base font-medium text-zinc-600 dark:text-zinc-400'>
				{description}
			</p>
		)}
	</div>
);

export default StepHeading;
