// @start-snippet:: pricingSectionsCardExampleSource
import Checkbox from '@/components/form/Checkbox';
import { useState } from 'react';
import Collapse from '@/components/ui/Collapse';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';

const PricingSectionsCardExample = () => {
	const [isAnnually, setIsAnnually] = useState<boolean>(false);
	const [collapseStatus, setCollapseStatus] = useState<boolean>(false);

	return (
		<>
			{/* Pricing */}
			<div className='mx-auto max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14'>
				{/* Title */}
				<div className='mx-auto mb-10 max-w-2xl text-center lg:mb-14'>
					<h2 className='text-2xl font-bold md:text-4xl md:leading-tight dark:text-white'>
						Pricing
					</h2>
					<p className='mt-1 text-zinc-600 dark:text-neutral-400'>
						Our offers are flexible and evolve to meet your needs, whatever your status
						may be.
					</p>
				</div>
				{/* End Title */}

				{/* Switch */}
				<div className='flex items-center justify-center gap-x-3'>
					<label
						htmlFor='pricing-switch'
						className='text-sm text-zinc-800 dark:text-neutral-200'>
						Monthly
					</label>
					<Checkbox
						id='pricing-switch'
						variant='switch'
						checked={isAnnually}
						onChange={() => setIsAnnually((prev) => !prev)}
					/>
					<label
						htmlFor='pricing-switch'
						className='relative text-sm text-zinc-800 dark:text-neutral-200'>
						Annually
						<span className='absolute start-auto -end-28 -top-10'>
							<span className='flex items-center'>
								<svg
									className='h-8 w-14'
									width='45'
									height='25'
									viewBox='0 0 45 25'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M43.2951 3.47877C43.8357 3.59191 44.3656 3.24541 44.4788 2.70484C44.5919 2.16427 44.2454 1.63433 43.7049 1.52119L43.2951 3.47877ZM4.63031 24.4936C4.90293 24.9739 5.51329 25.1423 5.99361 24.8697L13.8208 20.4272C14.3011 20.1546 14.4695 19.5443 14.1969 19.0639C13.9242 18.5836 13.3139 18.4152 12.8336 18.6879L5.87608 22.6367L1.92723 15.6792C1.65462 15.1989 1.04426 15.0305 0.563943 15.3031C0.0836291 15.5757 -0.0847477 16.1861 0.187863 16.6664L4.63031 24.4936ZM43.7049 1.52119C32.7389 -0.77401 23.9595 0.99522 17.3905 5.28788C10.8356 9.57127 6.58742 16.2977 4.53601 23.7341L6.46399 24.2659C8.41258 17.2023 12.4144 10.9287 18.4845 6.96211C24.5405 3.00476 32.7611 1.27399 43.2951 3.47877L43.7049 1.52119Z'
										fill='currentColor'
										className='fill-zinc-300 dark:fill-neutral-700'
									/>
								</svg>
								<span className='rounded-full bg-blue-600 px-2.5 py-1 text-sm leading-5 font-semibold whitespace-nowrap text-white uppercase'>
									Save up to 10%
								</span>
							</span>
						</span>
					</label>
				</div>
				{/* End Switch */}

				{/* Grid */}
				<div className='mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-center'>
					{/* Card */}
					<div className='flex flex-col rounded-xl border border-zinc-200 p-8 text-center dark:border-neutral-800'>
						<h4 className='text-lg font-medium text-zinc-800 dark:text-neutral-200'>
							Free
						</h4>
						<span className='mt-7 text-5xl font-bold text-zinc-800 dark:text-neutral-200'>
							Free
						</span>
						<p className='mt-2 text-sm text-zinc-500 dark:text-neutral-500'>
							Always free
						</p>

						<ul className='mt-7 space-y-2.5 text-sm'>
							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-zinc-800 dark:text-neutral-400'>1 user</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-zinc-800 dark:text-neutral-400'>
									Plan features
								</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Product support
								</span>
							</li>
						</ul>

						<a
							className='mt-5 inline-flex items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-2xs transition-all duration-300 ease-in-out hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800'
							href='/'>
							Sign up
						</a>
					</div>
					{/* End Card */}

					{/* Card */}
					<div className='flex flex-col rounded-xl border-2 border-blue-600 p-8 text-center shadow-xl dark:border-blue-700'>
						<p className='mb-3'>
							<span className='inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 uppercase dark:bg-blue-600 dark:text-white'>
								Most popular
							</span>
						</p>
						<h4 className='text-lg font-medium text-gray-800 dark:text-neutral-200'>
							Startup
						</h4>
						<span className='mt-5 text-5xl font-bold text-gray-800 dark:text-neutral-200'>
							<span className='me-1 text-2xl font-bold'>$</span>
							{isAnnually ? '360' : '36'}
						</span>
						<p className='mt-2 text-sm text-gray-500 dark:text-neutral-500'>
							Everything you need to launch your new business
						</p>

						<ul className='mt-7 space-y-2.5 text-sm'>
							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>2 users</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Plan features
								</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Product support
								</span>
							</li>
						</ul>

						<a
							className='mt-5 inline-flex items-center justify-center gap-x-2 rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-all duration-300 ease-in-out hover:bg-blue-700 focus:bg-blue-700 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50'
							href='/'>
							Sign up
						</a>
					</div>
					{/* End Card */}

					{/* Card */}
					<div className='flex flex-col rounded-xl border border-gray-200 p-8 text-center dark:border-neutral-800'>
						<h4 className='text-lg font-medium text-gray-800 dark:text-neutral-200'>
							Team
						</h4>
						<span className='mt-5 text-5xl font-bold text-gray-800 dark:text-neutral-200'>
							<span className='me-1 text-2xl font-bold'>$</span>
							{isAnnually ? '780' : '78'}
						</span>
						<p className='mt-2 text-sm text-gray-500 dark:text-neutral-500'>
							Everything you need for a growing business
						</p>

						<ul className='mt-7 space-y-2.5 text-sm'>
							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>5 users</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Plan features
								</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Product support
								</span>
							</li>
						</ul>

						<a
							className='mt-5 inline-flex items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-2xs transition-all duration-300 ease-in-out hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800'
							href='/'>
							Sign up
						</a>
					</div>
					{/* End Card */}

					{/* Card */}
					<div className='flex flex-col rounded-xl border border-gray-200 p-8 text-center dark:border-neutral-800'>
						<h4 className='text-lg font-medium text-gray-800 dark:text-neutral-200'>
							Enterprise
						</h4>
						<span className='mt-5 text-5xl font-bold text-gray-800 dark:text-neutral-200'>
							<span className='me-1 text-2xl font-bold'>$</span>
							{isAnnually ? '1290' : '129'}
						</span>
						<p className='mt-2 text-sm text-gray-500 dark:text-neutral-500'>
							Advanced features for scaling your business
						</p>

						<ul className='mt-7 space-y-2.5 text-sm'>
							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									10 users
								</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Plan features
								</span>
							</li>

							<li className='flex gap-x-2'>
								<Icon size='text-2xl' icon='Tick02' color='blue' />
								<span className='text-gray-800 dark:text-neutral-400'>
									Product support
								</span>
							</li>
						</ul>

						<a
							className='mt-5 inline-flex items-center justify-center gap-x-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-2xs transition-all duration-300 ease-in-out hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-transparent dark:text-neutral-300 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800'
							href='/'>
							Sign up
						</a>
					</div>
					{/* End Card */}
				</div>
				{/* End Grid */}

				{/* Comparison table */}
				<Collapse isOpen={collapseStatus}>
					<div className='mt-20 lg:mt-32'>
						<div className='mb-10 lg:mb-20 lg:text-center'>
							<h3 className='text-2xl font-semibold dark:text-white'>
								Compare plans
							</h3>
						</div>

						{/* xs to lg */}
						<div className='space-y-24 lg:hidden'>
							<section>
								<div className='mb-4 px-4'>
									<h2 className='text-lg leading-6 font-medium text-gray-800 dark:text-neutral-200'>
										Free
									</h2>
								</div>
								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Financial data
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Market Capitalization
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Price/Earnings Ratio (P/E Ratio)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Technical Analysis Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Moving Average (MA)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Relative Strength Index (RSI)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Volume Weighted Average Price (VWAP)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Transaction volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Average True Range (ATR)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Rate of Change (ROC)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Price and Volume-Based Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Accumulation/Distribution Line
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Momentum Indicator
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Total social volume
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>
									</tbody>
								</table>
							</section>

							<section>
								<div className='mb-4 px-4'>
									<h2 className='text-lg leading-6 font-medium text-gray-800 dark:text-neutral-200'>
										Startup
									</h2>
								</div>
								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Financial data
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Market Capitalization
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Price/Earnings Ratio (P/E Ratio)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Technical Analysis Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Moving Average (MA)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Relative Strength Index (RSI)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Volume Weighted Average Price (VWAP)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Transaction volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Average True Range (ATR)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Rate of Change (ROC)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Price and Volume-Based Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Accumulation/Distribution Line
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Momentum Indicator
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Total social volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>
							</section>

							<section>
								<div className='mb-4 px-4'>
									<h2 className='text-lg leading-6 font-medium text-gray-800 dark:text-neutral-200'>
										Team
									</h2>
								</div>
								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Financial data
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Market Capitalization
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Price/Earnings Ratio (P/E Ratio)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Technical Analysis Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Moving Average (MA)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Relative Strength Index (RSI)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Volume Weighted Average Price (VWAP)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Transaction volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Average True Range (ATR)
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Rate of Change (ROC)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Price and Volume-Based Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Accumulation/Distribution Line
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Momentum Indicator
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Total social volume
											</th>
											<td className='py-5 pe-4'>
												{/* Minus */}
												<Icon
													size='text-2xl'
													icon='MinusSign'
													color='zinc'
													className='ms-auto'
												/>
												{/* Minus */}
												<span className='sr-only'>No</span>
											</td>
										</tr>
									</tbody>
								</table>
							</section>

							<section>
								<div className='mb-4 px-4'>
									<h2 className='text-lg leading-6 font-medium text-gray-800 dark:text-neutral-200'>
										Enterprise
									</h2>
								</div>
								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Financial data
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Market Capitalization
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Price/Earnings Ratio (P/E Ratio)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Technical Analysis Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Moving Average (MA)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Relative Strength Index (RSI)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Volume Weighted Average Price (VWAP)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Transaction volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Average True Range (ATR)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Rate of Change (ROC)
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>

								<table className='w-full'>
									<caption className='border-t border-gray-200 bg-gray-50 px-4 py-3 text-start text-sm font-bold text-gray-800 dark:border-neutral-700 dark:bg-neutral-700 dark:text-white'>
										Price and Volume-Based Indicators
									</caption>
									<thead>
										<tr>
											<th className='sr-only' scope='col'>
												Feature
											</th>
											<th className='sr-only' scope='col'>
												Included
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-200 dark:divide-neutral-700'>
										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Accumulation/Distribution Line
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Momentum Indicator
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>

										<tr className='border-t border-gray-200 dark:border-neutral-700'>
											<th
												className='px-4 py-5 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
												scope='row'>
												Total social volume
											</th>
											<td className='py-5 pe-4'>
												{/* Check */}
												<Icon
													size='text-2xl'
													icon='Tick02'
													color='blue'
													className='ms-auto'
												/>
												{/* End Solid Check */}
												<span className='sr-only'>Yes</span>
											</td>
										</tr>
									</tbody>
								</table>
							</section>
						</div>
						{/* End xs to lg */}

						{/* lg+ */}
						<div className='hidden lg:block'>
							<table className='h-px w-full'>
								<caption className='sr-only'>Pricing plan comparison</caption>
								<thead className='sticky inset-x-0 top-0 bg-white dark:bg-neutral-900'>
									<tr>
										<th
											className='py-4 ps-6 pe-6 text-start text-sm font-medium text-gray-800'
											scope='col'>
											<span className='sr-only'>Feature by</span>
											<span className='dark:text-white'>Plans</span>
										</th>

										<th
											className='w-1/4 px-6 py-4 text-center text-lg leading-6 font-medium text-gray-800 dark:text-white'
											scope='col'>
											Free
										</th>
										<th
											className='w-1/4 px-6 py-4 text-center text-lg leading-6 font-medium text-gray-800 dark:text-white'
											scope='col'>
											Startup
										</th>
										<th
											className='w-1/4 px-6 py-4 text-center text-lg leading-6 font-medium text-gray-800 dark:text-white'
											scope='col'>
											Team
										</th>
										<th
											className='w-1/4 px-6 py-4 text-center text-lg leading-6 font-medium text-gray-800 dark:text-white'
											scope='col'>
											Enterprise
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-gray-200 border-t border-gray-200 dark:divide-neutral-700 dark:border-neutral-700'>
									<tr>
										<th
											className='bg-gray-50 py-3 ps-6 text-start font-bold text-gray-800 dark:bg-neutral-800 dark:text-white'
											colSpan={5}
											scope='colgroup'>
											Financial data
										</th>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Market Capitalization
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Price/Earnings Ratio (P/E Ratio)
										</th>

										<td className='px-6 py-5'>
											{/* Minus */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* Minus */}
											<span className='sr-only'>Not included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='bg-gray-50 py-3 ps-6 text-start font-bold text-gray-800 dark:bg-neutral-800 dark:text-white'
											colSpan={5}
											scope='colgroup'>
											Technical Analysis Indicators
										</th>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Moving Average (MA)
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Relative Strength Index (RSI)
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Not included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Volume Weighted Average Price (VWAP)
										</th>

										<td className='px-6 py-5'>
											{/* Minus */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* Minus */}
											<span className='sr-only'>Not included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Transaction volume
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Average True Range (ATR)
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Not included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Rate of Change (ROC)
										</th>

										<td className='px-6 py-5'>
											{/* Minus */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* Minus */}
											<span className='sr-only'>Not included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='bg-gray-50 py-3 ps-6 text-start font-bold text-gray-800 dark:bg-neutral-800 dark:text-white'
											colSpan={5}
											scope='colgroup'>
											Price and Volume-Based Indicators
										</th>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Accumulation/Distribution Line
										</th>

										<td className='px-6 py-5'>
											{/* Minus */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* Minus */}
											<span className='sr-only'>Included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='MinusSign'
												color='zinc'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>

									<tr>
										<th
											className='py-5 ps-6 pe-6 text-start text-sm font-normal whitespace-nowrap text-gray-600 dark:text-neutral-400'
											scope='row'>
											Momentum Indicator
										</th>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Free</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Startup</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Team</span>
										</td>

										<td className='px-6 py-5'>
											{/* Check */}
											<Icon
												size='text-2xl'
												icon='Tick02'
												color='blue'
												className='mx-auto'
											/>
											{/* End Solid Check */}
											<span className='sr-only'>Included in Enterprise</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						{/* End lg+ */}
					</div>
				</Collapse>

				<div className='mt-12 text-center'>
					<button
						type='button'
						className='inline-flex cursor-pointer items-center gap-x-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-2xs transition-all duration-300 ease-in-out hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800'
						aria-expanded='false'
						onClick={() => setCollapseStatus((prevState) => !prevState)}>
						{collapseStatus ? (
							<span>Hide pricing comparison</span>
						) : (
							<span>View pricing comparison</span>
						)}

						<svg
							className={classNames('size-4 shrink-0', {
								'rotate-180': collapseStatus,
							})}
							xmlns='http://www.w3.org/2000/svg'
							width='24'
							height='24'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<path d='m6 9 6 6 6-6' />
						</svg>
					</button>
				</div>
				{/* End Comparison table */}
			</div>
			{/* End Pricing */}
		</>
	);
};

export default PricingSectionsCardExample;
// @end-snippet:: pricingSectionsCardExampleSource
