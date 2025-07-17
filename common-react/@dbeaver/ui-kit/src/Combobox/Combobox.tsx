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
  ComboboxDisclosure as AriakitComboboxDisclosure,
  type ComboboxProviderProps,
  type ComboboxProps as AriaComboboxProps,
  type ComboboxPopoverProps,
  type ComboboxItemProps as AriaComboboxItemProps,
  useComboboxContext,
  useComboboxStore,
  useStoreState,
} from '@ariakit/react';
import clsx from 'clsx';
import Fuse from 'fuse.js';
import * as React from 'react';
import './Combobox.css';

const ComboboxSearchContext = React.createContext<{
  matches?: string[];
  setList?: React.Dispatch<React.SetStateAction<string[]>>;
}>({});

export function ComboboxProvider({ children, ...props }: ComboboxProviderProps) {
  return <AriaComboboxProvider {...props}>{children}</AriaComboboxProvider>;
}

export interface ComboboxProps extends AriaComboboxProps {
  children?: React.ReactNode;
  defaultValue?: string;
  setValue?: ComboboxProviderProps['setValue'];
}

const ComboboxInput = React.forwardRef<HTMLInputElement, Omit<ComboboxProps, 'setValue'>>(function ComboboxInput(
  { children, onBlur, onKeyDown, defaultValue, ...props },
  ref,
) {
  const [list, setList] = React.useState<string[]>([]);
  const store = useComboboxContext();
  const searchValue = useStoreState(store, 'value') || '';
  const deferredValue = React.useDeferredValue(searchValue);
  const fuse = React.useMemo(() => {
    return new Fuse(list, { includeScore: false, threshold: 0.3 });
  }, [list]);
  const matches = React.useMemo(() => {
    if (!deferredValue || deferredValue === defaultValue) return list;
    return fuse.search(deferredValue).map(result => result.item);
  }, [fuse, deferredValue, list]);
  const contextValue = React.useMemo(() => ({ matches, setList }), [matches]);

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      //TODO: reset value if it is not in the list
      console.log('ComboboxInput handleBlur', deferredValue, store);

      onBlur?.(event);
    },
    [store, deferredValue, onBlur],
  );

  return (
    <>
      <AriaCombobox ref={ref} {...props} onBlur={handleBlur} className={clsx('dbv-kit-combobox', props.className)} />
      <AriaComboboxPopover gutter={8} portal sameWidth unmountOnHide className="dbv-kit-combobox__popover">
        <ComboboxSearchContext.Provider value={contextValue}>{children}</ComboboxSearchContext.Provider>
      </AriaComboboxPopover>
    </>
  );
});

export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox({ defaultValue, setValue, ...props }, ref) {
  return (
    <ComboboxProvider defaultValue={defaultValue} setValue={setValue}>
      <ComboboxInput defaultValue={defaultValue} ref={ref} {...props} />
      <AriakitComboboxDisclosure className="tw:absolute tw:right-2 tw:top-2 tw:*:fill-none! tw:cursor-pointer" />
    </ComboboxProvider>
  );
});

export interface ComboboxItemProps extends AriaComboboxItemProps {}

export const ComboboxItem = React.forwardRef<HTMLDivElement, ComboboxItemProps>(function ComboboxItem({ value, onClick, ...props }, ref) {
  const { matches, setList } = React.useContext(ComboboxSearchContext);

  React.useLayoutEffect(() => {
    if (!setList) return;
    if (value == null) return;
    setList(list => [...list, value]);
    return () => {
      setList(list => list.filter(v => v !== value));
    };
  }, [setList, value]);

  const match = value != null && matches && matches?.includes(value);

  if (!match) return null;

  return <AriaComboboxItem ref={ref} {...props} value={value} className={clsx('dbv-kit-combobox__item', props.className)} />;
});

export interface ComboboxEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ComboboxEmpty = React.forwardRef<HTMLDivElement, ComboboxEmptyProps>(function ComboboxEmpty(props, ref) {
  const { matches } = React.useContext(ComboboxSearchContext);

  if (matches?.length) return null;

  return <div ref={ref} {...props} className={clsx('dbv-kit-combobox__empty', props.className)} />;
});

export { useComboboxContext, useComboboxStore, useStoreState, type ComboboxProviderProps, type ComboboxPopoverProps };
