import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChartColumn, FlaskConical, Loader2, Trophy, X } from 'lucide-react';
import { notify } from '@/api/core';
import { useUpdateWorkflowPage, useWorkflowPageVariant } from '@/api/modules/workflow-pages';
import { useConfirm } from '@/context/confirm';
import paths from '@/Routes/paths';
import { usePageBuilderStore } from '../_store/pageBuilder.store';
import { usePageBuilder } from '../_context/PageBuilder.context';

/**
 * The page's A/B test from the builder: start version B as a copy of the
 * page, switch which version is being edited, set how many visitors get B,
 * and end the test either way.
 */
const VariantMenu = () => {
	const { ws, page, switchVariant } = usePageBuilder();
	const { confirm } = useConfirm();
	const editing = usePageBuilderStore((store) => store.variant);
	const variant = useWorkflowPageVariant(ws, page.id);
	const update = useUpdateWorkflowPage(ws, page.id);
	const [open, setOpen] = useState(false);
	const [split, setSplit] = useState(page.variant.split);
	const [syncedSplit, setSyncedSplit] = useState(page.variant.split);
	if (syncedSplit !== page.variant.split) {
		setSyncedSplit(page.variant.split);
		setSplit(page.variant.split);
	}

	const startTest = () =>
		variant.create.mutate(undefined, {
			onSuccess: () => {
				notify.success(
					'Version B created as a copy of the page. Change it, then publish to start the test.',
				);
				void switchVariant('b');
			},
		});

	return (
		<div className='relative flex items-center gap-1'>
			{page.variant.exists && (
				<div
					role='radiogroup'
					aria-label='Version being edited'
					className='flex items-center rounded-lg border border-zinc-200/80 bg-zinc-50/70 p-0.5 dark:border-white/10 dark:bg-zinc-900/60'>
					{(['a', 'b'] as const).map((key) => (
						<button
							key={key}
							type='button'
							role='radio'
							aria-checked={editing === key}
							title={`Edit version ${key.toUpperCase()}`}
							onClick={() => void switchVariant(key)}
							className={`h-7 min-w-7 rounded-md px-2 text-xs font-black transition ${
								editing === key
									? 'bg-white text-zinc-900 shadow-xs ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-white/10'
									: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
							}`}>
							{key.toUpperCase()}
						</button>
					))}
				</div>
			)}
			<button
				type='button'
				aria-haspopup='dialog'
				aria-expanded={open}
				aria-label='A/B test'
				title='A/B test'
				onClick={() => setOpen((value) => !value)}
				className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold shadow-xs transition ${
					open
						? 'border-primary-400/70 bg-primary-100 text-primary-900 dark:bg-primary-400/15 dark:text-primary-300'
						: 'border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:bg-white/[0.06]'
				}`}>
				<FlaskConical size={13} className='text-primary-700 dark:text-primary-400' />
				<span className='hidden xl:inline'>
					{page.variant.live ? 'Test running' : 'A/B test'}
				</span>
			</button>

			<AnimatePresence>
				{open && (
					<>
						<div
							aria-hidden
							className='fixed inset-0 z-40'
							onClick={() => setOpen(false)}
						/>
						<motion.div
							role='dialog'
							aria-label='A/B test'
							initial={{ opacity: 0, y: 4, scale: 0.98 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 4, scale: 0.98 }}
							transition={{ duration: 0.12 }}
							className='absolute top-10 right-0 z-50 w-[340px] rounded-xl border border-zinc-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-white/10 dark:bg-zinc-950 dark:ring-white/5'>
							<div className='flex items-center gap-2 px-4 py-3'>
								<p className='text-sm font-bold text-zinc-900 dark:text-zinc-100'>
									A/B test
								</p>
								{page.variant.exists && (
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
											page.variant.live
												? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
												: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
										}`}>
										{page.variant.live ? 'Running' : 'Not live yet'}
									</span>
								)}
								<button
									type='button'
									aria-label='Close'
									onClick={() => setOpen(false)}
									className='ml-auto flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06]'>
									<X size={15} />
								</button>
							</div>

							{!page.variant.exists ? (
								<div className='space-y-3 border-t border-zinc-100 px-4 py-4 dark:border-white/[0.06]'>
									<p className='text-xs leading-relaxed text-zinc-600 dark:text-zinc-300'>
										Try a second version of this page (a different headline,
										layout or button) and see which one gets more people to
										submit. Visitors are split between the two and always see
										the same one.
									</p>
									<button
										type='button'
										onClick={startTest}
										disabled={variant.create.isPending}
										className='bg-primary-400 text-primary-950 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition hover:brightness-105 disabled:opacity-50'>
										{variant.create.isPending && (
											<Loader2 size={13} className='animate-spin' />
										)}
										Create version B
									</button>
								</div>
							) : (
								<>
									<div className='space-y-2 border-t border-zinc-100 px-4 py-3.5 dark:border-white/[0.06]'>
										<div className='flex items-center justify-between text-xs'>
											<label
												htmlFor='variant-split'
												className='font-semibold text-zinc-800 dark:text-zinc-100'>
												Visitors who see B
											</label>
											<span className='font-bold text-zinc-900 tabular-nums dark:text-white'>
												{split}%
											</span>
										</div>
										<input
											id='variant-split'
											type='range'
											min={10}
											max={90}
											step={5}
											value={split}
											onChange={(e) => setSplit(Number(e.target.value))}
											onPointerUp={() =>
												split !== page.variant.split &&
												update.mutate({ variant_split: split })
											}
											onKeyUp={() =>
												split !== page.variant.split &&
												update.mutate({ variant_split: split })
											}
											className='accent-primary-500 w-full'
										/>
										<p className='text-[11px] leading-snug text-zinc-500 dark:text-zinc-400'>
											{page.variant.live
												? 'Both versions are live. Changes to either draft go live when you publish.'
												: 'Publish the page to start the test. Until then everyone sees the main page.'}
										</p>
									</div>
									<div className='space-y-1 border-t border-zinc-100 p-2 dark:border-white/[0.06]'>
										<Link
											to={paths.pageInsights(ws, page.id)}
											className='flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/[0.04]'>
											<ChartColumn size={14} /> Compare the versions in
											Insights
										</Link>
										<button
											type='button'
											disabled={variant.promote.isPending}
											onClick={async () => {
												const ok = await confirm({
													title: 'Make version B the main page?',
													message:
														'B replaces the page’s draft and the test ends. Visitors see the current page until you publish.',
													confirmText: 'Make B the main page',
													tone: 'primary',
												});
												if (ok) {
													variant.promote.mutate(undefined, {
														onSuccess: () =>
															notify.success(
																'Version B is now the main page. Publish it to go live.',
															),
													});
												}
											}}
											className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-white/[0.04]'>
											<Trophy size={14} /> Make B the main page
										</button>
										<button
											type='button'
											disabled={variant.remove.isPending}
											onClick={async () => {
												const ok = await confirm({
													title: 'End the test and delete version B?',
													message:
														'Everyone sees the main page straight away. Its results stay in Insights.',
													confirmText: 'End test',
												});
												if (ok)
													variant.remove.mutate(undefined, {
														onSuccess: () =>
															notify.success('Test ended.'),
													});
											}}
											className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-500/10'>
											<X size={14} /> End test and delete B
										</button>
									</div>
								</>
							)}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default VariantMenu;
