import { FileText, FileImage, FileSpreadsheet, FileCode, File as FileIcon, type LucideIcon } from 'lucide-react';
import type { TArtifactMimeCategory } from '@/types/artifact.type';

export const ARTIFACT_CATEGORIES: { value: TArtifactMimeCategory; label: string }[] = [
	{ value: 'documents', label: 'Documents' },
	{ value: 'images', label: 'Images' },
	{ value: 'spreadsheets', label: 'Spreadsheets' },
];

export const getArtifactIcon = (mimeType: string): LucideIcon => {
	if (mimeType.startsWith('image/')) return FileImage;
	if (mimeType.startsWith('text/csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel'))
		return FileSpreadsheet;
	if (mimeType === 'text/html' || mimeType === 'application/pdf') return FileText;
	if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript'))
		return FileCode;
	return FileIcon;
};

export const getArtifactColor = (mimeType: string): string => {
	if (mimeType.startsWith('image/')) return '#EC4899';
	if (mimeType.startsWith('text/csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel'))
		return '#10A37F';
	if (mimeType === 'text/html' || mimeType === 'application/pdf') return '#6366F1';
	if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript'))
		return '#D97706';
	return '#64748B';
};

export const formatBytes = (bytes: number): string => {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** exponent;
	return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
};
