/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useId, useState } from 'react';
import { ComboboxInput, ComboboxItem, clsx, Spinner, ComboboxPopover, ComboboxDisclosure, ComboboxProvider, ComboboxCancel } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { IconOrImage } from '../IconOrImage.js';
import { useTranslate } from '../localization/useTranslate.js';
import { Field } from './Field.js';
import { FieldDescription } from './FieldDescription.js';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';
import './Combobox.css';

export type ComboboxBaseProps<TKey, TValue> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue' | 'size'
> &
  ILayoutSizeProps & {
    items: TValue[];
    defaultValue?: TKey;
    loading?: boolean;
    description?: string;
    keySelector?: (item: TValue, index: number) => TKey;
    valueSelector?: (item: TValue) => string;
    titleSelector?: (item: TValue) => string | undefined;
    iconSelector?: (item: TValue) => string | React.ReactElement | undefined;
    isDisabled?: (item: TValue) => boolean;
    inline?: boolean;
    allowCustomValue?: boolean;
    allowClear?: boolean;
    size?: 'small' | 'medium' | 'large';
    onChange?: (value: string | null) => void;
  };

type ControlledProps<TKey, TValue> = ComboboxBaseProps<TKey, TValue> & {
  name?: string;
  value?: TKey;
  onSelect?: (value: TKey, name: string | undefined, prev: TKey) => void;
  state?: never;
};

type ObjectProps<TValue, TKey extends keyof TState, TState> = ComboboxBaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?: (value: TState[TKey], name: TKey | undefined, prev: TState[TKey]) => void;
  value?: never;
};

export interface ComboboxType {
  <TKey, TValue>(props: ControlledProps<TKey, TValue>): React.JSX.Element;
  <TValue, TKey extends keyof TState, TState>(props: ObjectProps<TValue, TKey, TState>): React.JSX.Element;
}

