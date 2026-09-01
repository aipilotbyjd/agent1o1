import { FC, HTMLAttributes } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';

type INewProjectButtonPartialProps = HTMLAttributes<HTMLButtonElement>;
const NewProjectButtonPartial: FC<INewProjectButtonPartialProps> = (props) => {
	return (
		<button
			aria-label='New Project'
			type='button'
			className={classNames(
				'group flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-500 p-4 hover:border-zinc-300 hover:dark:border-zinc-800',
			)}
			{...props}>
			<Icon
				icon='PlusSign'
				size='text-2xl'
				className={classNames(
					'text-zinc-500 group-hover:text-zinc-300 group-hover:dark:text-zinc-800',
				)}
			/>
		</button>
	);
};

export default NewProjectButtonPartial;
