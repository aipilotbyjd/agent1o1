import Container from '@/components/layout/Container';
import Card, {
	CardBody,
	CardHeader,
	CardHeaderChild,
	CardSubTitle,
	CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useOutletContext, useSearchParams } from 'react-router';
import { useEffect, useState } from 'react';
import { OutletContextType } from '@/pages/apps/mail/_layouts/Mail.layout.page';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import FieldWrap from '@/components/form/FieldWrap';
import { SubheaderSeparator } from '@/components/layout/Subheader';
import Avatar from '@/components/ui/Avatar';
import dayjs from 'dayjs';
import Empty from '@/components/ui/Empty';
import classNames from 'classnames';
import MAILS, { Mail, MAIL_LABELS, MailLabels } from '@/mocks/mail.mock';
import Badge from '@/components/ui/Badge';
import EXAMPLE from '@/examples/_index';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Textarea from '@/components/form/Textarea';

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
	return `${size} ${sizes[i]}`;
}

function getMatchedLabels(
	labelNames: string[] | undefined,
	allLabels: MailLabels[] = MAIL_LABELS,
): MailLabels[] {
	if (!labelNames) return [];
	return labelNames
		.map((name) => allLabels.find((label) => label.name === name))
		.filter((label): label is MailLabels => Boolean(label));
}

