import { Download, FileArchive, Loader2 } from 'lucide-react';
import { notify } from '@/api/core';
import { useDataExports, useDownloadDataExport, useRequestDataExport } from '@/api/modules/user';
import { primaryBtn, secondaryBtn } from '@/pages/settings/_shared/buttons';
import formatDate from '@/utils/formatDate.util';
import type { TDataExport } from '@/types/auth.type';

const formatSize = (bytes: number | null) => {
	if (!bytes) return null;
	if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const describe = (dataExport: TDataExport): string => {
	switch (dataExport.status) {
		case 'pending':
		case 'processing':
			return "We're preparing your export. We'll email you when it's ready.";
		case 'completed':
			return [
				`Ready${dataExport.expires_at ? ` until ${formatDate(dataExport.expires_at)}` : ''}`,
				formatSize(dataExport.size_bytes),
			]
				.filter(Boolean)
				.join(' · ');
		case 'failed':
			return 'The last export failed. Try again.';
		case 'expired':
			return `Your export from ${formatDate(dataExport.requested_at)} has expired.`;
	}
};

/**
 * "Download my data": requests a ZIP of everything the account holds, polls
 * while it is built, and downloads the latest one once ready.
 */
const DataExportCard = () => {
	const { data: exports } = useDataExports();
	const requestExport = useRequestDataExport();
	const downloadExport = useDownloadDataExport();

	const latest = exports?.[0];
	const isBuilding = latest?.status === 'pending' || latest?.status === 'processing';

	const handleRequest = async () => {
		try {
			await requestExport.mutateAsync();
			notify.success("We're preparing your data export. We'll email you when it's ready.");
		} catch {
			// Toast is handled by the API hook.
		}
	};

	return (
		<div className='mt-8 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950'>
			<div className='flex flex-wrap items-center justify-between gap-4'>
				<div className='flex max-w-2xl items-start gap-4'>
					<div className='bg-primary-100 text-primary-800 dark:bg-primary-950/30 dark:text-primary-400 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'>
						<FileArchive size={16} />
					</div>
					<div>
						<h2 className='text-base font-bold text-zinc-950 dark:text-zinc-50'>
							Download your data
						</h2>
						<p className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							Get a ZIP archive of your profile, workspace memberships, security
							activity, notifications and the content you created.
						</p>
						{latest && (
							<p className='mt-2 text-xs font-bold text-zinc-600 dark:text-zinc-300'>
								{describe(latest)}
							</p>
						)}
					</div>
				</div>
				<div className='flex items-center gap-3'>
					{latest?.is_downloadable && (
						<button
							type='button'
							disabled={downloadExport.isPending}
							onClick={() => downloadExport.mutate(latest)}
							className={secondaryBtn}>
							<Download size={16} />
							{downloadExport.isPending ? 'Downloading...' : 'Download'}
						</button>
					)}
					<button
						type='button'
						disabled={isBuilding || requestExport.isPending}
						onClick={handleRequest}
						className={primaryBtn}>
						{isBuilding && <Loader2 size={16} className='animate-spin' />}
						{isBuilding
							? 'Preparing...'
							: latest
								? 'Request new export'
								: 'Request export'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DataExportCard;
