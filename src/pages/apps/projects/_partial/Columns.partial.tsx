import { FC } from 'react';
import classNames from 'classnames';
import { Droppable, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import ColumnCardWrapperPartial from './ColumnCardWrapper.partial';
import { TColumnData, TColumnsData, TTasks } from '@/mocks/tasks.mock';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Dropdown, {
	DropdownContent,
	DropdownDivider,
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';

interface IColumnsPartialProps {
	tasksData: TTasks;
	columnsData: TColumnsData;
	setTasksData(...args: unknown[]): unknown;
}
const ColumnsPartial: FC<IColumnsPartialProps> = ({ tasksData, columnsData, setTasksData }) => {
	return (
		<>
			{Object.keys(columnsData).map((columnKey) => {
				const columnData: TColumnData = columnsData[columnKey];
				return (
					<div
						key={columnKey}
						data-component-name='ColumnsPart'
						className='flex flex-col rounded-2xl border border-zinc-300/25 p-4 pb-0 dark:border-zinc-800/50'>
						<div className={classNames(`w-[20rem] xl:w-[22rem] 2xl:w-[28rem]`)}>
							<div className='mb-4 flex basis-full items-center'>
								<div className='flex grow items-center gap-2'>
									<Icon
										icon={columnData.icon}
										size='text-2xl'
										color={columnData.color}
									/>
									<span className='text-2xl font-semibold'>
										{columnData.title}
									</span>
									<Badge
										variant='outline'
										className='border-transparent px-2'
										rounded='rounded-full'>
										{tasksData[columnKey].length}
									</Badge>
								</div>
								<div>
									<Dropdown>
										<DropdownToggle hasIcon={false}>
											<Button aria-label='Options' icon='CarouselVertical' />
										</DropdownToggle>
										<DropdownMenu placement='bottom-end'>
											<DropdownContent className='font-bold'>
												Item actions
											</DropdownContent>
											<DropdownItem icon='Archive'>Archive All</DropdownItem>
											<DropdownItem icon='Delete02'>Delete All</DropdownItem>
											<DropdownDivider />
											<DropdownItem icon='PlusSign'>
												Set column limit
											</DropdownItem>
											<DropdownItem icon='PencilEdit02'>
												Edit details
											</DropdownItem>
											<DropdownItem icon='ViewOffSlash'>
												Hide from view
											</DropdownItem>
											<DropdownItem icon='Delete02' color='red'>
												Delete
											</DropdownItem>
										</DropdownMenu>
									</Dropdown>
								</div>
							</div>

							<Droppable droppableId={columnKey}>
								{(
									providedDroppable: DroppableProvided,
									snapshotDroppable: DroppableStateSnapshot,
								) => (
									<div
										data-component-name='ColumnsPart/Droppable'
										className={classNames('rounded-xl', {
											'border border-dashed border-blue-500 bg-blue-500/10':
												snapshotDroppable.isDraggingOver,
										})}
										{...providedDroppable.droppableProps}
										ref={providedDroppable.innerRef}>
										<ColumnCardWrapperPartial
											columnKey={columnKey}
											columnsData={columnsData}
											tasksData={tasksData}
											setTasksData={setTasksData}
										/>
										<div className='py-2'>{providedDroppable.placeholder}</div>
									</div>
								)}
							</Droppable>
						</div>
					</div>
				);
			})}
		</>
	);
};

export default ColumnsPartial;
