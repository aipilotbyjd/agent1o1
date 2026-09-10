import { useState, useRef } from 'react';
import { Check, Loader2, UploadCloud, X, Camera } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { useUploadAvatar } from '@/api/modules/auth';
import { useOnboardingStore } from '../../_context/OnboardingStore.context';

const ProfileStep = () => {
	const { userData } = useAuth();
	const uploadAvatar = useUploadAvatar();
	const { state, dispatch } = useOnboardingStore();
	const { avatarUrl } = state;

	const [uploadProgress, setUploadProgress] = useState<number | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = async (file: File) => {
		if (!file) return;
		if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target?.result)
				dispatch({ type: 'SET_FIELD', payload: { avatarUrl: e.target.result as string } });
		};
		reader.readAsDataURL(file);
		setUploadProgress(0);
		try {
			await uploadAvatar.mutateAsync(file);
			setUploadProgress(100);
		} catch {
			dispatch({ type: 'SET_FIELD', payload: { avatarUrl: userData?.avatar ?? null } });
		} finally {
			setUploadProgress(null);
		}
	};

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const onDragLeave = () => setIsDragging(false);
	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
	};

	// Compute initials from user data
	const userInitials = (() => {
		const name = userData?.firstName || userData?.name;
		if (!name) return 'A1';
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	})();

	return (
		<div className='flex flex-col gap-6'>
			<div className='space-y-1.5'>
				<h1 className='text-3xl leading-tight font-black tracking-tight text-slate-955 dark:text-zinc-50'>
					You're in. Make it yours.
				</h1>
				<p className='text-xs font-semibold text-slate-500 dark:text-zinc-400 leading-relaxed'>
					Upload a photo so teammates recognize you across workflows and notifications.
				</p>
			</div>

			<div className='flex flex-col items-center justify-center py-6'>
				<input
					type='file'
					ref={fileInputRef}
					className='hidden'
					accept='image/*'
					onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
				/>

				<div
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
					onClick={() => fileInputRef.current?.click()}
					className={`group relative flex h-36 w-36 cursor-pointer items-center justify-center rounded-full transition-all duration-300 ${
						isDragging
							? 'ring-4 ring-primary-400 bg-primary-400/10'
							: 'ring-4 ring-slate-100 hover:ring-primary-400/50 dark:ring-zinc-800 dark:hover:ring-primary-400/30'
					}`}
				>
					{uploadProgress !== null ? (
						<div className='flex flex-col items-center justify-center space-y-1.5'>
							<Loader2 className='h-8 w-8 animate-spin text-primary-500' />
							<span className='text-[10px] font-black text-slate-500 dark:text-zinc-400'>
								{uploadProgress}%
							</span>
						</div>
					) : avatarUrl ? (
						<div className='relative h-full w-full overflow-hidden rounded-full'>
							<img
								src={avatarUrl}
								alt='Profile avatar'
								className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
							/>
							{/* Hover overlay to change */}
							<div className='absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
								<Camera className='h-6 w-6 text-white' />
								<span className='mt-1 text-[9px] font-black tracking-wider text-white uppercase'>
									Change
								</span>
							</div>
						</div>
					) : (
						<div className='flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-tr from-primary-400/20 to-emerald-400/20 dark:from-primary-950/40 dark:to-emerald-950/40'>
							<span className='text-3xl font-black tracking-tight text-primary-950 dark:text-primary-300'>
								{userInitials}
							</span>
							{/* Hover overlay */}
							<div className='absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100'>
								<Camera className='h-5 w-5 text-white' />
								<span className='mt-1 text-[9px] font-black tracking-wider text-white uppercase'>
									Upload
								</span>
							</div>
						</div>
					)}

					{/* Action Badge (Plus or check icon at bottom right) */}
					{uploadProgress === null && (
						<div className={`absolute right-1.5 bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-110 dark:border-zinc-900 ${
							avatarUrl
								? 'bg-emerald-500 text-white'
								: 'bg-primary-400 text-primary-950'
						}`}>
							{avatarUrl ? (
								<Check className='h-3.5 w-3.5 stroke-[3.5]' />
							) : (
								<UploadCloud className='h-3.5 w-3.5 stroke-[2.5]' />
							)}
						</div>
					)}
				</div>

				<div className='mt-5 text-center'>
					<p className='text-xs font-bold text-slate-700 dark:text-zinc-300'>
						Drag and drop your picture, or{' '}
						<span className='text-primary-600 underline hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'>
							browse files
						</span>
					</p>
					<p className='mt-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
						Supports PNG or JPEG · Max size 2MB
					</p>

					{avatarUrl && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								dispatch({ type: 'SET_FIELD', payload: { avatarUrl: null } });
							}}
							className='mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-rose-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800'
						>
							<X className='h-3 w-3' />
							Remove Image
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProfileStep;
