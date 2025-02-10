import { Checkbox as AriaCheckbox, type CheckboxProps } from '@ariakit/react';
import './Checkbox.css';

interface UIKitCheckboxProps extends CheckboxProps {
  children?: React.ReactNode;
  Label?: React.ReactNode;
}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <label className="checkbox-label">
      <AriaCheckbox className={className ?? '' + ' ' + 'checkbox'} {...props} />
      {children}
    </label>
  );
}
