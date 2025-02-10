import { Checkbox as AriaCheckbox, type CheckboxProps } from '@ariakit/react';
import './Checkbox.css';

interface UIKitCheckboxProps extends CheckboxProps {}

export function Checkbox({ className, children, disabled, ...props }: UIKitCheckboxProps) {
  return (
    <label className="checkbox-label">
      <AriaCheckbox disabled={disabled} className={className ?? '' + ' ' + 'checkbox'} {...props} />
      {children}
    </label>
  );
}
