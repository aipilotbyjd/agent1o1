import {
	Children,
	cloneElement,
	FC,
	FunctionComponent,
	isValidElement,
	ReactElement,
	ReactNode,
} from 'react';
import classNames from 'classnames';
import { IButtonProps } from '@/components/ui/Button';
import { IInputBaseProps, TInputDimension } from './Input';

// @start-snippet:: interface
interface IInputGroupProps {
	children: ReactNode;
	className?: string;
	dimension?: TInputDimension;
}
// @end-snippet:: interface
const InputGroup: FC<IInputGroupProps> = (props) => {
	const { children, className, dimension, ...rest } = props;

	const classes = classNames(
		className,
		'flex rounded-lg [&_*]:!rounded-none',
		'[&>*]:first:[&_input]:!rounded-s-lg [&>input]:first:!rounded-s-lg',
		'[&>*]:first:[&_button]:!rounded-s-lg [&>button]:first:!rounded-s-lg',
		'[&>*]:first:[&_select]:!rounded-s-lg [&>select]:first:!rounded-s-lg',
		'[&>*]:last:[&_input]:!rounded-e-lg [&>input]:last:!rounded-e-lg',
		'[&>*]:last:[&_button]:!rounded-e-lg [&>button]:last:!rounded-e-lg',
		'[&>*]:last:[&_select]:!rounded-e-lg [&>select]:last:!rounded-e-lg',
	);

	return (
		<div className={classes} {...rest}>
			{Children.map(children, (child) => {
				if (!isValidElement(child)) return child;

				if (
					['Button', 'Input'].includes(
						(child.type as FunctionComponent).displayName as string,
					)
				) {
					return cloneElement(child as ReactElement<IInputBaseProps | IButtonProps>, {
						dimension,
					});
				}

				return child;
			})}
		</div>
	);
};
InputGroup.displayName = 'InputGroup';

export default InputGroup;
