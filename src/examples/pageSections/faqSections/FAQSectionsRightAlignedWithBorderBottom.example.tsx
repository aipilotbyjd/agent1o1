// @start-snippet:: faqSectionsRightAlignedWithBorderBottomExampleSource
import { useState } from 'react';
import Collapse from '@/components/ui/Collapse';
import Icon from '@/components/icon/Icon';
import classNames from 'classnames';

const FAQ_LIST = [
	{
		id: 'one',
		question: 'Can I cancel at anytime?',
		answer: 'Yes, you can cancel your subscription at any time directly from your account settings. There are no hidden fees or complicated processes, and you won’t be required to provide a reason for your cancellation. However, we always welcome any feedback you may have to help us improve our services in the future.',
	},
	{
		id: 'two',
		question: 'How do I change my plan?',
		answer: 'Changing your plan is simple and can be done at any time from your account’s settings page. You will immediately have access to the new plan’s features, and any billing adjustments will be applied on a pro-rata basis. If you need help choosing a plan, our support team is always available to assist you.',
	},
	{
		id: 'three',
		question: 'Is there a free trial available?',
		answer: 'Yes, we offer a 14-day free trial for all new users, giving you full access to all features with no commitment required. You can explore the platform, test its capabilities, and decide if it’s right for you. There is no need to enter payment information to start your trial.',
	},
	{
		id: 'four',
		question: 'What payment methods are accepted?',
		answer: 'We accept a variety of payment methods for your convenience, including Visa, MasterCard, American Express, and PayPal. All transactions are processed securely, and your payment information is encrypted to ensure your safety. If you have a preferred payment method not listed here, please contact our support team.',
	},
	{
		id: 'five',
		question: 'Can I upgrade or downgrade my subscription?',
		answer: 'You have complete flexibility to upgrade or downgrade your subscription at any time. Changes can be made easily from your account settings. When you upgrade, the new features will be available immediately, and downgrades will take effect at the start of your next billing cycle.',
	},
	{
		id: 'six',
		question: 'Will my data be safe and private?',
		answer: 'Absolutely. The security and privacy of your data are our highest priorities. We use state-of-the-art encryption and security protocols to keep your information safe at all times. Additionally, we never share your data with third parties without your explicit consent.',
	},
	{
		id: 'seven',
		question: 'How can I contact support?',
		answer: 'Our support team is available to assist you 24/7 via email or live chat. Whether you have technical questions, billing inquiries, or need guidance with the platform, we are always here to help. Expect a prompt response and dedicated assistance with any issue you may encounter.',
	},
];

const FaqSectionsRightAlignedWithBorderBottomExample = () => {
	const [activeSection, setActiveSection] = useState<string>('one');
	return (
		<>
			{/* FAQ */}
			<div className='mx-auto max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14'>
				{/* Grid */}
				<div className='grid gap-10 md:grid-cols-5'>
					<div className='md:col-span-2'>
						<div className='max-w-xs'>
							<h2 className='text-2xl font-bold md:text-4xl md:leading-tight dark:text-white'>
								Frequently
								<br />
								asked questions
							</h2>
							<p className='mt-1 hidden text-zinc-600 md:block dark:text-zinc-400'>
								Answers to the most frequently asked questions.
							</p>
						</div>
					</div>
					{/* End Col */}

					<div className='md:col-span-3'>
						{/* Accordion */}
						<div className='divide-y divide-zinc-200 dark:divide-zinc-500/25'>
							{FAQ_LIST.map(({ id, question, answer }, idx) => (
								<div key={id} className={idx === 0 ? 'pb-3' : 'pt-6 pb-3'}>
									<button
										className='group inline-flex w-full cursor-pointer items-center justify-between gap-x-3 rounded-lg pb-3 text-start font-semibold text-zinc-800 transition hover:text-zinc-500 focus:text-zinc-500 focus:outline-hidden md:text-lg dark:text-zinc-200 dark:hover:text-zinc-400 dark:focus:text-zinc-400'
										aria-expanded={activeSection === id}
										onClick={() =>
											setActiveSection((prev) => (prev === id ? '' : id))
										}>
										{question}
										<Icon
											icon='ArrowDown01'
											className={classNames(
												'transition-all duration-300 ease-in-out group-hover:opacity-75',
												{ 'rotate-180': activeSection === id },
											)}
										/>
									</button>
									<Collapse isOpen={activeSection === id}>
										<div role='region'>
											<p className='text-zinc-600 dark:text-zinc-400'>
												{answer}
											</p>
										</div>
									</Collapse>
								</div>
							))}
						</div>
						{/* End Accordion */}
					</div>
					{/* End Col */}
				</div>
				{/* End Grid */}
			</div>
			{/* End FAQ */}
		</>
	);
};

export default FaqSectionsRightAlignedWithBorderBottomExample;
// @end-snippet:: faqSectionsRightAlignedWithBorderBottomExampleSource
