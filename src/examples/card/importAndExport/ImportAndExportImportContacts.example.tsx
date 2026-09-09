// @start-snippet:: importAndExportImportContactsExampleSource
import Card, {
	CardBody,
	CardHeader,
	CardHeaderChild,
	CardSubTitle,
	CardTitle,
} from '@/components/ui/Card';
import EXAMPLE from '@/examples/_index';

const ImportAndExportImportContactsExample = () => {
	return (
		<Card>
			<CardHeader>
				<CardHeaderChild>
					<CardTitle iconProps={{ icon: 'FileImport', size: 'text-3xl', color: 'amber' }}>
						Import contacts
					</CardTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<EXAMPLE.PageSections.ListGroup.LogoWithButton />
				<hr className='border-dashed border-zinc-500/25' />
			</CardBody>
			<CardHeader>
				<CardHeaderChild>
					<CardSubTitle>Import contacts</CardSubTitle>
				</CardHeaderChild>
			</CardHeader>
			<CardBody>
				<EXAMPLE.Forms.FileUploads.SimpleDragDrop />
			</CardBody>
		</Card>
	);
};

export default ImportAndExportImportContactsExample;
// @end-snippet:: importAndExportImportContactsExampleSource
