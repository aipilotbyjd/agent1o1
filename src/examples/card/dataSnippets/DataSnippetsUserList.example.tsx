// @start-snippet:: dataSnippetsUserListExampleSource
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';

const DataSnippetsUserListExample = () => {
	return (
		<>
			<Card>
				<CardBody>
					<div className='flex items-center gap-4'>
						<Icon icon='EditTable' color='emerald' size='text-3xl' />
						<div className=''>
							<div>user-list.xlsx</div>
							<div className='text-xs text-zinc-500'>136kb</div>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardBody>
					<div className='flex items-center gap-4'>
						<Icon icon='File01' color='blue' size='text-3xl' />
						<div className=''>
							<div>user-list.docx</div>
							<div className='text-xs text-zinc-500'>635kb</div>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardBody>
					<div className='flex items-center gap-4'>
						<Icon icon='Pdf01' color='red' size='text-3xl' />
						<div className=''>
							<div>user-list.pdf</div>
							<div className='text-xs text-zinc-500'>42kb</div>
						</div>
					</div>
				</CardBody>
			</Card>
			<Card>
				<CardBody>
					<div className='flex items-center gap-4'>
						<Icon icon='EditTable' color='emerald' size='text-3xl' />
						<div className=''>
							<div>user-list.csv</div>
							<div className='text-xs text-zinc-500'>136kb</div>
						</div>
					</div>
				</CardBody>
			</Card>
		</>
	);
};

export default DataSnippetsUserListExample;
// @end-snippet:: dataSnippetsUserListExampleSource
