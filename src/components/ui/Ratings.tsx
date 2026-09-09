import { ChangeEvent, Dispatch, FC, Fragment, HTMLAttributes, SetStateAction } from 'react';
import classNames from 'classnames';

// @start-snippet:: interface
export type RatingValues = 0 | 1 | 2 | 3 | 4 | 5;
interface IRatingsProps extends HTMLAttributes<HTMLDivElement> {
	id: string;
	className?: string;
	selectedRating: RatingValues;
	setSelectedRating: Dispatch<SetStateAction<RatingValues>>;
	type?: 'star' | 'heart';
	isDisable?: boolean;
}
// @end-snippet:: interface

const Ratings: FC<IRatingsProps> = (props) => {
	const { id, className, selectedRating, setSelectedRating, type = 'star', isDisable } = props;

	const handleRatingChange = (event: ChangeEvent<HTMLInputElement>) => {
		setSelectedRating(Number(event.target.value) as RatingValues);
	};

	return (
		<div
			className={classNames(
				'flex flex-row-reverse items-center justify-end gap-0.5',
				className,
			)}>
			{[5, 4, 3, 2, 1].map((i) => (
				<Fragment key={i}>
					<input
						aria-label='Rating'
						id={`ratings-${id}-${i}`}
						type='radio'
						className={classNames(
							'peer -ms-5 size-5 appearance-none border-0 bg-transparent text-transparent checked:bg-none focus:bg-none focus:ring-0 focus:ring-offset-0',
							{ 'cursor-not-allowed': isDisable, 'cursor-pointer': !isDisable },
						)}
						name={`ratings-${id}`}
						value={i}
						onChange={!isDisable ? handleRatingChange : undefined}
						checked={selectedRating === i}
					/>
					<label
						aria-label={`ratings-${id}-${i}`}
						htmlFor={`ratings-${id}-${i}`}
						className={classNames(
							'pointer-events-none text-zinc-300 transition-all duration-300 ease-in-out dark:text-zinc-700',
							{
								'opacity-75': isDisable,
								'peer-checked:text-yellow-400 dark:peer-checked:text-yellow-600':
									type === 'star',
								'peer-hover:text-yellow-500!': type === 'star' && !isDisable,
								'peer-checked:text-red-400 dark:peer-checked:text-red-600':
									type === 'heart',
								'peer-hover:text-red-500!': type === 'heart' && !isDisable,
							},
						)}>
						{type === 'star' && (
							<svg
								className='size-5 shrink-0'
								xmlns='http://www.w3.org/2000/svg'
								width='16'
								height='16'
								fill='currentColor'
								viewBox='0 0 16 16'>
								<path d='M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z'></path>
							</svg>
						)}
						{type === 'heart' && (
							<svg
								className='size-5 shrink-0'
								xmlns='http://www.w3.org/2000/svg'
								width='16'
								height='16'
								fill='currentColor'
								viewBox='0 0 16 16'>
								<path
									fillRule='evenodd'
									d='M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z'></path>
							</svg>
						)}
					</label>
				</Fragment>
			))}
		</div>
	);
};
Ratings.displayName = 'Ratings';

export default Ratings;
