import { notify } from '@/api/core';

/** A file sent with a chat message. `id` is the stored artifact's: absent on
 *  the copy shown while the turn is still in flight. */
export type TChatAttachment = {
	id?: string;
	filename: string;
	size: number;
	mimeType?: string;
	/** A short-lived link to show the stored file; absent until the turn is saved. */
	previewUrl?: string | null;
};

/** What a chat message accepts as `attachments[]`: mirrors the backend's
 *  `config('artifacts.message_attachments')` and `max_upload_kilobytes`. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
export const ATTACHMENT_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.pdf',
	'.txt',
	'.md',
	'.html',
	'.csv',
	'.json',
	'.xml',
	'.yaml',
	'.yml',
];

/** For a chat whose model only takes images and inlined text (the workflow
 *  builder's) so no PDFs. */
export const IMAGE_AND_TEXT_ATTACHMENT_EXTENSIONS = ATTACHMENT_EXTENSIONS.filter(
	(extension) => extension !== '.pdf',
);

export const canAttachFile = (filename: string, extensions = ATTACHMENT_EXTENSIONS) =>
	extensions.some((extension) => filename.toLowerCase().endsWith(extension));

/** `current` plus whichever of `incoming` can be sent, telling the member why
 *  any file was left out. Duplicates of an already-picked file are dropped. */
export const addChatAttachments = (
	current: File[],
	incoming: FileList | File[],
	extensions = ATTACHMENT_EXTENSIONS,
): File[] => {
	const accepted: File[] = [];
	for (const file of Array.from(incoming)) {
		if (!canAttachFile(file.name, extensions)) {
			notify.error(
				`${file.name}: use an image (JPEG, PNG, GIF, WebP)${extensions.includes('.pdf') ? ', a PDF,' : ''} or a text, Markdown, HTML, CSV, JSON, XML, or YAML file.`,
			);
			continue;
		}
		if (file.size > MAX_ATTACHMENT_BYTES) {
			notify.error(`${file.name}: maximum file size is 25 MB.`);
			continue;
		}
		accepted.push(file);
	}
	const added = accepted.filter(
		(file) =>
			!current.some(
				(existing) =>
					existing.name === file.name &&
					existing.size === file.size &&
					existing.lastModified === file.lastModified,
			),
	);
	if (current.length + added.length > MAX_ATTACHMENTS) {
		notify.error(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
	}
	return [...current, ...added.slice(0, Math.max(MAX_ATTACHMENTS - current.length, 0))];
};

/** Files pasted into a text box: a copied screenshot, or files copied in a
 *  file manager. Empty for an ordinary text paste. */
export const filesFromPaste = (event: ClipboardEvent | { clipboardData: DataTransfer | null }) =>
	Array.from(event.clipboardData?.files ?? []);
