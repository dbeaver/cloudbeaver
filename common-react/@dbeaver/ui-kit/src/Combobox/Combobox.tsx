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
} from '@ariakit/react';
import clsx from 'clsx';
import { createContext, type HTMLAttributes, type ReactNode, use, useMemo, type FocusEvent, type Ref, useDeferredValue } from 'react';
import './Combobox.css';

interface SearchOptions {
  searchFields?: string[];
}

interface SearchContextValue {
  searchValue: string;
  searchOptions: SearchOptions;
  defaultValue?: string;
}

const SearchContext = createContext<SearchContextValue>({
  searchValue: '',
  searchOptions: {},
});

interface ComboboxSearchContextProviderProps {
  children: ReactNode;
  searchOptions?: SearchOptions;
  defaultValue?: string;
}

/**
 * SearchContextProvider - Provides search context
 */
export function ComboboxSearchContextProvider({ children, searchOptions = {}, defaultValue }: ComboboxSearchContextProviderProps) {
  const store = useComboboxContext();
  const searchValue = useStoreState(store, 'value') || '';
  const deferredValue = useDeferredValue(searchValue);

  const contextValue = useMemo(
    () => ({
      searchValue: deferredValue,
      searchOptions,
      defaultValue,
    }),
    [deferredValue, searchOptions, defaultValue],
  );

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
}

export interface ComboboxProps extends AriaComboboxProps {
  defaultValue?: string;
  valueFormatter?: (value: string) => string;
}

/**
 * ComboboxInput - Basic input component that handles search value and blur logic
 * Restores the selected value if the input value is not in the items list
 * If only one item is available, it selects that item automatically
 */
export const ComboboxInput = ({
  onBlur,
  onKeyDown,
  onSelect,
  defaultValue,
  ref,
  valueFormatter,
  ...props
}: ComboboxProps & { ref?: React.Ref<HTMLInputElement> }) => {
  const store = useComboboxContext();

  function restoreInputValue() {
    if (!store) {
      console.error('ComboboxInput: store is not available');
      return;
    }
    const { selectedValue, items, value } = store.getState();
    if (typeof selectedValue !== 'string' || (value && value === selectedValue)) {
      return;
    }
    const itemsValues = new Set(items?.map(item => item.value));

    if (items.length === 1 || itemsValues.has(value)) {
      const nextValue = items.length === 1 ? items[0]!.value! : value;
      store.setSelectedValue(nextValue);
      store.setValue(valueFormatter ? valueFormatter(nextValue) : nextValue);
      store.setOpen(false);
    } else {
      const nextValue = (selectedValue || defaultValue) as string;
      if (nextValue !== undefined) {
        store.setValue(valueFormatter ? valueFormatter(nextValue) : nextValue);
      }
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
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

  return <AriaCombobox ref={ref} {...props} onBlur={handleBlur} onKeyDown={handleKeyDown} className={clsx('dbv-kit-combobox', props.className)} />;
};

export interface ComboboxPopoverProps extends AriaComboboxPopoverProps {
  children?: ReactNode;
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

export interface ComboboxItemProps extends AriaComboboxItemProps {
  searchData?: Record<string, any>;
}

/**
 * ComboboxItem - An option in the combobox popover
 * Uses the search state to determine visibility
 */
export function ComboboxItem({ value, searchData, ref, ...props }: ComboboxItemProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { searchValue, defaultValue, searchOptions } = use(SearchContext);

  const isVisible = useMemo(() => {
    if (!searchValue.trim() || searchValue === defaultValue) {
      return true;
    }

    const searchTerm = searchValue.toLowerCase();
    const isObjectSearch = searchOptions.searchFields && searchOptions.searchFields.length > 0;
    let targetText = '';

    if (isObjectSearch && searchData) {
      const searchableValues = searchOptions.searchFields!.map(field => searchData[field] || '').join(' ');
      targetText = searchableValues.toLowerCase();
    } else {
      targetText = value?.toLowerCase() ?? '';
    }
    return targetText.includes(searchTerm);
  }, [searchValue, defaultValue, searchOptions, value, searchData]);

  if (!isVisible) return null;

  return <AriaComboboxItem ref={ref} {...props} value={value} className={clsx('dbv-kit-combobox__item', props.className)} />;
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

export interface ComboboxRootProps {
  children: ReactNode;
  defaultValue?: string;
  searchOptions?: SearchOptions;
  comboboxProps?: ComboboxProviderProps;
  className?: string;
}

/**
 * ComboboxRoot - Wrapper that combines combobox and search context and creates a wrapper element
 */
export function ComboboxRoot({ children, defaultValue, searchOptions, comboboxProps, className }: ComboboxRootProps) {
  return (
    <ComboboxProvider defaultValue={defaultValue} {...comboboxProps}>
      <ComboboxSearchContextProvider defaultValue={defaultValue} searchOptions={searchOptions}>
        <div className={clsx('dbv-kit-combobox__root', className)}>{children}</div>
      </ComboboxSearchContextProvider>
    </ComboboxProvider>
  );
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
