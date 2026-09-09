import Container from '@/components/layout/Container';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useEffect, useState } from 'react';
import TASKS, { TColumnsData, TTasks } from '@/mocks/tasks.mock';
import { move, reorder } from '@/pages/apps/projects/_helper/helper';
import BoardPartial from './_partial/Board.partial';
import ColumnsPartial from '@/pages/apps/projects/_partial/Columns.partial';
import { useOutletContext } from 'react-router';
import { OutletContextType } from '@/pages/apps/projects/_layouts/Project.layout';
import ChangeDarkModeTemplate from '@/templates/header/ChangeDarkMode.template';
import ChangeLanguageTemplate from '@/templates/header/ChangeLanguage.template';
import EXAMPLE from '@/examples/_index';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layout/Subheader';
import Input from '@/components/form/Input';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';

const ProjectBoardPage = () => {
	const { setHeaderLeft, setHeaderRight } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(<EXAMPLE.Ui.Dropdown.AccountWorkspace />);
		return () => {
			setHeaderLeft(undefined);
			setHeaderRight(
				<>
					<ChangeDarkModeTemplate />
					<ChangeLanguageTemplate />
					<EXAMPLE.Ui.Dropdown.Notifications />
				</>,
			);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [globalFilter, setGlobalFilter] = useState<string>('');

	const columnsData: TColumnsData = {
		column1: { id: 'column1', title: 'Backlog', icon: 'DashedLineCircle', color: 'zinc' },
		column2: { id: 'column2', title: 'To Do', icon: 'Progress01', color: 'zinc' },
		column3: { id: 'column3', title: 'Change request', icon: 'Progress02', color: 'secondary' },
		column4: { id: 'column4', title: 'In progress', icon: 'Progress03', color: 'amber' },
		column5: { id: 'column5', title: 'In review', icon: 'Progress04', color: 'emerald' },
		column6: { id: 'column6', title: 'Done', icon: 'CheckmarkCircle02', color: 'blue' },
	};

	const [tasks, setTasks] = useState<TTasks>(TASKS);

	const onDragEnd = (result: DropResult) => {
		const { source, destination } = result;

		// dropped outside the list
		if (!destination) {
			return;
		}

		if (source.droppableId === destination.droppableId) {
			const ITEMS = reorder(tasks[source.droppableId], source.index, destination.index);

			const sourceList = source.droppableId;
			setTasks({ ...tasks, [sourceList]: ITEMS });
		} else {
			const RESULT = move(
				tasks[source.droppableId],
				tasks[destination.droppableId],
				source,
				destination,
			);

			setTasks({
				...tasks,
				...RESULT,
			});
		}
	};

	function filterTasksByKeyword(tasksDB: TTasks, keyword: string) {
		const filteredTasks: TTasks = {};

		for (const column in tasksDB) {
			filteredTasks[column] = tasksDB[column].filter((task) => {
				const titleMatch = task.title.toLowerCase().includes(keyword.toLowerCase());
				const subtitleMatch = task.subtitle.toLowerCase().includes(keyword.toLowerCase());
				const descriptionMatch = task.description
					.toLowerCase()
					.includes(keyword.toLowerCase());
				const labelMatch = task.label.toLowerCase().includes(keyword.toLowerCase());
				const itemsMatch = task.items.some((item) =>
					item.text.toLowerCase().includes(keyword.toLowerCase()),
				);

				return titleMatch || subtitleMatch || descriptionMatch || labelMatch || itemsMatch;
			});
		}

		return filteredTasks;
	}

	useEffect(() => {
		setTasks(filterTasksByKeyword(TASKS, globalFilter));
		return () => {
			setTasks(TASKS);
		};
	}, [globalFilter]);
	return (
		<>
			<Subheader>
				<SubheaderLeft>
					<FieldWrap firstSuffix={<Icon icon='Search02' />}>
						<Input
							name='search'
							dimension='sm'
							placeholder='Search...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
						/>
					</FieldWrap>
				</SubheaderLeft>
				<SubheaderRight>
					<EXAMPLE.Ui.Dropdown.AvatarGroup />
				</SubheaderRight>
			</Subheader>
			<Container breakpoint={null} className='h-full max-w-full overflow-auto'>
				<DragDropContext onDragEnd={onDragEnd}>
					<BoardPartial>
						<ColumnsPartial
							columnsData={columnsData}
							tasksData={tasks}
							setTasksData={setTasks}
						/>
					</BoardPartial>
				</DragDropContext>
			</Container>
		</>
	);
};

export default ProjectBoardPage;
