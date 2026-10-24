import classNames from 'classnames';
import { Eye, FileText, KeyRound, Wrench, Zap } from 'lucide-react';
import type { TModelCatalogEntry } from '@/types/catalog.type';
import { costTierLabel, formatContext, speedLabels } from './modelPicker.helper';

const chip =
	'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none';

/** One row of at-a-glance facts: your key, capabilities, context, speed and cost. */
const ModelBadges = ({ model, className }: { model: TModelCatalogEntry; className?: string }) => {
	const context = formatContext(model.capabilities?.context_window);
	const cost = costTierLabel(model.cost_tier);

	return (
		<div className={classNames('flex flex-wrap items-center gap-1', className)}>
			{model.own_key && (
				<span
					className={`${chip} bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400`}
					title={`Runs on your ${model.own_key.label} key: 0 token credits`}>
					<KeyRound size={10} />
					Your key
				</span>
			)}
			{model.capabilities?.tool_use && (
				<span
					className={`${chip} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
					title='Can use tools'>
					<Wrench size={10} />
					Tools
				</span>
			)}
			{model.capabilities?.vision && (
				<span
					className={`${chip} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
					title='Can read images'>
					<Eye size={10} />
					Vision
				</span>
			)}
			{context && (
				<span
					className={`${chip} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
					title='Context window'>
					<FileText size={10} />
					{context}
				</span>
			)}
			{model.speed && (
				<span
					className={`${chip} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
					title='Speed'>
					<Zap size={10} />
					{speedLabels[model.speed]}
				</span>
			)}
			{cost && (
				<span
					className={`${chip} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
					title='Cost compared with other models'>
					{cost}
				</span>
			)}
		</div>
	);
};

export default ModelBadges;
