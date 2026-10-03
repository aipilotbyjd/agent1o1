import { Download, FileText } from 'lucide-react';
import { useDownloadArtifact } from '@/api/modules/artifacts';
import type { TAssistantMessageFile } from '@/types/assistant.type';

interface IMessageFilesProps {
	workspaceId: string;
	files: TAssistantMessageFile[];
}

const formatSize = (bytes: number) =>
	bytes < 1024
		? `${bytes} B`
		: bytes < 1024 * 1024
			? `${(bytes / 1024).toFixed(1)} KB`
			: `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Files the assistant handed over in a reply — also kept in Artifacts. */
const MessageFilesPartial = ({ workspaceId, files }: IMessageFilesProps) => {
	const download = useDownloadArtifact(workspaceId);

	return (
		<div className='mt-2 flex flex-wrap gap-2'>
			{files.map((file) => (
				<button
					key={file.artifact_id}
					type='button'
					onClick={() =>
						download.mutate({ artifactId: file.artifact_id, filename: file.filename })
					}
					title='Download'
					className='flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5'>
					<FileText className='h-4 w-4 shrink-0 text-zinc-400' />
					<span className='min-w-0'>
						<span className='block max-w-[14rem] truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100'>
							{file.filename}
						</span>
						<span className='block text-[11px] text-zinc-500'>
							{file.version > 1 ? `v${file.version} · ` : ''}
							{formatSize(file.size)}
						</span>
					</span>
					<Download className='h-3.5 w-3.5 shrink-0 text-zinc-400' />
				</button>
			))}
		</div>
	);
};

export default MessageFilesPartial;