export const Combobox: ComboboxType = observer(function Combobox({
  value: controlledValue,
  defaultValue,
  name,
  state,
  items,
  loading,
  children,
  title,
  className,
  readOnly,
  disabled,
  inline,
  description,
  allowCustomValue = false,
  allowClear = false,
  keySelector = v => v,
  valueSelector = v => v as string,
  iconSelector,
  titleSelector,
  isDisabled,
  size,
  onSelect,
  onChange,
  ...rest
}: ControlledProps<unknown, unknown> | ObjectProps<unknown, string, Record<string, unknown>>) {
  const layoutProps = getLayoutProps(rest);
  const inputId = useId();
  rest = filterLayoutFakeProps(rest);
  const translate = useTranslate();
  const context = useContext(FormContext);

  let selectedKey: unknown = controlledValue ?? defaultValue ?? undefined;
  if (state && name !== undefined && name in state) {
    selectedKey = state[name];
  }

  const selectedItem = items.find((item, index) => keySelector(item, index) === selectedKey);
  const [internalInputValue, setInternalInputValue] = useState<string | null>(null);

  const inputValue: string | null = allowCustomValue ? ((selectedKey ?? null) as string | null) : internalInputValue;
  const selectedValue = selectedItem ? valueSelector(selectedItem) : '';
  const displayValue = inputValue ?? selectedValue;

  const filteredItems = items
    .map((item, index) => {
      const itemKey = String(keySelector(item, index));
      const itemValue = valueSelector(item);
      const itemTitle = titleSelector?.(item);
      const itemIcon = iconSelector?.(item);
      const itemDisabled = isDisabled?.(item);

      const isVisible =
        allowCustomValue || inputValue === null || !inputValue.trim() || itemValue.toLowerCase().includes(inputValue.trim().toLowerCase());

      return {
        item,
        index,
        itemKey,
        itemValue,
        itemTitle,
        itemIcon,
        itemDisabled,
        isVisible,
      };
    })
    .filter(({ isVisible }) => isVisible);

  const handleSelect = useCallback(
    (selectedValue: string | string[] | null) => {
      const item = items.find((item, idx) => keySelector(item, idx) === selectedValue);
      if ((!item || selectedValue === selectedKey) && !allowClear) {
        return;
      }

      if (name !== undefined && state) {
        state[name] = selectedValue;
      }
      if (onSelect) {
        onSelect(selectedValue, name as undefined, selectedKey);
      }
      if (context) {
        context.change(typeof selectedValue === 'string' ? selectedValue : '', name);
      }
    },
    [items, selectedKey, allowClear, name, state, onSelect, context, keySelector],
  );

  const icon: string | React.ReactElement | undefined = selectedItem ? iconSelector?.(selectedItem) : undefined;

  const comboboxDefaultSelectedValue = defaultValue;
  let comboboxDefaultValue: string | undefined = undefined;

  if (comboboxDefaultSelectedValue !== undefined) {
    const defaultItem = items.find((item, index) => keySelector(item, index) === comboboxDefaultSelectedValue);

    if (defaultItem) {
      comboboxDefaultValue = valueSelector(defaultItem);
    }
  }

  function setInputValue(value: string | null) {
    setInternalInputValue(value);
    onChange?.(value);
  }

  function handleBlur() {
    if (!allowCustomValue) {
      setInputValue(null);
    }
  }

  function handleSetValueOnClick() {
    if (allowCustomValue) {
      return true;
    }
    setInputValue(null);
    return false;
  }

  const displayPopover = !allowCustomValue || items.length > 0;
  const hasCancelButton = !!displayValue && allowClear && !disabled && !readOnly;

  return (
    <Field {...layoutProps} className={clsx(className, inline && 'tw:flex tw:items-center')}>
      {children && (
        <FieldLabel
          required={rest.required}
          htmlFor={inputId}
          title={title}
          className={clsx('theme-typography--body1', 'tw:block tw:font-medium!', inline ? 'tw:mr-2' : 'tw:pb-2.5')}
        >
          {children}
        </FieldLabel>
      )}
      <ComboboxProvider
        value={displayValue}
        setValue={setInputValue}
        selectedValue={selectedValue}
        defaultValue={comboboxDefaultValue}
        defaultSelectedValue={comboboxDefaultSelectedValue as string}
        setSelectedValue={handleSelect}
      >
        <div className="tw:relative tw:flex tw:flex-1 tw:items-center tw:gap-2">
          <ComboboxInput
            defaultValue={comboboxDefaultValue}
            disabled={disabled || loading || readOnly}
            readOnly={readOnly}
            placeholder={rest.placeholder}
            className={clsx(
              'theme-typography--caption  tw:tracking-normal!',
              icon || loading ? 'tw:pl-8!' : '',
              hasCancelButton ? 'tw:pr-12!' : 'tw:pr-6!',
            )}
            title={title}
            id={inputId}
            size={size}
            onBlur={handleBlur}
            {...rest}
          />
          {loading ? (
            <Spinner size="small" className="tw:absolute tw:right-2 tw:top-[50%] tw:-translate-y-1/2" />
          ) : (
            <>
              {hasCancelButton && (
                <ComboboxCancel
                  className="tw:absolute tw:right-8 tw:top-[50%] tw:-translate-y-1/2 tw:cursor-pointer tw:hover:bg-gray-200 tw:rounded"
                  onClick={() => handleSelect(null)}
                />
              )}
              {displayPopover && <ComboboxDisclosure disabled={disabled || loading || readOnly} className="cb-combobox__disclosure-icon" />}
            </>
          )}
          {icon && <div className="tw:absolute tw:left-3 tw:w-4 tw:h-4">{typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}</div>}
          {displayPopover && (
            <ComboboxPopover className="theme-text-on-surface theme-background-surface theme-typography--caption">
              {filteredItems.length > 0 ? (
                filteredItems.map(({ itemKey, itemValue, itemTitle, itemIcon, itemDisabled }) => (
                  <ComboboxItem
                    key={itemKey}
                    value={itemKey}
                    disabled={itemDisabled}
                    title={itemTitle}
                    setValueOnClick={handleSetValueOnClick}
                    className={clsx({
                      'tw:cursor-pointer': !itemDisabled,
                      'tw:cursor-not-allowed': itemDisabled,
                    })}
                  >
                    {iconSelector && (
                      <div className="tw:w-4 tw:h-4 tw:shrink-0">
                        {itemIcon && typeof itemIcon === 'string' ? <IconOrImage icon={itemIcon} /> : itemIcon}
                      </div>
                    )}
                    <div className="tw:truncate">{itemValue}</div>
                  </ComboboxItem>
                ))
              ) : (
                <div className="tw:p-2">{translate('combobox_no_results_placeholder')}</div>
              )}
            </ComboboxPopover>
          )}
        </div>
      </ComboboxProvider>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
