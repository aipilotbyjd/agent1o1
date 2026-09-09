import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useFormik } from 'formik';
import { createEditor, Descendant } from 'slate';
import { Editable, Slate, withReact } from 'slate-react';
import { useTranslation } from 'react-i18next';
import { TTask, TTasks } from '@/mocks/tasks.mock';
import { move } from '../_helper/helper';
import Offcanvas, { OffcanvasBody, OffcanvasHeader } from '@/components/ui/Offcanvas';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import RichText from '@/components/ui/RichText';
import Card, { CardBody, CardHeader, CardHeaderChild } from '@/components/ui/Card';

interface ICommentTextProps {
	text: string;
}
const CommentText: FC<ICommentTextProps> = (props) => {
	const { text } = props;
	const editor = useMemo(() => withReact(createEditor()), []);

	return (
		<Slate editor={editor} initialValue={JSON.parse(text) as Descendant[]}>
			<Editable readOnly placeholder='Enter some plain text...' />
		</Slate>
	);
};

interface ITaskEditPartialProps {
	task: TTask;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	columnKey: string;
	tasksData: TTasks;
	setTasksData: Dispatch<SetStateAction<TTasks>>;
	index: number;
}
const TaskEditPartial: FC<ITaskEditPartialProps> = (props) => {
	const { i18n } = useTranslation();

	const { task, isOpen, columnKey, tasksData, setTasksData, index, setIsOpen } = props;
	const isNewItem = !task.id;

	const formik = useFormik({
		initialValues: {
			title: task.title || '',
			groupId: columnKey || '',
			description: task?.description ? (JSON.parse(task?.description) as Descendant[]) : [],
			newComment: [],
			// assignee: task.user.username || '',
			task:
				(task.items && task.items.filter((f) => f.status).map((m) => m.id.toString())) ||
				[],
			// tags: (task.tags && task.tags.map((m) => m.id)) || [],
		},
		onSubmit: (values) => {
			const RESULT = move(
				tasksData[columnKey],
				tasksData[formik.values.groupId],
				{
					index,
					droppableId: columnKey,
				},
				{ index: 0, droppableId: values.groupId },
			);
			setTasksData({ ...tasksData, ...RESULT });
		},
	});

	const editor = useMemo(() => withReact(createEditor()), []);
	const [editDescStatus, setEditDescStatus] = useState<boolean>(false);

	return (
		<Offcanvas
			isOpen={isOpen}
			setIsOpen={setIsOpen}
			dialogClassName='max-md:max-w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-xl'>
			<OffcanvasHeader>
				{isNewItem ? (
					'New Task'
				) : (
					<div className='flex gap-4'>
						<span>{task.title}</span>
						<span className='text-zinc-500'>#{task.id}</span>
					</div>
				)}
			</OffcanvasHeader>
			<OffcanvasBody>
				<div className='-mx-4 grid grid-cols-12 [&>*]:border-zinc-500/25'>
					<div className='col-span-12 flex items-center gap-4 border-b px-4 pb-4'>
						<Badge
							color='emerald'
							variant='outline'
							className='flex gap-2 border-transparent'>
							<Icon icon='PlayCircle' />
							Open
						</Badge>
						<span>{task.user.username}</span>
						<span className='text-zinc-500'>
							opened on {dayjs().locale(i18n.language).format('LLL')}
						</span>
					</div>
				</div>
				<div className='-mx-4 grid h-full grid-cols-12 [&>*]:border-zinc-500/25'>
					<div className='col-span-12 p-4 md:col-span-8 md:border-e'>
						<div className='-mx-4 grid grid-cols-12 gap-y-4'>
							<div className='col-span-12 flex items-center px-4'>
								<div className='flex grow items-center gap-2'>
									<Avatar
										src={task.user.image.org}
										name={task.user.username}
										className='!w-8'
									/>
									<span>{task.user.username}</span>
									<span className='text-zinc-500'>
										on {dayjs().locale(i18n.language).format('LLL')}
									</span>
								</div>
								<div className='shrink-0'>
									{editDescStatus ? (
										<>
											<Button
												aria-label='Cancel'
												color='red'
												onClick={() => setEditDescStatus(!editDescStatus)}>
												Cancel
											</Button>
											<Button
												aria-label='Update'
												color='emerald'
												variant='solid'
												onClick={() => setEditDescStatus(!editDescStatus)}>
												Update
											</Button>
										</>
									) : (
										<Button
											aria-label='Edit'
											className='!px-0'
											onClick={() => setEditDescStatus(!editDescStatus)}>
											Edit
										</Button>
									)}
								</div>
							</div>
							<div className='col-span-12 border-b border-zinc-500/25 px-4 pb-4'>
								{editDescStatus ? (
									<RichText
										id='description'
										value={formik.values.description}
										handleChange={(event) => {
											formik
												.setFieldValue('description', event)
												.then(() => {})
												.catch(() => {});
										}}
									/>
								) : (
									<Slate
										editor={editor}
										initialValue={JSON.parse(task.description) as Descendant[]}>
										<Editable readOnly placeholder='Enter some plain text...' />
									</Slate>
								)}
							</div>
							{task.comments &&
								task.comments.map((comment) => (
									<div key={comment.id} className='col-span-12 px-4'>
										<Card className='shadow-lg'>
											<CardHeader>
												<CardHeaderChild>
													<Avatar
														src={comment.user.image.org}
														name={comment.user.username}
														className='w-8'
													/>
													<span>{comment.user.username}</span>
													<span className='text-zinc-500'>
														{dayjs()
															.locale(i18n.language)
															.format('LLL')}
													</span>
												</CardHeaderChild>
											</CardHeader>
											<CardBody>
												<CommentText text={comment.text} />
											</CardBody>
										</Card>
									</div>
								))}
							<div className='col-span-12 px-4'>
								<RichText
									id='newComment'
									value={formik.values.newComment}
									handleChange={(event) => {
										formik
											.setFieldValue('newComment', event)
											.then(() => {})
											.catch(() => {});
									}}
									placeholder='Leave a comment'
								/>
							</div>
							<div className='col-span-12 flex px-4'>
								<div className='grow' />
								<div className='shrink-0'>
									<Button aria-label='Comment' color='emerald' variant='outline'>
										Comment
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className='col-span-12 p-4 md:col-span-4'>
						<div className='-mx-4 grid grid-cols-12 gap-y-4'>
							<div className='col-span-12 border-b border-zinc-500/25 px-4 pb-4'>
								<table className='w-full text-zinc-500'>
									<tbody className='[&>tr>td]:py-2'>
										<tr aria-label='Assignees'>
											<td>
												<b>Assignees</b>
											</td>
											<td>
												<div className='flex items-center gap-2'>
													<Avatar
														src={task.user.image?.org}
														name={task.user.username}
														className='w-8'
													/>
													<span>{task.user.username}</span>
												</div>
											</td>
										</tr>
										<tr>
											<td>
												<b>Team</b>
											</td>
											<td>{task.subtitle}</td>
										</tr>
										<tr aria-label='Attachments'>
											<td>
												<b>Attachments</b>
											</td>
											<td>
												<ul className='list-disc'>
													{task.attachments &&
														task.attachments.map((att) => (
															<li
																key={att.id}
																className='flex items-center gap-2'>
																<Icon icon='TissuePaper' />
																<span>{att.path}</span>
															</li>
														))}
												</ul>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className='col-span-12 px-4'>
								<div className='flex flex-col gap-4'>
									<div>
										<Button aria-label='Open new tab' icon='ArrowRight02'>
											Open in new tab
										</Button>
									</div>
									<div>
										<Button aria-label='Copy link' icon='DocumentAttachment'>
											Copy link
										</Button>
									</div>
									<div>
										<Button
											aria-label='Copy link project'
											icon='DocumentAttachment'>
											Copy link project
										</Button>
									</div>
									<div>
										<Button aria-label='Archive' icon='Archive'>
											Archive
										</Button>
									</div>
									<div>
										<Button
											aria-label='Delete'
											icon='Delete02'
											color='red'
											variant='outline'>
											Delete from project
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</OffcanvasBody>
		</Offcanvas>
	);
};

export default TaskEditPartial;
