import { Link, useSearchParams } from 'react-router';
import { useFormik } from 'formik';
import pages from '@/Routes/pages';
import { ApiError } from '@/api/core';
import { useSendInvitation } from '@/api/modules/workspace-members';
import Icon from '@/components/icon/Icon';
import type { TWorkspaceRole } from '@/types/workspace.type';
import * as Yup from 'yup';

interface IInviteTeamFormValues {
	emails: string;
	role: TWorkspaceRole;
	message: string;
}

const parseEmails = (value: string) =>
	value
		.split(/[\n,]+/)
		.map((email) => email.trim())
		.filter(Boolean);

const validationSchema = Yup.object().shape({
	emails: Yup.string()
		.required('Add at least one email address')
		.test('email-list', 'Separate valid email addresses with commas or new lines', (value) => {
			const emails = parseEmails(value || '');
			return (
				emails.length > 0 &&
				emails.every((email) => Yup.string().email().isValidSync(email))
			);
		}),
	role: Yup.string().required('Select a role'),
	message: Yup.string().max(220, 'Keep the note under 220 characters'),
});

const InviteTeamPage = () => {
	const [searchParams] = useSearchParams();
	const workspaceId = searchParams.get('workspaceId') || '';
	const sendInvitation = useSendInvitation(workspaceId);

	const formik = useFormik<IInviteTeamFormValues>({
		initialValues: {
			emails: '',
			role: 'member',
			message: 'I set up our Agent1o1 workspace. Jump in when you have a minute.',
		},
		validationSchema,
		validateOnMount: true,
		onSubmit: async (values, actions) => {
			if (!workspaceId) {
				actions.setStatus('Create a workspace first, then invite your team.');
				return;
			}

			try {
				await Promise.all(
					parseEmails(values.emails).map((email) =>
						sendInvitation.mutateAsync({
							email,
							role: values.role,
							message: values.message,
						}),
					),
				);
				actions.resetForm();
			} catch (error) {
				if (ApiError.is(error)) {
					const fieldErrors = error.fieldErrors();
					actions.setErrors({
						emails: fieldErrors.email,
						role: fieldErrors.role as TWorkspaceRole | undefined,
						message: fieldErrors.message,
					});
				}
			}
		},
	});

	const invitedCount = parseEmails(formik.values.emails).length;
	const firstError =
		(formik.touched.emails && formik.errors.emails) ||
		(formik.touched.message && formik.errors.message) ||
		formik.status ||
		'';

	return (
		<main className='min-h-screen overflow-hidden bg-white text-slate-950'>
			<div className='absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(120deg,rgba(241,245,249,0.95),rgba(255,255,255,0)),radial-gradient(circle_at_80%_10%,rgba(76,111,255,0.12),transparent_30%),radial-gradient(circle_at_18%_28%,rgba(232,93,158,0.14),transparent_32%)]' />
			<InviteNav />

			<section className='relative mx-auto grid max-w-[1220px] gap-10 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20'>
				<div className='flex flex-col justify-center'>
					<div className='mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-lg shadow-slate-200/70'>
						<span className='h-2 w-2 rounded-full bg-[#e85d9e]' />
						Collaboration setup
					</div>
					<h1 className='text-slate-950 text-5xl leading-[0.98] font-semibold tracking-normal md:text-7xl'>
						Bring the right people into the loop.
					</h1>
					<p className='mt-7 max-w-xl text-lg leading-8 font-medium text-slate-600'>
						Add teammates, pick their default access, and give them context before the
						first workflow ships.
					</p>

					<div className='mt-10 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/70'>
						<p className='mb-4 text-xs font-black tracking-[0.18em] text-slate-400 uppercase'>
							Team preview
						</p>
						<div className='space-y-3'>
							{previewMembers.map((member) => (
								<div
									key={member.name}
									className='flex items-center gap-3 rounded-2xl bg-slate-50 p-3'>
									<div
										className='flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black text-white'
										style={{ backgroundColor: member.color }}>
										{member.initials}
									</div>
									<div className='min-w-0 flex-1'>
										<p className='text-slate-950 text-sm font-black'>
											{member.name}
										</p>
										<p className='text-xs font-bold text-slate-500'>
											{member.role}
										</p>
									</div>
									<Icon
										icon='CheckmarkCircle01'
										className='text-primary-600 h-5 w-5'
									/>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className='rounded-[2.25rem] bg-[linear-gradient(135deg,#eef4ff,#fff7fb_55%,#f7fbff)] p-4 shadow-2xl shadow-slate-300/70'>
					<div className='rounded-[1.75rem] border border-white bg-white/85 p-5 backdrop-blur md:p-8'>
						<div className='mb-8 flex items-center justify-between'>
							<div>
								<p className='text-xs font-black tracking-[0.18em] text-slate-400 uppercase'>
									Step 2 of 2
								</p>
								<h2 className='text-slate-950 mt-2 text-3xl font-black'>
									Invite team members
								</h2>
							</div>
							<div className='rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white'>
								{invitedCount || 0} ready
							</div>
						</div>

						<form className='space-y-6' onSubmit={formik.handleSubmit}>
							<div>
								<label
									className='text-slate-950 mb-2 block text-sm font-black'
									htmlFor='emails'>
									Work emails
								</label>
								<textarea
									id='emails'
									name='emails'
									aria-label='Work emails'
									rows={4}
									placeholder={'maria@company.com\njordan@company.com'}
									value={formik.values.emails}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									className='text-slate-950 block w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-medium shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:shadow-lg focus:shadow-slate-200'
								/>
							</div>

							<div className='grid gap-4 sm:grid-cols-[0.75fr_1fr]'>
								<div>
									<label
										className='text-slate-950 mb-2 block text-sm font-black'
										htmlFor='role'>
										Role
									</label>
									<div className='relative'>
										<select
											id='role'
											name='role'
											aria-label='Role'
											value={formik.values.role}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											className='text-slate-700 block min-h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 text-base font-bold shadow-sm outline-none focus:border-slate-300'>
											<option value='admin'>Admin</option>
											<option value='editor'>Editor</option>
											<option value='member'>Member</option>
											<option value='viewer'>Viewer</option>
										</select>
										<Icon
											icon='ArrowDown01'
											className='pointer-events-none absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 text-slate-400'
										/>
									</div>
								</div>

								<div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
									<p className='text-xs font-black tracking-[0.16em] text-slate-400 uppercase'>
										Access
									</p>
									<p className='text-slate-950 mt-2 text-sm font-black'>
										{roleDescriptions[formik.values.role]}
									</p>
								</div>
							</div>

							<div>
								<label
									className='text-slate-950 mb-2 block text-sm font-black'
									htmlFor='message'>
									Invite note
								</label>
								<textarea
									id='message'
									name='message'
									aria-label='Invite note'
									rows={3}
									value={formik.values.message}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									className='text-slate-950 block w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-medium shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:shadow-lg focus:shadow-slate-200'
								/>
							</div>

							<div className='min-h-5 text-xs font-bold text-rose-500'>
								{firstError}
							</div>

							<div className='grid gap-3 sm:grid-cols-[1fr_auto]'>
								<button
									type='submit'
									disabled={!formik.isValid || sendInvitation.isPending}
									className='flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-300 disabled:pointer-events-none disabled:opacity-50'>
									{sendInvitation.isPending ? 'Sending...' : 'Send invites'}
									<Icon icon='MailSend01' className='h-5 w-5' />
								</button>
								<Link
									to={pages.editor.subPages.addWorkflow.to}
									className='flex min-h-14 items-center justify-center rounded-2xl border border-slate-200 px-6 text-base font-black text-slate-700 transition hover:bg-white'>
									Skip
								</Link>
							</div>
						</form>
					</div>
				</div>
			</section>
		</main>
	);
};

const InviteNav = () => (
	<header className='relative z-20 px-5 pt-6'>
		<nav className='mx-auto flex max-w-[1220px] items-center justify-between rounded-[28px] border border-white bg-white/85 px-4 py-3 shadow-xl shadow-slate-200/70 backdrop-blur'>
			<Link to='/' className='flex items-center gap-3'>
				<span className='bg-slate-950 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white'>
					A1
				</span>
				<span className='text-slate-950 text-xl font-black'>Agent1o1</span>
			</Link>
			<div className='hidden items-center gap-7 text-sm font-bold text-slate-500 md:flex'>
				<span>Agents</span>
				<span>Workflows</span>
				<span>Teams</span>
			</div>
			<Link
				to={pages.editor.subPages.addWorkflow.to}
				className='bg-slate-950 rounded-2xl px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800'>
				Go to app
			</Link>
		</nav>
	</header>
);

const previewMembers = [
	{ initials: 'SA', name: 'Sarah Ali', role: 'Workspace owner', color: '#111827' },
	{ initials: 'MK', name: 'Mika Khan', role: 'Workflow editor', color: '#4f46e5' },
	{ initials: 'JR', name: 'Jordan Reyes', role: 'Member', color: '#e85d9e' },
];

const roleDescriptions: Record<TWorkspaceRole, string> = {
	owner: 'Full ownership',
	admin: 'Manage workspace and teammates',
	editor: 'Build and publish workflows',
	member: 'Run workflows and collaborate',
	viewer: 'View workflows and activity',
};

export default InviteTeamPage;
