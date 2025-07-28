/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ComboboxProvider as AriaComboboxProvider,
  Combobox as AriaCombobox,
  ComboboxPopover as AriaComboboxPopover,
  ComboboxItem as AriaComboboxItem,
  ComboboxDisclosure,
  type ComboboxProviderProps,
  type ComboboxProps as AriaComboboxProps,
  type ComboboxPopoverProps as AriaComboboxPopoverProps,
  type ComboboxItemProps as AriaComboboxItemProps,
  useComboboxContext,
  useComboboxStore,
  useStoreState,
} from '@ariakit/react';
import clsx from 'clsx';
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  use,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useState,
  type FocusEvent,
  type Ref,
} from 'react';
import './Combobox.css';

interface SearchContextValue {
  matches: string[];
  registerItem: (value: string, searchData?: Record<string, any>) => void;
  unregisterItem: (value: string) => void;
  isItemVisible: (value: string) => boolean;
}

const SearchContext = createContext<SearchContextValue>({
  matches: [],
  registerItem: () => {},
  unregisterItem: () => {},
  isItemVisible: () => true,
});

interface SearchOptions {
  caseSensitive?: boolean;
  searchFields?: string[];
}

interface SearchContextProviderProps {
  children: ReactNode;
  searchOptions?: SearchOptions;
  defaultValue?: string;
}

/**
 * SearchContextProvider - Manages search logic
 */
export function SearchContextProvider({
  children,
  searchOptions = {
    caseSensitive: false,
  },
  defaultValue,
}: SearchContextProviderProps) {
  const [registeredItems, setRegisteredItems] = useState<Set<string>>(new Set());
  const [itemsData, setItemsData] = useState<Map<string, Record<string, any>>>(new Map());
  const store = useComboboxContext();
  const searchValue = useStoreState(store, 'value') || '';
  const deferredValue = useDeferredValue(searchValue);

  const isObjectSearch = searchOptions.searchFields && searchOptions.searchFields.length > 0;

  const itemsList = useMemo(() => Array.from(registeredItems), [registeredItems]);

  const matches = useMemo(() => {
    if (deferredValue.trim() === '' || deferredValue === defaultValue) return itemsList;

    const searchTerm = searchOptions.caseSensitive ? deferredValue : deferredValue.toLowerCase();

    return itemsList.filter(value => {
      if (isObjectSearch) {
        const data = itemsData.get(value) || {};
        const searchableValues = searchOptions.searchFields!.map(field => data[field] || '').join(' ');
        const targetText = searchOptions.caseSensitive ? searchableValues : searchableValues.toLowerCase();
        return targetText.includes(searchTerm);
      }

      const targetText = searchOptions.caseSensitive ? value : value.toLowerCase();
      return targetText.includes(searchTerm);
    });
  }, [deferredValue, itemsList, defaultValue, isObjectSearch, itemsData, searchOptions]);

  const registerItem = useCallback((value: string, searchData?: Record<string, any>) => {
    setRegisteredItems(prev => new Set(prev).add(value));
    if (searchData && Object.keys(searchData).length > 0) {
      setItemsData(prev => new Map(prev).set(value, searchData));
    }
  }, []);

  const unregisterItem = useCallback((value: string) => {
    setRegisteredItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(value);
      return newSet;
    });
    setItemsData(prev => {
      const newMap = new Map(prev);
      newMap.delete(value);
      return newMap;
    });
  }, []);

  const isItemVisible = useCallback(
    (value: string) => {
      return matches.includes(value);
    },
    [matches],
  );

  const contextValue = useMemo(
    () => ({
      matches,
      registerItem,
      unregisterItem,
      isItemVisible,
    }),
    [matches, registerItem, unregisterItem, isItemVisible],
  );

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
}

export function ComboboxProvider({ children, ...props }: ComboboxProviderProps) {
  return <AriaComboboxProvider {...props}>{children}</AriaComboboxProvider>;
}

export interface ComboboxProps extends AriaComboboxProps {
  defaultValue?: string;
}

/**
 * ComboboxInput - Basic input component that handles search value and blur logic
 */
export const ComboboxInput = ({ onBlur, onKeyDown, defaultValue, ref, ...props }: ComboboxProps & { ref?: React.Ref<HTMLInputElement> }) => {
  const store = useComboboxContext();
  const { matches } = use(SearchContext);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const selectedValue = store?.getState()?.selectedValue;
      const value = store?.getState()?.value;

      if (value !== undefined && !matches.includes(value)) {
        if (selectedValue) {
          store?.setValue(selectedValue as string);
        } else if (defaultValue) {
          store?.setValue(defaultValue);
        }
      } else if (value && matches.includes(value)) {
        store?.setSelectedValue?.(value);
      }

      onBlur?.(event);
    },
    [store, onBlur, matches, defaultValue],
  );

  return <AriaCombobox ref={ref} {...props} onBlur={handleBlur} onKeyDown={onKeyDown} className={clsx('dbv-kit-combobox', props.className)} />;
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
 * Automatically registers/unregisters itself for search
 */
export function ComboboxItem({ value, searchData, ref, ...props }: ComboboxItemProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { registerItem, unregisterItem, isItemVisible } = use(SearchContext);

  useLayoutEffect(() => {
    if (value === undefined) return;
    registerItem(value, searchData);
    return () => unregisterItem(value);
  }, [registerItem, unregisterItem, value, searchData]);

  const isVisible = value != null && isItemVisible(value);

  if (!isVisible) return null;

  return <AriaComboboxItem ref={ref} {...props} value={value} className={clsx('dbv-kit-combobox__item', props.className)} />;
}

export interface ComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * ComboboxEmpty - Shows when no search matches are found
 */
export function ComboboxEmpty(props: ComboboxEmptyProps) {
  const { matches } = use(SearchContext);

  if (matches && matches.length > 0) return null;

  return <div ref={props.ref} {...props} className={clsx('dbv-kit-combobox__empty', props.className)} />;
}

export interface ComboboxRootProps {
  children: ReactNode;
  defaultValue?: string;
  searchOptions?: SearchOptions;
  comboboxProps?: ComboboxProviderProps;
  className?: string;
}

/**
 * ComboboxRoot - Wrapper that combines all providers
 */
export function ComboboxRoot({ children, defaultValue, searchOptions, comboboxProps, className }: ComboboxRootProps) {
  return (
    <ComboboxProvider defaultValue={defaultValue} {...comboboxProps}>
      <SearchContextProvider defaultValue={defaultValue} searchOptions={searchOptions}>
        <div className={clsx('dbv-kit-combobox__root', className)}>{children}</div>
      </SearchContextProvider>
    </ComboboxProvider>
  );
}

export { useComboboxContext, useComboboxStore, useStoreState, ComboboxDisclosure, type ComboboxProviderProps };