const MailDashboardPage = () => {
	const { setHeaderLeft } = useOutletContext<OutletContextType>();
	useEffect(() => {
		setHeaderLeft(
			<FieldWrap firstSuffix={<Icon icon='Search01' />}>
				<Input name='search' type='search' dimension='sm' placeholder='Search...' />
			</FieldWrap>,
		);
		return () => {
			setHeaderLeft(undefined);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const [searchParams, setSearchParams] = useSearchParams();
	const activeBox = searchParams.get('activeBox');
	const tags = searchParams.getAll('tags');
	const isNewMail = searchParams.getAll('newMail')[0] === 'true';

	const filterMails = MAILS.filter((mail) => {
		const folderMatch = mail.folder === activeBox;
		if (!tags.length) return folderMatch;
		const hasMatchingLabel = mail.labels?.some((label) => tags.includes(label)) ?? false;
		return folderMatch && hasMatchingLabel;
	});
	const [selectedMailId, setSelectedMailId] = useState<string>(filterMails[0]?.id);
	const selectedMail: Mail | undefined = filterMails.find((mail) => mail.id === selectedMailId);
	useEffect(() => {
		setSelectedMailId(filterMails[0]?.id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams.toString()]);

	const [newMailModalStatus, setNewMailModalStatus] = useState(isNewMail);
	useEffect(() => {
		if (!newMailModalStatus && searchParams.get('newMail') === 'true') {
			const newParams = new URLSearchParams(searchParams);
			newParams.delete('newMail');
			setSearchParams(newParams);
		}
	}, [newMailModalStatus, searchParams, setSearchParams]);

	return (
		<>
			<Container breakpoint={null} className='flex h-dvh! flex-1 flex-col'>
				<div className='grid min-h-0 flex-1 grid-cols-12 gap-2'>
					<div className='col-span-12 flex h-full min-h-0 flex-col xl:col-span-4 2xl:col-span-3'>
						<Card className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
							<CardHeader className='sticky top-0 bg-white/25! backdrop-blur-md dark:bg-zinc-950/25!'>
								<CardHeaderChild>
									<CardTitle>Inbox</CardTitle>
									<CardSubTitle>{filterMails.length} mails</CardSubTitle>
								</CardHeaderChild>
								<CardHeaderChild>
									<Button aria-label='Filter' icon='Filter' variant='link' />
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='min-h-0 flex-1'>
								<div className='flex flex-col gap-1 divide-y divide-zinc-500/25 [&>*]:pb-1'>
									{filterMails.map((mail) => (
										<button
											aria-label='Mail item'
											key={mail.id}
											onClick={() => setSelectedMailId(mail.id)}>
											<div
												className={classNames(
													'flex cursor-pointer gap-2 rounded-md p-2 transition',
													{
														'bg-blue-500/25 hover:bg-blue-500/10':
															selectedMailId === mail.id,
														'hover:bg-zinc-500/10':
															selectedMailId !== mail.id,
													},
												)}>
												<div className='flex w-2 shrink-0 flex-col items-center gap-2'>
													{!mail.isRead && (
														<div className='size-2 rounded-full bg-blue-500'></div>
													)}
													{mail.isStarred && (
														<Icon
															icon='Star'
															color='amber'
															size='text-sm'
															className='fill-amber-500'
														/>
													)}
												</div>
												<div>
													<Avatar name={mail.from} />
												</div>
												<div>
													<div className='flex items-center justify-between gap-1'>
														<div className='line-clamp-1 font-bold'>
															{mail.from}
														</div>
														<div className='line-clamp-1 flex gap-1 text-xs text-zinc-500'>
															<span className='capitalize'>
																{mail.folder}
															</span>
															-
															<span>
																{dayjs(mail.date).format(
																	'DD MMM, YYYY',
																)}
															</span>
														</div>
													</div>
													<div className='flex items-center text-sm'>
														<div className='grow'>{mail.subject}</div>
														{getMatchedLabels(mail?.labels).map(
															(label) => (
																<Badge
																	key={label.id}
																	color={label.color}
																	variant='soft'
																	className='text-xs'>
																	{label.name}
																</Badge>
															),
														)}
														{!!mail.attachments?.length && (
															<Icon icon='Attachment' />
														)}
													</div>
													<div className='line-clamp-1 text-xs text-zinc-500'>
														{mail.body}
													</div>
												</div>
											</div>
										</button>
									))}
									{!filterMails.length && (
										<div className=''>
											<div className='-mb-12 text-center font-bold text-zinc-500'>
												No data
											</div>
											<Empty />
										</div>
									)}
								</div>
							</CardBody>
						</Card>
					</div>
					<div className='col-span-12 flex h-full min-h-0 flex-col xl:col-span-8 2xl:col-span-9'>
						<Card className='flex min-h-0 flex-1 flex-col overflow-y-auto'>
							<CardHeader className='sticky top-0 bg-white/25! backdrop-blur-md dark:bg-zinc-950/25!'>
								<CardHeaderChild>
									<Button
										aria-label='New Mail'
										icon='MailAdd01'
										variant='soft'
										onClick={() => setNewMailModalStatus(true)}>
										New Mail
									</Button>
								</CardHeaderChild>
								<CardHeaderChild>
									<EXAMPLE.Ui.Dropdown.MoveTo />
									<Button
										aria-label='Delete'
										icon='Delete02'
										variant='link'
										color='red'
									/>
									<SubheaderSeparator />
									<Button aria-label='Reply' icon='MailReply01' variant='link' />
									<Button
										aria-label='Reply all'
										icon='MailReplyAll01'
										variant='link'
									/>
									<SubheaderSeparator />
									<Button aria-label='Sent' icon='MailSend01' variant='link' />
									<SubheaderSeparator />
									<Button
										aria-label='Notification'
										icon='NotificationOff03'
										variant='link'
									/>
									<SubheaderSeparator />
									<Button aria-label='Flag' icon='Flag02' variant='link' />
									<Button aria-label='Folder' icon='Folder03' variant='link' />
								</CardHeaderChild>
							</CardHeader>
							<CardBody className='min-h-0 flex-1'>
								{selectedMail && (
									<>
										<div className='flex gap-2 border-b border-zinc-500/25 py-4'>
											<div className='flex w-2 shrink-0 flex-col items-center gap-2'>
												{!selectedMail.isRead && (
													<div className='size-2 rounded-full bg-blue-500'></div>
												)}
												{selectedMail.isStarred && (
													<Icon
														icon='Star'
														color='amber'
														size='text-sm'
														className='fill-amber-500'
													/>
												)}
											</div>
											<div className='shrink-0'>
												<Avatar name={selectedMail.from} />
											</div>
											<div className='grow'>
												<div className='flex items-center justify-between gap-1'>
													<div className='line-clamp-1 font-bold'>
														{selectedMail.from}
													</div>
													<div className='line-clamp-1 flex gap-1 text-xs text-zinc-500'>
														<span className='capitalize'>
															{selectedMail.folder}
														</span>
														-
														<span>
															{dayjs(selectedMail.date).format(
																'HH:MM - DD MMM, YYYY',
															)}
														</span>
													</div>
												</div>
												<div className='flex items-center text-sm'>
													<div className='grow'>
														{selectedMail.subject}
													</div>
													{getMatchedLabels(selectedMail?.labels).map(
														(label) => (
															<Badge
																key={label.id}
																color={label.color}
																variant='soft'>
																{label.name}
															</Badge>
														),
													)}
													{!!selectedMail.attachments?.length && (
														<Icon icon='Attachment' />
													)}
												</div>
											</div>
										</div>
										<div className='py-4 whitespace-pre-line'>
											{selectedMail?.body}
										</div>
										{selectedMail.attachments?.length && (
											<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
												{selectedMail.attachments?.map((item) => (
													<Card key={item.id} className='cursor-pointer'>
														<CardBody>
															<div className='flex items-center gap-4'>
																<Icon
																	icon='Pdf01'
																	color='red'
																	size='text-3xl'
																/>
																<div className=''>
																	<div>{item.name}</div>
																	<div className='text-xs text-zinc-500'>
																		{formatBytes(item.size)}
																	</div>
																</div>
															</div>
														</CardBody>
													</Card>
												))}
											</div>
										)}
									</>
								)}
							</CardBody>
						</Card>
					</div>
				</div>
				<Modal isOpen={newMailModalStatus} setIsOpen={setNewMailModalStatus} size='2xl'>
					<ModalHeader>New Mail</ModalHeader>
					<ModalBody>
						<div className='grid gap-4'>
							<div>
								<Input
									name='from'
									label='From'
									placeholder='From'
									type='email'
									value='info@omtanke.studio'
								/>
							</div>
							<div>
								<Input name='to' label='To' placeholder='To' type='email' />
							</div>
							<div>
								<Input name='cc' label='Cc' placeholder='Cc' type='email' />
							</div>
							<div>
								<Textarea
									name='mail'
									label='Mail'
									placeholder='Add a message'
									rows={8}
								/>
							</div>
						</div>
					</ModalBody>
					<ModalFooter>
						<ModalFooterChild>
							<Button aria-label='Cancel' color='red'>
								Cancel
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button aria-label='Send' variant='solid'>
								Send
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Modal>
			</Container>
		</>
	);
};

export default MailDashboardPage;
