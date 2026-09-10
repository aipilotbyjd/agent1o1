import Modal, { ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Download, History } from 'lucide-react';
import { useArtifact, useDownloadArtifact } from '@/api/modules/artifacts';
import { formatBytes } from '../_helper/artifacts.constants';

interface ArtifactVersionsModalProps {
	ws: string;
	artifactId: string | null;
	onClose: () => void;
}

const ArtifactVersionsModal = ({ ws, artifactId, onClose }: ArtifactVersionsModalProps) => {
	const { data: artifact } = useArtifact(ws, artifactId ?? '');
	const downloadMutation = useDownloadArtifact(ws);

	return (
		<Modal isOpen={!!artifactId} setIsOpen={(open) => !open && onClose()} size='sm'>
			<ModalHeader setIsOpen={(open) => !open && onClose()}>
				<div className='flex items-center gap-3'>
					<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'>
						<History size={16} />
					</div>
					<div className='flex flex-col'>
						<span className='text-lg leading-none font-extrabold tracking-tight text-zinc-950 dark:text-white'>
							Version History
						</span>
						<span className='mt-1 text-xs leading-normal font-semibold text-zinc-400 dark:text-zinc-500'>
							{artifact?.filename}
						</span>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-2 pt-2'>
					{!artifact && (
						<div className='py-6 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500'>
							Loading…
						</div>
					)}
					{artifact?.versions?.map((v) => (
						<div
							key={v.id}
							className='flex items-center justify-between rounded-xl border border-border-main bg-bg-main px-3 py-2.5 dark:border-border-main dark:bg-zinc-950/40'>
							<div>
								<p className='text-xs font-bold text-slate-800 dark:text-zinc-200'>v{v.version}</p>
								<p className='text-[10px] font-semibold text-slate-400 dark:text-zinc-500'>
									{formatBytes(v.size)}
								</p>
							</div>
							<button
								onClick={() =>
									downloadMutation.mutate({ artifactId: v.id, filename: artifact.filename })
								}
								className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border-main text-slate-500 hover:bg-slate-50 dark:border-border-main dark:text-zinc-400 dark:hover:bg-zinc-900'>
								<Download size={13} />
							</button>
						</div>
					))}
				</div>
			</ModalBody>
		</Modal>
	);
};

export default ArtifactVersionsModal;
