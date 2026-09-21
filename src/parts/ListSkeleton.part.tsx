import Skeleton from '@/components/ui/Skeleton';

/** Placeholder cards for a list page that is still fetching.
 *
 *  The list pages each own their own grid classes (columns differ per page), so
 *  this renders the cards only — drop it inside the page's existing grid wrapper
 *  and the columns come out right without passing layout down.
 *
 *  It replaces the "Loading agents…" style text branches: a card-shaped pulse
 *  holds the same space the real cards will take, so the page does not jump when
 *  the data lands. */
const ListSkeletonPart = ({ count = 6 }: { count?: number }) => {
	return (
		<>
			{Array.from({ length: count }).map((_, i) => (
				<div
					// eslint-disable-next-line react/no-array-index-key
					key={i}
					aria-hidden
					className='border-border-main bg-bg-card flex flex-col gap-4 rounded-3xl border p-5'>
					<div className='flex items-center gap-3'>
						<Skeleton className='size-10 shrink-0' rounded='rounded-xl' />
						<div className='flex min-w-0 grow flex-col gap-2'>
							<Skeleton className='h-3.5 w-2/3' rounded='rounded-lg' />
							<Skeleton className='h-3 w-1/3' rounded='rounded-lg' />
						</div>
					</div>

					<div className='flex flex-col gap-2'>
						<Skeleton className='h-3 w-full' rounded='rounded-lg' />
						<Skeleton className='h-3 w-4/5' rounded='rounded-lg' />
					</div>

					<div className='mt-1 flex items-center gap-2'>
						<Skeleton className='h-6 w-16' rounded='rounded-full' />
						<Skeleton className='h-6 w-12' rounded='rounded-full' />
					</div>
				</div>
			))}
		</>
	);
};

export default ListSkeletonPart;

/** Row-shaped variant for the table/list layouts (Knowledge documents, Members,
 *  Artifacts) where cards would not match what loads in. */
export const ListSkeletonRows = ({ count = 5 }: { count?: number }) => {
	return (
		<div className='border-border-main bg-bg-card divide-border-main divide-y overflow-hidden rounded-3xl border'>
			{Array.from({ length: count }).map((_, i) => (
				<div
					// eslint-disable-next-line react/no-array-index-key
					key={i}
					aria-hidden
					className='flex items-center gap-4 px-5 py-4'>
					<Skeleton className='size-9 shrink-0' rounded='rounded-xl' />
					<div className='flex min-w-0 grow flex-col gap-2'>
						<Skeleton className='h-3.5 w-1/3' rounded='rounded-lg' />
						<Skeleton className='h-3 w-1/5' rounded='rounded-lg' />
					</div>
					<Skeleton className='h-6 w-16 shrink-0' rounded='rounded-full' />
				</div>
			))}
		</div>
	);
};
