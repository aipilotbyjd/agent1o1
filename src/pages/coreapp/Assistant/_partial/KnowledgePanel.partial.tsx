import { Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import { useBrand } from '@/context/brand';
import pages from '@/Routes/pages';
import useResolvePath from '@/hooks/useResolvePath';

/**
 * The knowledge base is the assistant's Brain: it searches the member's
 * private knowledge and the workspace's shared knowledge.
 */
const KnowledgePanelPartial = () => {
	const brand = useBrand();
	const { resolvePath } = useResolvePath();

	return (
		<div className='flex flex-col gap-2'>
			<p className='px-2 text-xs font-semibold tracking-wide text-zinc-400 uppercase'>
				Knowledge
			</p>
			<p className='px-2 text-[11px] text-zinc-500'>
				{brand.name} searches your private knowledge and the workspace's shared knowledge
				base. Add notes, files, pages and synced apps there.
			</p>
			<Link
				to={resolvePath(pages.workspace.subPages!.knowledge.to)}
				className='inline-flex items-center gap-2 px-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'>
				<BookOpen className='h-3.5 w-3.5' />
				Open the knowledge base
			</Link>
		</div>
	);
};

export default KnowledgePanelPartial;
