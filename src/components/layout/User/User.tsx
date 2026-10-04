import { FC, HTMLAttributes, ReactNode, useId, useState } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import useRoundedSize from '@/hooks/useRoundedSize';
import useAsideStatus from '@/hooks/useAsideStatus';
import getFirstLetterUtil from '@/utils/getFirstLetter.util';

interface IUserProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
	src?: string;
	name?: string;
	namePrefix?: ReactNode;
	nameSuffix?: ReactNode;
	position?: string;
	suffix?: ReactNode;
	isLoading?: boolean;
}
const User: FC<IUserProps> = (props) => {
	const {
		children,
		className,
		name = 'Anonymous',
		position,
		src,
		namePrefix,
		nameSuffix,
		suffix,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		isLoading = false,
		...rest
	} = props;

	const { asideStatus } = useAsideStatus();

	const id = useId();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const { roundedCustom } = useRoundedSize('rounded-xl');

	return (
		<div data-component-name='User' className={classNames('relative', className)} {...rest}>
			<div
				className={classNames(
					'bg-bg-card dark:bg-bg-card border-border-main mb-2 min-w-[4.5rem] overflow-hidden rounded-xl border',
					{
						'ltr:translate-x-[-0.625rem] rtl:translate-x-[0.625rem]': !asideStatus,
					},
					'transition-all duration-300 ease-in-out',
				)}>
				<div
					className={classNames(
						'flex cursor-pointer gap-4 p-3',
						'text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100',
						'transition-all duration-300 ease-in-out',
					)}
					onClick={() => setIsOpen((prevState) => !prevState)}
					role='presentation'>
					{src ? (
						<img
							src={src}
							alt='Avatar'
							className={classNames('bg-secondary-500/25 h-12 w-12 object-cover', [
								`${roundedCustom(-2)}`,
							])}
						/>
					) : (
						<div
							className={classNames(
								'bg-primary-100/50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 flex aspect-square h-12 w-12 items-center justify-center font-bold',
								[`${roundedCustom(-2)}`],
							)}>
							{name && getFirstLetterUtil(name)}
						</div>
					)}
					<div className='flex basis-full flex-wrap items-center truncate'>
						<div className='flex basis-full items-center gap-2 truncate'>
							{namePrefix && <span>{namePrefix}</span>}
							<span className='truncate font-bold text-slate-800 dark:text-white'>{name}</span>
							{nameSuffix && <span>{nameSuffix}</span>}
						</div>
						{position && (
							<div className='basis-full truncate text-xs text-slate-400 first-letter:uppercase dark:text-zinc-500'>
								{position}
							</div>
						)}
					</div>
					{suffix && <div className='flex items-center'>{suffix}</div>}
				</div>
				<AnimatePresence>
					{isOpen && (
						<motion.ul
							key={id}
							initial='collapsed'
							animate='open'
							exit='collapsed'
							variants={{
								open: { height: 'auto' },
								collapsed: { height: 0 },
							}}
							transition={{ duration: 0.3 }}
							// @ts-ignore
							className='px-3'>
							{children}
						</motion.ul>
					)}
				</AnimatePresence>
			</div>
			<span
				className={classNames('absolute end-4 top-1/2 flex h-2.5 w-2.5 -translate-y-1/2', {
					hidden: !asideStatus,
				})}>
				<span className='bg-primary-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75' />
				<span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-[#CFF54A]' />
			</span>
		</div>
	);
};
User.displayName = 'User';

export default User;
