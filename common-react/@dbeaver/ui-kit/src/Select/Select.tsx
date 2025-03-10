import {
  SelectProvider as AriaSelectProvider,
  Select as AriaSelect,
  SelectPopover as AriaSelectPopover,
  SelectItem as AriaSelectItem,
  SelectLabel as AriaSelectLabel,
  SelectValue as AriaSelectValue,
  SelectArrow as AriaSelectArrow,
  type SelectProviderProps,
  type SelectProps,
  type SelectLabelProps,
  type SelectPopoverProps,
  type SelectItemProps,
  type SelectValueProps,
  type SelectArrowProps,
  useSelectContext,
  useSelectStore,
} from '@ariakit/react';

import './Select.css';

export function SelectProvider({ children, ...props }: SelectProviderProps) {
  return <AriaSelectProvider {...props}>{children}</AriaSelectProvider>;
}

export function Select({ className, ref, ...props }: SelectProps) {
  return <AriaSelect ref={ref} className={`dbv-kit-select ${className || ''}`} {...props} />;
}

export function SelectPopover({ children, ref, className, ...props }: SelectPopoverProps) {
  return (
    <AriaSelectPopover ref={ref} className={`dbv-kit-select__popover ${className || ''}`} sameWidth={props.sameWidth ?? true} {...props}>
      {children}
    </AriaSelectPopover>
  );
}

export function SelectItem({ children, ref, className, ...props }: SelectItemProps) {
  return (
    <AriaSelectItem ref={ref} className={`dbv-kit-select__item ${className || ''}`} {...props}>
      {children}
    </AriaSelectItem>
  );
}

export function SelectLabel({ children, ref, className, ...props }: SelectLabelProps) {
  return (
    <AriaSelectLabel className={`dbv-kit-select__label ${className || ''}`} {...props}>
      {children}
    </AriaSelectLabel>
  );
}

export {
  useSelectContext,
  useSelectStore,
  type SelectProviderProps,
  type SelectProps,
  type SelectLabelProps,
  type SelectPopoverProps,
  type SelectItemProps,
  type SelectValueProps,
  type SelectArrowProps,
};

Select.Provider = SelectProvider;
Select.Popover = SelectPopover;
Select.Item = SelectItem;
Select.Label = SelectLabel;
Select.Value = AriaSelectValue;
Select.Arrow = AriaSelectArrow;
