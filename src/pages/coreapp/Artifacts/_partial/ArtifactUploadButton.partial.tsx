import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { notify } from '@/api/core';
import { useUploadArtifact } from '@/api/modules/artifacts';

interface IArtifactUploadButtonProps {
	ws: string;
	label: string;
	className: string;
	/** Adds the file as the next version of this group instead of matching on filename. */
	groupId?: string;
	/** Keeps a new version under its group's name, whatever the picked file is called. */
	filename?: string;
	accept?: string;
	multiple?: boolean;
}

/**
 * A plain member upload. The backend versions by filename on its own: a file
 * named like an existing manual upload becomes that artifact's next version.
 */
const ArtifactUploadButton = ({
	ws,
	label,
	className,
	groupId,
	filename,
	accept,
	multiple = false,
}: IArtifactUploadButtonProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const uploadMutation = useUploadArtifact(ws);
	const [uploading, setUploading] = useState(0);

	const handleFiles = async (files: File[]) => {
		if (files.length === 0) return;
		setUploading(files.length);
		let done = 0;
		// One at a time: two files with the same name must version in order.
		for (const file of files) {
			try {
				await uploadMutation.mutateAsync({ file, group_id: groupId, filename });
				done += 1;
			} catch {
				// The global mutation handler already toasted this file's error.
			}
			setUploading((n) => n - 1);
		}
		if (done > 0) {
			notify.success(
				groupId
					? 'New version uploaded.'
					: done === 1
						? `Uploaded ${files.length === 1 ? files[0].name : '1 file'}.`
						: `Uploaded ${done} files.`,
			);
		}
	};

	return (
		<>
			<input
				ref={inputRef}
				type='file'
				aria-label={label}
				hidden
				accept={accept}
				multiple={multiple}
				onChange={(e) => {
					const files = Array.from(e.target.files ?? []);
					// Reset so picking the same file again still fires `change`.
					e.target.value = '';
					handleFiles(files);
				}}
			/>
			<button
				type='button'
				disabled={uploading > 0}
				onClick={() => inputRef.current?.click()}
				className={className}>
				{uploading > 0 ? <Loader2 size={13} className='animate-spin' /> : <Upload size={13} />}
				{uploading > 0 ? `Uploading${uploading > 1 ? ` ${uploading}…` : '…'}` : label}
			</button>
		</>
	);
};

export default ArtifactUploadButton;
