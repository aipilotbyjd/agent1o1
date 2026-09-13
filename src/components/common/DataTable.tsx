import { ReactNode } from 'react';
import classNames from 'classnames';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/common/EmptyState';
import { formatNumber } from '@/utils/format.util';
import type { TPaginationMeta } from '@/types/api.type';

// ============================================================
// Data Table
// ------------------------------------------------------------
// The listing shell every resource screen shares: header row,
// skeleton rows while loading, an empty state when the query
// succeeded with nothing in it, and the pager for the endpoints
// that return `meta`.
//
// Columns are data, not markup, so a screen declares what it
// shows rather than repeating table plumbing — the alternative is
// fifteen hand-rolled <table>s that drift apart on padding,
// loading behaviour and empty copy.
//
// Loading renders the real header with skeleton *rows* rather
// than one grey block: the column widths stay put, so the table
// doesn't jump when the data lands.
// ============================================================

export type TColumn<T> = {
	/** Stable identity for the column — also the React key. */
	key: string;
	header: ReactNode;
	cell: (row: T) => ReactNode;
	/** Applied to both the `th` and every `td`, so alignment set
	 *  once can't disagree between header and body. */
	className?: string;
};

interface IDataTableProps<T> {
	columns: TColumn<T>[];
	rows: T[] | undefined;
	rowKey: (row: T) => string;
	isLoading?: boolean;
	onRowClick?: (row: T) => void;
	/** Shown when the query returned zero rows. */
	empty?: ReactNode;
	/** Present only for endpoints that paginate; omit for flat lists. */
	meta?: TPaginationMeta;
	onPageChange?: (page: number) => void;
	skeletonRows?: number;
}

const DataTable = <T,>({
	columns,
	rows,
	rowKey,
	isLoading = false,
	onRowClick,
	empty,
	meta,
	onPageChange,
	skeletonRows = 8,
}: IDataTableProps<T>) => {
	// An empty state replaces the table entirely — a header row above
	// nothing reads as a table that failed to load.
	if (!isLoading && !rows?.length) {
		return <>{empty ?? <EmptyState title='Nothing here yet' />}</>;
	}

	const canPage = !!meta && !!onPageChange && meta.last_page > 1;

	return (
		<>
			<div className='overflow-x-auto'>
				<Table className='w-full'>
					<THead>
						<Tr>
							{columns.map((column) => (
								<Th key={column.key} className={column.className}>
									{column.header}
								</Th>
							))}
						</Tr>
					</THead>
					<TBody>
						{isLoading &&
							Array.from({ length: skeletonRows }).map((_, rowIndex) => (
								// eslint-disable-next-line react/no-array-index-key
								<Tr key={`skeleton-${rowIndex}`}>
									{columns.map((column) => (
										<Td key={column.key} className={column.className}>
											<Skeleton className='h-5 w-full' />
										</Td>
									))}
								</Tr>
							))}

						{!isLoading &&
							rows?.map((row) => (
								<Tr
									key={rowKey(row)}
									onClick={onRowClick ? () => onRowClick(row) : undefined}
									className={classNames({
										'cursor-pointer hover:bg-zinc-500/5': !!onRowClick,
									})}>
									{columns.map((column) => (
										<Td key={column.key} className={column.className}>
											{column.cell(row)}
										</Td>
									))}
								</Tr>
							))}
					</TBody>
				</Table>
			</div>

			{canPage && (
				<div className='mt-4 flex items-center justify-between gap-4 text-sm'>
					<span className='text-zinc-500'>
						Page {formatNumber(meta.current_page)} of {formatNumber(meta.last_page)} ·{' '}
						{formatNumber(meta.total)} total
					</span>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							color='zinc'
							icon='ArrowLeft01'
							isDisable={meta.current_page <= 1}
							onClick={() => onPageChange(meta.current_page - 1)}>
							Previous
						</Button>
						<Button
							variant='outline'
							color='zinc'
							rightIcon='ArrowRight01'
							isDisable={meta.current_page >= meta.last_page}
							onClick={() => onPageChange(meta.current_page + 1)}>
							Next
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export default DataTable;
