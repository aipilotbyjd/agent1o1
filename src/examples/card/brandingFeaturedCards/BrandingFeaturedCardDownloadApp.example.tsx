// @start-snippet:: brandingFeaturedCardDownloadAppExampleSource
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';

const BrandingFeaturedCardDownloadAppExample = () => {
	return (
		<div className='grid grid-cols-12 gap-4'>
			<div className='col-span-12 lg:col-span-4'>
				<Card className='h-full'>
					<CardBody>
						<div className='flex flex-col items-center justify-center gap-4 py-8'>
							<Icon icon='AppStore' size='text-8xl' color='blue' />
							<div className='text-lg font-bold'>iOS App</div>
							<div className='text-zinc-500'>
								Boltify App is an easier way to work with iOS.
							</div>
							<Button aria-label='View website'>View website</Button>
							<Button
								variant='outline'
								rightIcon='ArrowRight01'
								aria-label='Download with AppStore'>
								Download with AppStore
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 lg:col-span-4'>
				<Card className='h-full'>
					<CardBody>
						<div className='flex flex-col items-center justify-center gap-4 py-8'>
							<Icon icon='Apple' size='text-8xl' />
							<div className='text-lg font-bold'>macOS App</div>
							<div className='text-zinc-500'>
								Boltify App is an easier way to work with macOS.
							</div>
							<Button aria-label='View website'>View website</Button>
							<Button
								variant='outline'
								rightIcon='ArrowRight01'
								aria-label='Download with AppStore'>
								Download with AppStore
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
			<div className='col-span-12 lg:col-span-4'>
				<Card className='h-full'>
					<CardBody>
						<div className='flex flex-col items-center justify-center gap-4 py-8'>
							<Icon icon='PlayStore' size='text-8xl' color='emerald' />
							<div className='text-lg font-bold'>Android App</div>
							<div className='text-zinc-500'>
								Boltify App is an easier way to work with Android.
							</div>
							<Button aria-label='View website'>View website</Button>
							<Button
								variant='outline'
								rightIcon='ArrowRight01'
								aria-label='Download with Play Store'>
								Download with Play Store
							</Button>
						</div>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};

export default BrandingFeaturedCardDownloadAppExample;
// @end-snippet:: brandingFeaturedCardDownloadAppExampleSource
