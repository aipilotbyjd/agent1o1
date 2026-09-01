// @start-snippet:: contactInfoWithFormExampleSource
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const ContactInfoWithFormExample = () => {
	return (
		<>
			{/* Contact */}
			<div className=''>
				<div className='mx-auto max-w-5xl px-4 py-10 lg:py-20 xl:px-0'>
					{/* Title */}
					<div className='mb-10 max-w-3xl lg:mb-14'>
						<h2 className='text-2xl font-semibold md:text-4xl md:leading-tight'>
							Contact us
						</h2>
						<p className='mt-1 text-zinc-400'>
							Whatever your goal - we will get you there.
						</p>
					</div>
					{/* End Title */}

					{/* Grid */}
					<div className='grid grid-cols-1 gap-x-10 md:grid-cols-2 lg:gap-x-16'>
						<div className='mb-10 border-b border-zinc-800 pb-10 md:order-2 md:mb-0 md:border-b-0 md:pb-0'>
							<form>
								<div className='space-y-4'>
									{/* Input */}
									<Input
										name='name'
										label='Name'
										placeholder='Name'
										autoComplete='name'
										variant='solid'
										isFloatingLabel
									/>
									{/* End Input */}

									{/* Input */}
									<Input
										name='email'
										type='email'
										label='Email'
										placeholder='Email'
										autoComplete='email'
										variant='solid'
										isFloatingLabel
									/>
									{/* End Input */}

									{/* Input */}
									<Input
										name='company'
										label='Company'
										placeholder='Company'
										autoComplete='company'
										variant='solid'
										isFloatingLabel
									/>
									{/* End Input */}

									{/* Input */}
									<Input
										name='phone'
										type='tel'
										label='Phone'
										placeholder='Phone'
										autoComplete='phone'
										variant='solid'
										isFloatingLabel
									/>
									{/* End Input */}

									{/* Textarea */}
									{/* Input */}
									<Textarea
										name='description'
										label='Tell us about your project'
										placeholder='Tell us about your project'
										variant='solid'
										isFloatingLabel
									/>
									{/* End Textarea */}
								</div>

								<div className='mt-2'>
									<p className='text-xs text-zinc-500'>All fields are required</p>

									<p className='mt-5'>
										<Button
											color='primary'
											variant='solid'
											rounded='rounded-full'
											rightIcon='ArrowRight02'
											aria-label='Submit'>
											Submit
										</Button>
									</p>
								</div>
							</form>
						</div>
						{/* End Col */}

						<div className='space-y-14'>
							{/* Item */}
							<div className='flex gap-x-5'>
								<Icon
									icon='Location05'
									size='text-3xl'
									color='zinc'
									className='shrink-0'
								/>
								<div className='grow'>
									<h4 className='font-semibold'>Our address:</h4>

									<address className='mt-1 text-sm text-zinc-400 not-italic'>
										9876 Maple Avenue, Suite 1200
										<br />
										Suite 1200, New York, NY 10001
										<br />
										United States
									</address>
								</div>
							</div>
							{/* End Item */}

							{/* Item */}
							<div className='flex gap-x-5'>
								<Icon
									icon='Mail01'
									size='text-3xl'
									color='zinc'
									className='shrink-0'
								/>
								<div className='grow'>
									<h4 className='font-semibold'>Email us:</h4>

									<a
										className='mt-1 text-sm text-zinc-400 hover:text-zinc-200 focus:text-zinc-200 focus:outline-hidden'
										href='mailto:info@omtanke.studio'
										target='_blank'
										rel='noreferrer'>
										info@omtanke.studio
									</a>
								</div>
							</div>
							{/* End Item */}

							{/* Item */}
							<div className='flex gap-x-5'>
								<Icon
									icon='Megaphone03'
									size='text-3xl'
									color='zinc'
									className='shrink-0'
								/>
								<div className='grow'>
									<h4 className='font-semibold'>We're hiring</h4>
									<p className='mt-1 text-zinc-400'>
										We're thrilled to announce that we're expanding our team and
										looking for talented individuals like you to join us.
									</p>
									<p className='mt-2'>
										<a
											className='group text-primary-500 inline-flex items-center gap-x-2 text-sm font-medium decoration-2 hover:underline focus:underline focus:outline-hidden'
											href='mailto:info@omtanke.studio'>
											Job openings
											<Icon
												icon='ArrowRight02'
												className='shrink-0 translate-x-0 transition group-hover:translate-x-0.5 group-focus:translate-x-0.5'
											/>
										</a>
									</p>
								</div>
							</div>
							{/* End Item */}
						</div>
						{/* End Col */}
					</div>
					{/* End Grid */}
				</div>
			</div>
			{/* End Contact */}
		</>
	);
};

export default ContactInfoWithFormExample;
// @end-snippet:: contactInfoWithFormExampleSource
