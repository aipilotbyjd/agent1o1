import { useRef, useState } from 'react';
import Header, { HeaderLeft } from '@/components/layout/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import pages from '@/Routes/pages';
import Icon from '@/components/icon/Icon';
import Container from '@/components/layout/Container';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import PreviewComponent from '@/components/utils/PreviewComponent';
import Tree, { TreeProps } from 'rc-tree';
import basicUsage from './_md/basicUsage.md';

const TreeViewPage = () => {
	const treeData = [
		{
			key: '1',
			title: 'Parent 1',
			children: [
				{
					key: '1-1',
					title: 'Parent 1.1',
					children: [
						{ key: '1-1-1', title: 'Parent 1.1.1' },
						{ key: '1-1-2', title: 'Parent 1.1.2' },
					],
				},
				{
					key: '1-2',
					title: 'Parent 1.2',
					children: [
						{ key: '1-2-1', title: 'Parent 1.2.1' },
						{ key: '1-2-2', title: 'Parent 1.2.2' },
						{ key: '1-2-3', title: 'Parent 1.2.3' },
						{ key: '1-2-4', title: 'Parent 1.2.4' },
						{ key: '1-2-5', title: 'Parent 1.2.5' },
						{ key: '1-2-6', title: 'Parent 1.2.6' },
						{ key: '1-2-7', title: 'Parent 1.2.7' },
						{ key: '1-2-8', title: 'Parent 1.2.8' },
						{ key: '1-2-9', title: 'Parent 1.2.9' },
					],
				},
				{
					key: '1-3',
					title: 'Parent 1.3 (Disable)',
					disableCheckbox: true,
					children: [
						{ key: '1-3-1', title: 'Parent 1.3.1 (Disable)', disableCheckbox: true },
						{ key: '1-3-2', title: 'Parent 1.3.2 (Disable)', disableCheckbox: true },
					],
				},
			],
		},
	];

	const keys = ['1-2-2', '1-2-7', '1-2-8'];

	const [defaultSelectedKeys] = useState(keys);
	const [defaultCheckedKeys] = useState(keys);

	const selKeyRef = useRef(null);

	const onExpand: TreeProps['onExpand'] = (expandedKeys) => {
		console.log('onExpand', expandedKeys);
	};

	const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
		console.log('selected', selectedKeys, info);
		// @ts-ignore
		selKeyRef.current = info.node.props.eventKey;
	};

	const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
		console.log('onCheck', checkedKeys, info);
	};

	return (
		<>
			<Header>
				<HeaderLeft className='flex-col items-start!'>
					<Breadcrumb
						list={[
							{ ...pages.documentation.baseComponent },
							{ ...pages.documentation.baseComponent.subPages.treeView },
						]}
					/>
					<div className='flex items-center gap-4 py-8'>
						<Icon
							icon={pages.documentation.baseComponent.subPages.treeView.icon}
							size='text-4xl'
						/>
						<span className='text-4xl font-bold'>
							{pages.documentation.baseComponent.subPages.treeView.text}
						</span>
					</div>
				</HeaderLeft>
			</Header>
			<Container>
				<div className='flex flex-col gap-8'>
					<div className='text-2xl text-zinc-500'>
						The tree view uses the{' '}
						<a
							target='_blank'
							href='https://www.npmjs.com/package/rc-tree'
							rel='noreferrer'
							className='text-blue-500 underline decoration-wavy underline-offset-2'>
							"rc-tree"
						</a>{' '}
						component, you can use all its features.
					</div>
					<div className='text-3xl font-bold'>Usage</div>
					<Card>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle
									iconProps={{
										icon: 'BookOpen02',
										color: 'emerald',
										size: 'text-3xl',
									}}>
									Basic usage
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							<div className='text-zinc-500'>
								Basic Tree View example to expand and collapse the treeview node.
							</div>
							<PreviewComponent mdFile={basicUsage as RequestInfo} inIFrame={false}>
								<Tree
									showLine
									checkable
									selectable={false}
									defaultExpandAll
									onExpand={onExpand}
									defaultSelectedKeys={defaultSelectedKeys}
									defaultCheckedKeys={defaultCheckedKeys}
									onSelect={onSelect}
									onCheck={onCheck}
									treeData={treeData}
								/>
							</PreviewComponent>
						</CardBody>
					</Card>
				</div>
			</Container>
		</>
	);
};

export default TreeViewPage;
