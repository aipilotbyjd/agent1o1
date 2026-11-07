import { useWorkflowPresence } from '../../_hooks/useWorkflowPresence.hook';

const MAX_AVATARS = 3;

const initialsOf = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');

/** Who else has this workflow open, as a stack of avatars in the top bar. */
const WorkflowPresence = () => {
	const members = useWorkflowPresence();
	if (members.length === 0) return null;

	const shown = members.slice(0, MAX_AVATARS);
	const hidden = members.length - shown.length;
	const names = members.map(({ name }) => name).join(', ');

	return (
		<div
			className='hidden items-center -space-x-2 sm:flex'
			role='group'
			aria-label={`Also open: ${names}`}
			title={`Also open: ${names}`}>
			{shown.map((member) =>
				member.avatar ? (
					<img
						key={member.id}
						src={member.avatar}
						alt={member.name}
						className='h-7 w-7 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900'
					/>
				) : (
					<span
						key={member.id}
						className='bg-primary-500 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900'>
						{initialsOf(member.name)}
					</span>
				),
			)}
			{hidden > 0 && (
				<span className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 ring-2 ring-white dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-900'>
					+{hidden}
				</span>
			)}
		</div>
	);
};

export default WorkflowPresence;
