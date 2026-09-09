// @start-snippet:: navbarsCenterAlignedExampleSource
import useDarkMode from '@/hooks/useDarkMode';
import { LogoDark, LogoLight } from '@/assets/images';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import Icon from '@/components/icon/Icon';
import classNames from 'classnames';

const NavbarsCenterAlignedExample = () => {
	const { isDarkTheme } = useDarkMode();
	const [isOpen, setIsOpen] = useState<boolean>(false);

	return (
		<>
			{/* ========== HEADER ========== */}
			<header className='z-50 flex w-full flex-wrap py-7 lg:flex-nowrap lg:justify-start'>
				<nav className='relative mx-auto flex w-full max-w-7xl basis-full flex-wrap items-center px-4 md:px-6 lg:grid lg:grid-cols-12 lg:px-8'>
					<div className='flex items-center lg:col-span-3'>
						{/* Logo */}
						<a
							className='inline-block flex-none rounded-xl text-xl font-semibold focus:opacity-80 focus:outline-hidden'
							href='/'
							aria-label='Boltify'>
							<img
								src={isDarkTheme ? LogoLight : LogoDark}
								className='h-10'
								alt='Boltify'
							/>
						</a>
						{/* End Logo */}

						<div className='ms-1 sm:ms-2'></div>
					</div>

					{/* Button Group */}
					<div className='ms-auto flex items-center gap-x-1 py-1 lg:order-3 lg:col-span-3 lg:gap-x-2 lg:ps-6'>
						<Button
							aria-label='Sign in'
							variant='outline'
							color='zinc'
							rounded='rounded-xl'>
							Sign in
						</Button>
						<Button
							aria-label='Hire us'
							variant='solid'
							color='primary'
							rounded='rounded-xl'>
							Hire us
						</Button>

						<div className='lg:hidden'>
							<button
								type='button'
								className='flex size-9.5 items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold text-black hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
								aria-expanded={isOpen}
								aria-label='Toggle navigation'
								onClick={() => setIsOpen((prev) => !prev)}>
								<Icon icon={isOpen ? 'Cancel01' : 'Menu01'} />
							</button>
						</div>
					</div>
					{/* End Button Group */}

					{/* Collapse */}
					<div
						className={classNames(
							'grow basis-full overflow-hidden transition-all duration-300 lg:order-2 lg:col-span-6 lg:block lg:w-auto lg:basis-auto',
							{ hidden: !isOpen },
						)}>
						<div className='mt-5 flex flex-col gap-x-0 gap-y-4 lg:mt-0 lg:flex-row lg:items-center lg:justify-center lg:gap-x-7 lg:gap-y-0'>
							<div>
								<a
									className='before:bg-primary-400 relative inline-block text-black before:absolute before:start-0 before:bottom-0.5 before:-z-1 before:h-1 before:w-full focus:outline-hidden dark:text-white'
									href='/'
									aria-current='page'>
									Work
								</a>
							</div>
							<div>
								<a
									className='inline-block text-black hover:text-zinc-600 focus:text-zinc-600 focus:outline-hidden dark:text-white dark:hover:text-neutral-300 dark:focus:text-neutral-300'
									href='/'>
									Services
								</a>
							</div>
							<div>
								<a
									className='inline-block text-black hover:text-zinc-600 focus:text-zinc-600 focus:outline-hidden dark:text-white dark:hover:text-neutral-300 dark:focus:text-neutral-300'
									href='/'>
									About
								</a>
							</div>
							<div>
								<a
									className='inline-block text-black hover:text-gray-600 focus:text-gray-600 focus:outline-hidden dark:text-white dark:hover:text-neutral-300 dark:focus:text-neutral-300'
									href='/'>
									Careers
								</a>
							</div>
							<div>
								<a
									className='inline-block text-black hover:text-gray-600 focus:text-gray-600 focus:outline-hidden dark:text-white dark:hover:text-neutral-300 dark:focus:text-neutral-300'
									href='/'>
									Blog
								</a>
							</div>
						</div>
					</div>
					{/* End Collapse */}
				</nav>
			</header>
			{/* ========== END HEADER ========== */}
		</>
	);
};

export default NavbarsCenterAlignedExample;
// @end-snippet:: navbarsCenterAlignedExampleSource
