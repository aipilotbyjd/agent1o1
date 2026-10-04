import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Check, Copy, Download, ShieldCheck, ShieldOff } from 'lucide-react';
import { notify } from '@/api/core';
import { useCurrentUser } from '@/api/modules/user';
import {
	useDisableTwoFactor,
	useRegenerateRecoveryCodes,
	useTwoFactorRecoveryCodes,
} from '@/api/modules/auth';
import pages from '@/Routes/pages';
import Button from '@/components/ui/Button';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';
import { cardClass } from '../_helper/security.helper';
import PasswordPromptModal from './PasswordPromptModal.partial';

type TPrompt = 'disable' | 'regenerate' | null;

const TwoFactorCard = () => {
	const location = useLocation();
	const { data: user, isLoading: isUserLoading } = useCurrentUser();
	const isEnabled = !!user?.two_factor_enabled;

	const recoveryCodes = useTwoFactorRecoveryCodes({ enabled: isEnabled });
	const disableTwoFactor = useDisableTwoFactor();
	const regenerateCodes = useRegenerateRecoveryCodes();

	const [prompt, setPrompt] = useState<TPrompt>(null);
	const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
	const [copied, setCopied] = useState(false);

	const remaining = recoveryCodes.data?.recovery_codes_remaining;

	const handleDisable = async (current_password: string) => {
		await disableTwoFactor.mutateAsync({ current_password });
		setPrompt(null);
		notify.success('Two-factor authentication is off.');
	};

	const handleRegenerate = async (current_password: string) => {
		const result = await regenerateCodes.mutateAsync({ current_password });
		setPrompt(null);
		setFreshCodes(result.recovery_codes);
	};

	const copyCodes = () => {
		if (!freshCodes) return;
		navigator.clipboard
			.writeText(freshCodes.join('\n'))
			.then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => notify.error('Could not copy the codes'));
	};

	const downloadCodes = () => {
		if (!freshCodes) return;
		const blob = new Blob([`Agent1o1 recovery codes\n\n${freshCodes.join('\n')}\n`], {
			type: 'text/plain',
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'agent1o1-recovery-codes.txt';
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<section className={cardClass}>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-4'>
					<div className='bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
						<ShieldCheck size={16} />
					</div>
					<div>
						<h2 className='flex items-center gap-2 text-base font-black text-zinc-950 dark:text-zinc-50'>
							Two-factor authentication
							{!isUserLoading && (
								<span
									className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
										isEnabled
											? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
											: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
									}`}>
									{isEnabled ? 'On' : 'Off'}
								</span>
							)}
						</h2>
						<p className='mt-0.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500'>
							{isEnabled
								? 'Sign-ins ask for a code from your authenticator app.'
								: 'Add a code from an authenticator app to every sign-in.'}
						</p>
						{isEnabled && (
							<p className='mt-2 text-xs font-bold text-zinc-600 dark:text-zinc-300'>
								{remaining === undefined
									? 'Checking recovery codes…'
									: `${remaining} recovery ${remaining === 1 ? 'code' : 'codes'} left`}
								{remaining === 0 && (
									<span className='ml-1.5 text-red-500'>
										— regenerate them so you are not locked out.
									</span>
								)}
							</p>
						)}
					</div>
				</div>

				<div className='flex flex-wrap gap-3 pl-13 sm:pl-0'>
					{isEnabled ? (
						<>
							<button
								type='button'
								onClick={() => setPrompt('regenerate')}
								className={secondaryBtn}>
								Regenerate codes
							</button>
							<button
								type='button'
								onClick={() => setPrompt('disable')}
								className={`${secondaryBtn} text-red-600 hover:text-red-700 dark:text-red-400`}>
								<ShieldOff size={15} />
								Turn off
							</button>
						</>
					) : (
						<Link
							to={pages.identity.twoFactorSetup.to}
							state={{ from: location.pathname }}
							className={primaryBtn}>
							Set up two-factor
						</Link>
					)}
				</div>
			</div>

			<PasswordPromptModal
				isOpen={prompt === 'disable'}
				onClose={() => setPrompt(null)}
				title='Turn off two-factor'
				description='Sign-ins will only need your password. Your recovery codes stop working.'
				confirmLabel='Turn off'
				danger
				isPending={disableTwoFactor.isPending}
				onConfirm={handleDisable}
			/>
			<PasswordPromptModal
				isOpen={prompt === 'regenerate'}
				onClose={() => setPrompt(null)}
				title='Regenerate recovery codes'
				description='Your current recovery codes stop working and a new set is shown once.'
				confirmLabel='Regenerate'
				isPending={regenerateCodes.isPending}
				onConfirm={handleRegenerate}
			/>

			{/* New codes are shown exactly once - they are hashed at rest. */}
			<Modal
				isOpen={!!freshCodes}
				setIsOpen={(open) => !open && setFreshCodes(null)}
				size='sm'>
				<ModalHeader setIsOpen={() => setFreshCodes(null)}>
					<span className='text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white'>
						New recovery codes
					</span>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-400'>
						Save these somewhere safe. They will not be shown again, and each one works
						once.
					</p>
					<div className='mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800'>
						{freshCodes?.map((code) => (
							<span
								key={code}
								className='text-center font-mono text-xs font-bold tracking-wider text-zinc-800 dark:text-zinc-200'>
								{code}
							</span>
						))}
					</div>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild className='flex w-full flex-wrap justify-end gap-3'>
						<button type='button' onClick={copyCodes} className={secondaryBtn}>
							{copied ? (
								<Check size={15} className='text-emerald-500' />
							) : (
								<Copy size={15} />
							)}
							{copied ? 'Copied' : 'Copy'}
						</button>
						<button type='button' onClick={downloadCodes} className={secondaryBtn}>
							<Download size={15} />
							Download
						</button>
						<Button
							variant='solid'
							color='primary'
							onClick={() => setFreshCodes(null)}
							className='shadow-primary-500/10 h-11 font-bold text-zinc-950 shadow-md'>
							I saved them
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</section>
	);
};

export default TwoFactorCard;
