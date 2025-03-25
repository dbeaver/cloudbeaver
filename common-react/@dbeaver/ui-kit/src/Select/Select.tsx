/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

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

export function Select({ className, ...props }: SelectProps) {
  return <AriaSelect className={`dbv-kit-select ${className || ''}`} {...props} />;
}

export function SelectPopover({ children, className, ...props }: SelectPopoverProps) {
  return (
    <AriaSelectPopover className={`dbv-kit-select__popover ${className || ''}`} sameWidth={props.sameWidth ?? true} {...props}>
      {children}
    </AriaSelectPopover>
  );
}

export function SelectItem({ children, className, ...props }: SelectItemProps) {
  return (
    <AriaSelectItem className={`dbv-kit-select__item ${className || ''}`} {...props}>
      {children}
    </AriaSelectItem>
  );
}

export function SelectLabel({ children, className, ...props }: SelectLabelProps) {
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
