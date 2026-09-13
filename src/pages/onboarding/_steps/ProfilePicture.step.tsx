import { FC, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadAvatar } from '@/api/modules/user';
import { onboardingKeys } from '@/api/modules/onboarding';
import { useAuth } from '@/context/authContext';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import StepFooter from '../_parts/StepFooter.part';
import { TOnboardingStepProps } from '../onboarding.types';

const MAX_BYTES = 2 * 1024 * 1024;

const ProfilePictureStep: FC<TOnboardingStepProps> = ({ onNext, onBack }) => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const uploadAvatar = useUploadAvatar();

	const inputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handlePick = (picked: File | undefined) => {
		if (!picked) return;
		if (!picked.type.startsWith('image/')) {
			setError('Pick an image file.');
			return;
		}
		if (picked.size > MAX_BYTES) {
			setError('Images must be 2 MB or smaller.');
			return;
		}
		setError(null);
		setFile(picked);
		setPreview((previous) => {
			if (previous) URL.revokeObjectURL(previous);
			return URL.createObjectURL(picked);
		});
	};

	const handleSubmit = () => {
		// Nothing new picked — the existing avatar already satisfies the step.
		if (!file) {
			onNext();
			return;
		}
		uploadAvatar.mutate(file, {
			onSuccess: () => {
				// `completed` for this step is derived from `user.avatar`
				// server-side, so the snapshot has to be refetched.
				queryClient.invalidateQueries({ queryKey: onboardingKeys.state() });
				onNext();
			},
		});
	};

	return (
		<div>
			<h2 className='text-xl font-bold text-zinc-800 dark:text-white'>Add a profile picture</h2>
			<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
				It shows up next to your runs and comments. You can change it any time.
			</p>

			<div className='mt-6 flex flex-col items-center gap-4 sm:flex-row'>
				<Avatar
					src={preview ?? user?.avatar ?? undefined}
					name={user?.name}
					size='w-24'
				/>
				<div className='flex flex-col items-center gap-2 sm:items-start'>
					<input
						ref={inputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={(e) => handlePick(e.target.files?.[0])}
					/>
					<Button
						aria-label='Choose image'
						variant='outline'
						color='zinc'
						icon='Upload01'
						onClick={() => inputRef.current?.click()}>
						{file ? 'Choose a different image' : 'Choose an image'}
					</Button>
					<span className='text-xs text-zinc-500'>PNG or JPG, up to 2 MB.</span>
					{error && <span className='text-xs text-red-500'>{error}</span>}
				</div>
			</div>

			<StepFooter
				onBack={onBack}
				onSkip={onNext}
				submitLabel={file ? 'Upload and continue' : 'Continue'}
				onSubmit={handleSubmit}
				isLoading={uploadAvatar.isPending}
			/>
		</div>
	);
};

export default ProfilePictureStep;
