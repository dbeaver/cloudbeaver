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
import {
  createContext,
  type Dispatch,
  type HTMLAttributes,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useState,
  type FocusEvent,
  type Ref,
} from 'react';
import './Combobox.css';

const ComboboxSearchContext = createContext<{
  matches?: string[];
  setList?: Dispatch<SetStateAction<string[]>>;
}>({});

export function ComboboxProvider({ children, ...props }: ComboboxProviderProps) {
  return <AriaComboboxProvider {...props}>{children}</AriaComboboxProvider>;
}

export interface ComboboxProps extends AriaComboboxProps {
  children?: ReactNode;
  defaultValue?: string;
  setValue?: ComboboxProviderProps['setValue'];
}

const ComboboxInput = ({
  children,
  onBlur,
  onKeyDown,
  defaultValue,
  ref,
  ...props
}: Omit<ComboboxProps, 'setValue'> & { ref?: React.Ref<HTMLInputElement> }) => {
  const [list, setList] = useState<string[]>([]);
  const store = useComboboxContext();
  const searchValue = useStoreState(store, 'value') || '';
  const deferredValue = useDeferredValue(searchValue);
  const fuse = useMemo(() => {
    return new Fuse(list, { includeScore: false, threshold: 0.3 });
  }, [list]);
  const matches = useMemo(() => {
    if (!deferredValue || deferredValue === defaultValue) return list;
    return fuse.search(deferredValue).map(result => result.item);
  }, [fuse, deferredValue, list]);
  const contextValue = useMemo(() => ({ matches, setList }), [matches]);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      const selectedValue = store?.getState()?.selectedValue;
      const value = store?.getState()?.value;

      if (value !== undefined && !list.includes(value)) {
        if (selectedValue) {
          store?.setValue(selectedValue as string);
        } else if (defaultValue) {
          store?.setValue(defaultValue);
        }
      } else if (value && list.includes(value)) {
        store?.setSelectedValue?.(value);
      }

      onBlur?.(event);
    },
    [store, onBlur, list],
  );

  return (
    <>
      <AriaCombobox ref={ref} {...props} onBlur={handleBlur} onKeyDown={onKeyDown} className={clsx('dbv-kit-combobox', props.className)} />
      <AriaComboboxPopover gutter={8} portal sameWidth unmountOnHide className="dbv-kit-combobox__popover">
        <ComboboxSearchContext.Provider value={contextValue}>{children}</ComboboxSearchContext.Provider>
      </AriaComboboxPopover>
    </>
  );
};

export function Combobox({ defaultValue, setValue, ref, ...props }: ComboboxProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <ComboboxProvider defaultValue={defaultValue} setValue={setValue}>
      <ComboboxInput defaultValue={defaultValue} ref={ref} {...props} />
      <AriakitComboboxDisclosure className="tw:absolute tw:right-2 tw:top-2 tw:*:fill-none! tw:cursor-pointer" />
    </ComboboxProvider>
  );
}

export interface ComboboxItemProps extends AriaComboboxItemProps {}

export function ComboboxItem({ value, ref, ...props }: ComboboxItemProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { matches, setList } = useContext(ComboboxSearchContext);

  useLayoutEffect(() => {
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
}

export interface ComboboxEmptyProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

export function ComboboxEmpty(props: ComboboxEmptyProps) {
  const { matches } = useContext(ComboboxSearchContext);

  if (matches?.length) return null;

  return <div ref={props.ref} {...props} className={clsx('dbv-kit-combobox__empty', props.className)} />;
}

export { useComboboxContext, useComboboxStore, useStoreState, type ComboboxProviderProps, type ComboboxPopoverProps };
