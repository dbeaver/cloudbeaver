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
  ComboboxCancel,
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

export interface ComboboxProps extends Omit<AriaComboboxProps, 'size'> {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export function ComboboxInput({ size, ...props }: ComboboxProps): React.JSX.Element {
  return <Combobox {...props} className={clsx('dbv-kit-combobox', `dbv-kit-combobox--${size ?? 'medium'}`, props.className)} autoSelect />;
}

export interface ComboboxPopoverProps extends AriaComboboxPopoverProps {
  children?: React.ReactNode;
}

/**
 * ComboboxPopover - Wrapper around AriaKit's popover with default styles
 */
export function ComboboxPopover({ children, className, ...props }: ComboboxPopoverProps): React.JSX.Element {
  return (
    <AriaComboboxPopover gutter={8} className={clsx('dbv-kit-combobox__popover', className)} portal sameWidth unmountOnHide {...props}>
      {children}
    </AriaComboboxPopover>
  );
}

export function ComboboxItem(props: ComboboxItemProps): React.JSX.Element {
  return <AriaComboboxItem {...props} className={clsx('dbv-kit-combobox__item', props.className)} />;
}

export {
  useComboboxContext,
  useComboboxStore,
  useStoreState,
  ComboboxDisclosure,
  ComboboxCancel,
  ComboboxValue,
  ComboboxProvider,
  type ComboboxProviderProps,
  type ComboboxValueProps,
};
