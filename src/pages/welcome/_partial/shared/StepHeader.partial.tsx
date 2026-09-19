interface IStepHeaderProps {
	title: string;
	description: string;
}

const StepHeader = ({ title, description }: IStepHeaderProps) => (
	<div>
		<h1 className='text-3xl leading-tight font-extrabold tracking-tight text-slate-950 dark:text-zinc-50'>
			{title}
		</h1>
		<p className='mt-2 text-sm font-medium text-slate-500 dark:text-zinc-400'>{description}</p>
	</div>
);

export default StepHeader;
