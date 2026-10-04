import {
	File,
	FileCode,
	FileSpreadsheet,
	FileText,
	Image as ImageIcon,
	type LucideIcon,
} from 'lucide-react';

/** How a file should look wherever it is listed: its icon, tile colour and labels. */

export const fileExtension = (filename: string) => {
	const dot = filename.lastIndexOf('.');
	return dot === -1 ? '' : filename.slice(dot + 1).toUpperCase();
};

export const isImageFile = (mimeType: string | null | undefined, filename = '') =>
	mimeType ? mimeType.startsWith('image/') : /\.(png|jpe?g|gif|webp|svg)$/i.test(filename);

/** The mime type when known, else a guess from the extension — enough to pick an icon. */
const typeHint = (mimeType: string | null | undefined, filename: string) =>
	`${mimeType ?? ''} ${fileExtension(filename).toLowerCase()}`;

export const fileIconFor = (mimeType: string | null | undefined, filename = ''): LucideIcon => {
	const hint = typeHint(mimeType, filename);
	if (isImageFile(mimeType, filename)) return ImageIcon;
	if (/spreadsheet|excel|csv|xlsx?\b/.test(hint)) return FileSpreadsheet;
	if (/html|json|javascript|xml|yaml|yml/.test(hint)) return FileCode;
	if (/pdf|word|text|docx?\b|md\b|txt/.test(hint)) return FileText;
	return File;
};

/** A solid icon square, as ChatGPT draws a file card: white glyph on the type's colour. */
export const fileSolidToneFor = (mimeType: string | null | undefined, filename = ''): string => {
	const hint = typeHint(mimeType, filename);
	if (/pdf/.test(hint)) return 'bg-rose-500 text-white';
	if (/spreadsheet|excel|csv|xlsx?\b/.test(hint)) return 'bg-emerald-600 text-white';
	if (/word|docx?\b/.test(hint)) return 'bg-blue-500 text-white';
	if (/html|json|javascript|xml|yaml|yml/.test(hint)) return 'bg-violet-500 text-white';
	if (isImageFile(mimeType, filename)) return 'bg-amber-500 text-white';
	return 'bg-zinc-500 text-white';
};

/** What kind of file it is, in words: "PDF", "Spreadsheet", "Document"… */
export const fileTypeLabel = (mimeType: string | null | undefined, filename = ''): string => {
	const hint = typeHint(mimeType, filename);
	if (/pdf/.test(hint)) return 'PDF';
	if (/spreadsheet|excel|xlsx?\b/.test(hint)) return 'Spreadsheet';
	if (/csv/.test(hint)) return 'CSV';
	if (/word|docx?\b/.test(hint)) return 'Document';
	if (/md\b|markdown/.test(hint)) return 'Markdown';
	if (/html/.test(hint)) return 'HTML';
	if (/json|javascript|xml|yaml|yml/.test(hint)) return 'Code';
	if (isImageFile(mimeType, filename)) return 'Image';
	if (/text|txt/.test(hint)) return 'Text';
	return fileExtension(filename) || 'File';
};

export const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
