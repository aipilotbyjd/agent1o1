import { FC, useState } from 'react';
import { useInviteOnboardingTeam } from '@/api/modules/onboarding';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import Textarea from '@/components/form/Textarea';
import Button from '@/components/ui/Button';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

// `Role::assignable()` on the backend — owner is never grantable.
const ROLES = [
	{ value: 'admin', label: 'Admin — manage the workspace and its members' },
	{ value: 'editor', label: 'Editor — build and run workflows' },
	{ value: 'member', label: 'Member — run workflows and see results' },
	{ value: 'viewer', label: 'Viewer — read-only access' },
];

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const InviteTeamStep: FC<TOnboardingStepProps> = ({ onNext, onBack }) => {
	const invite = useInviteOnboardingTeam();

	const [emails, setEmails] = useState<string[]>(['', '']);
	const [role, setRole] = useState('member');
	const [note, setNote] = useState('');

	const filled = emails.map((email) => email.trim()).filter(Boolean);
	const invalid = filled.filter((email) => !isEmail(email));
	const canSend = filled.length > 0 && invalid.length === 0;

	const updateEmail = (index: number, value: string) =>
		setEmails((prev) => prev.map((email, i) => (i === index ? value : email)));

	const handleSubmit = () => {
		if (!canSend) return;
		invite.mutate(
			{
				emails: filled,
				role,
				personal_note: note.trim() ? note.trim() : null,
			},
			{ onSuccess: () => onNext() },
		);
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>Invite your team</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				Everyone you invite joins this workspace with the role you pick.
			</p>

			<div className='mt-6 grid gap-y-4'>
				<div>
					<Label htmlFor='invite-email-0'>Email addresses</Label>
					<div className='grid gap-y-2'>
						{emails.map((email, index) => (
							<Input
								// eslint-disable-next-line react/no-array-index-key
								key={index}
								className='bg-transparent!'
								id={`invite-email-${index}`}
								name={`invite-email-${index}`}
								type='email'
								autoComplete='off'
								value={email}
								onChange={(e) => updateEmail(index, e.target.value)}
								placeholder='teammate@company.com'
							/>
						))}
					</div>
					<div className='mt-2 flex items-center justify-between'>
						<Button
							aria-label='Add another'
							variant='link'
							color='zinc'
							icon='PlusSign'
							onClick={() => setEmails((prev) => [...prev, ''])}>
							Add another
						</Button>
						{invalid.length > 0 && (
							<span className='text-xs text-red-500'>
								{invalid.length === 1
									? 'One address is not a valid email.'
									: `${invalid.length} addresses are not valid emails.`}
							</span>
						)}
					</div>
				</div>

				<div>
					<Label htmlFor='invite-role'>Role</Label>
					<Select
						className='bg-transparent!'
						id='invite-role'
						name='invite-role'
						value={role}
						onChange={(e) => setRole(e.target.value)}>
						{ROLES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div>
					<Label htmlFor='invite-note'>Personal note (optional)</Label>
					<Textarea
						className='bg-transparent!'
						id='invite-note'
						name='invite-note'
						rows={3}
						maxLength={1000}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Tell them what you're building together."
					/>
				</div>
			</div>

			<StepFooter
				onBack={onBack}
				onSkip={onNext}
				skipLabel="I'll do this later"
				submitLabel={filled.length > 1 ? `Send ${filled.length} invites` : 'Send invite'}
				onSubmit={handleSubmit}
				isLoading={invite.isPending}
				isDisabled={!canSend}
			/>
		</div>
	);
};

export default InviteTeamStep;
