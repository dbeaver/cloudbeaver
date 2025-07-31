/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ComboboxProvider,
  Combobox as AriaCombobox,
  ComboboxPopover as AriaComboboxPopover,
  ComboboxItem as AriaComboboxItem,
  ComboboxDisclosure,
  ComboboxValue,
  type ComboboxValueProps,
  type ComboboxProviderProps,
  type ComboboxProps as AriaComboboxProps,
  type ComboboxPopoverProps as AriaComboboxPopoverProps,
  type ComboboxItemProps as AriaComboboxItemProps,
  useComboboxContext,
  useComboboxStore,
  useStoreState,
  type ComboboxStoreState,
} from '@ariakit/react';
import clsx from 'clsx';
import { type HTMLAttributes, type Ref, useCallback } from 'react';
import './Combobox.css';

export interface ComboboxInputProps<T> extends AriaComboboxProps {
  defaultValue?: string;
  getInputFromItem?: (value: T) => string;
}

/**
 * ComboboxInput - Basic input component that handles search value and blur logic
 * Restores the selected value if the input value is not in the items list
 * If only one item is available, it selects that item automatically
 */
export function ComboboxInput<T = unknown>({
  onBlur,
  onKeyDown,
  defaultValue,
  ref,
  getInputFromItem,
  ...props
}: ComboboxInputProps<T> & { ref?: React.Ref<HTMLInputElement> }) {
  const store = useComboboxContext();

  function restoreInputValue() {
    const { selectedValue, items, value } = store!.getState();

    if (typeof selectedValue !== 'string' || (value === selectedValue && !getInputFromItem)) {
      return;
    }

    const nextValue = (selectedValue || defaultValue) as string;

    if (!nextValue) {
      return;
    }

    if (getInputFromItem) {
      const nextItem = (items?.find(item => item.value === nextValue) as ComboboxStoreState['items'][number] & { item: T })?.item;
      if (nextItem) {
        store!.setValue(getInputFromItem(nextItem));
        return;
      }
    }

    store!.setValue(nextValue);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    restoreInputValue();

    onBlur?.(event);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      restoreInputValue();
    }
    onKeyDown?.(event);
  }

  return (
    <AriaCombobox
      ref={ref}
      {...props}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={clsx('dbv-kit-combobox', props.className)}
      autoSelect
    />
  );
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

export interface ComboboxItemProps<T> extends AriaComboboxItemProps {
  item?: T;
  getInputFromItem?: (value: T) => string;
}

/**
 * ComboboxItem - An option in the combobox popover
 * Uses the search state to determine visibility
 */
export function ComboboxItem<T = unknown>({
  value,
  item,
  ref,
  getInputFromItem,
  ...props
}: ComboboxItemProps<T> & { ref?: React.Ref<HTMLDivElement> }) {
  const store = useComboboxContext();
  const searchValue = useStoreState(store, 'value') || '';
  const selectedValue = useStoreState(store, 'selectedValue') || '';

  const targetText = [value ?? '', item && getInputFromItem ? getInputFromItem(item) : ''].filter(Boolean).join(' ');
  const isVisible = searchValue === selectedValue || !searchValue.trim() || targetText.toLowerCase().includes(searchValue.trim().toLowerCase());
  const getItem = useCallback((data: any) => ({ ...data, item }), []);

  function setValueOnClick(event: React.MouseEvent<HTMLDivElement>) {
    if (getInputFromItem && item) {
      const nextValue = getInputFromItem(item);
      store!.setValue(nextValue);
      store!.setSelectedValue(nextValue);
      return false;
    }
    return true;
  }

  if (!isVisible) return null;

  return (
    <AriaComboboxItem
      setValueOnClick={setValueOnClick}
      getItem={getItem}
      ref={ref}
      {...props}
      value={value}
      className={clsx('dbv-kit-combobox__item', props.className)}
    />
  );
}

export interface ComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * ComboboxEmpty - Shows it's children when there's a search but no visible items
 */
export function ComboboxEmpty(props: ComboboxEmptyProps) {
  const store = useComboboxContext();
  const inputValue = useStoreState(store, 'value') || '';
  const items = useStoreState(store, 'items') || [];

  if (items.length === 0 && inputValue.trim()) {
    return <div ref={props.ref} {...props} className={clsx('dbv-kit-combobox__empty', props.className)} />;
  }

  return null;
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
