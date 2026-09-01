// @start-snippet:: navigationsMiniFloatingHeaderExampleSource
import { LogoDark, LogoLight } from '@/assets/images';
import { useState } from 'react';
import Icon from '@/components/icon/Icon';
import classNames from 'classnames';
import useDarkMode from '@/hooks/useDarkMode';

const NavigationsMiniFloatingHeaderExample = () => {
	const { isDarkTheme } = useDarkMode();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	return (
		<>
			{/* ========== HEADER ========== */}
			<header className='sticky inset-x-0 top-0 z-50 flex w-full flex-wrap text-sm md:flex-nowrap md:justify-start'>
				<nav className='relative mx-2 mt-4 w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white py-2.5 md:mx-auto md:flex md:items-center md:justify-between md:px-4 md:py-0 dark:border-zinc-700 dark:bg-zinc-900'>
					<div className='flex items-center justify-between px-4 md:px-0'>
						<div className='flex items-center'>
							{/* Logo */}
							<a
								className='inline-block flex-none rounded-md text-xl font-semibold focus:opacity-80 focus:outline-hidden'
								href='/'
								aria-label='Boltify'>
								<img
									src={isDarkTheme ? LogoLight : LogoDark}
									className='h-6'
									alt='Boltify'
								/>
							</a>
							{/* End Logo */}
							<div className='ms-1 sm:ms-2'></div>
						</div>

						<div className='md:hidden'>
							{/* Toggle Button */}
							<button
								type='button'
								className='flex size-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-200 focus:bg-zinc-200 focus:outline-hidden dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:focus:bg-zinc-700'
								aria-expanded={isOpen}
								aria-controls='hs-navbar-header-floating'
								aria-label='Toggle navigation'
								onClick={() => setIsOpen((prev) => !prev)}>
								<Icon icon={isOpen ? 'Cancel01' : 'Menu01'} />
							</button>
							{/* End Toggle Button */}
						</div>
					</div>

					<div
						className={classNames(
							'grow basis-full overflow-hidden transition-all duration-300 md:block',
							{
								hidden: !isOpen,
							},
						)}>
						<div className='mt-3 flex flex-col gap-2 py-2 md:mt-0 md:flex-row md:items-center md:justify-end md:gap-3 md:py-0 md:ps-7'>
							<a
								className='border-s-2 border-zinc-800 px-4 py-0.5 font-medium text-zinc-800 focus:outline-hidden md:border-s-0 md:border-b-2 md:px-1 md:py-3 dark:border-zinc-200 dark:text-zinc-200'
								href='/'
								aria-current='page'>
								Home
							</a>
							<a
								className='border-s-2 border-transparent px-4 py-0.5 text-zinc-500 hover:text-zinc-800 focus:outline-hidden md:border-s-0 md:border-b-2 md:px-1 md:py-3 dark:text-zinc-400 dark:hover:text-zinc-200'
								href='/'>
								Projects
							</a>
							<a
								className='border-s-2 border-transparent px-4 py-0.5 text-zinc-500 hover:text-zinc-800 focus:outline-hidden md:border-s-0 md:border-b-2 md:px-1 md:py-3 dark:text-zinc-400 dark:hover:text-zinc-200'
								href='/'>
								Work
							</a>
							<a
								className='border-s-2 border-transparent px-4 py-0.5 text-zinc-500 hover:text-zinc-800 focus:outline-hidden md:border-s-0 md:border-b-2 md:px-1 md:py-3 dark:text-zinc-400 dark:hover:text-zinc-200'
								href='/'>
								Articles
							</a>
						</div>
					</div>
				</nav>
			</header>
			{/* ========== END HEADER ========== */}
		</>
	);
};

export default NavigationsMiniFloatingHeaderExample;
// @end-snippet:: navigationsMiniFloatingHeaderExampleSource
