// @start-snippet:: formsFileUploadExampleSource
import Icon from '@/components/icon/Icon';

const FileUploadSimpleDragDropExample = () => {
	return (
		<>
			<div className='flex justify-center rounded-lg border-2 border-dashed border-zinc-500/25 px-6 py-10 dark:border-zinc-500/50'>
				<div className='text-center'>
					<Icon icon='Album02' color='zinc' className='mx-auto h-12 w-12' />
					<div className='mt-4 flex text-sm leading-6 text-zinc-500'>
						<label
							htmlFor='file-upload'
							className='relative cursor-pointer rounded-md font-semibold text-blue-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 focus-within:ring-offset-transparent focus-within:outline-hidden hover:text-blue-600'>
							<span>Upload a file</span>
							<input
								aria-label='File upload'
								id='file-upload'
								name='file-upload'
								type='file'
								className='sr-only'
							/>
						</label>
						<span className='pl-1'>or drag and drop</span>
					</div>
					<p className='text-xs leading-5 text-zinc-500'>PNG, JPG, GIF up to 10MB</p>
				</div>
			</div>
		</>
	);
};

export default FileUploadSimpleDragDropExample;
// @end-snippet:: formsFileUploadExampleSource
