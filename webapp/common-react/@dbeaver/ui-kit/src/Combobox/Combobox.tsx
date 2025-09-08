/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ComboboxProvider,
  Combobox,
  ComboboxPopover as AriaComboboxPopover,
  ComboboxItem as AriaComboboxItem,
  ComboboxDisclosure,
  ComboboxValue,
  type ComboboxValueProps,
  type ComboboxProviderProps,
  type ComboboxProps as AriaComboboxProps,
  type ComboboxPopoverProps as AriaComboboxPopoverProps,
  type ComboboxItemProps,
  useComboboxContext,
  useComboboxStore,
  useStoreState,
} from '@ariakit/react';
import clsx from 'clsx';
import './Combobox.css';

export function ComboboxInput(props: AriaComboboxProps) {
  return <Combobox {...props} className={clsx('dbv-kit-combobox', props.className)} autoSelect />;
}

export interface ComboboxPopoverProps extends AriaComboboxPopoverProps {
  children?: React.ReactNode;
}

/**
 * ComboboxPopover - Wrapper around AriaKit's popover with default styles
 */
export function ComboboxPopover({ children, className, ...props }: ComboboxPopoverProps) {
  return (
    <AriaComboboxPopover gutter={8} portal sameWidth unmountOnHide className={clsx('dbv-kit-combobox__popover', className)} {...props}>
      {children}
    </AriaComboboxPopover>
  );
}

export function ComboboxItem(props: ComboboxItemProps) {
  return <AriaComboboxItem {...props} className={clsx('dbv-kit-combobox__item', props.className)} />;
}

export {
  useComboboxContext,
  useComboboxStore,
  useStoreState,
  ComboboxDisclosure,
  ComboboxValue,
  ComboboxProvider,
  type ComboboxProviderProps,
  type ComboboxValueProps,
};
