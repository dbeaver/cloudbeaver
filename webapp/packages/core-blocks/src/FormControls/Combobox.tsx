/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useId } from 'react';
import {
  ComboboxInput,
  ComboboxItem,
  ComboboxEmpty,
  clsx,
  Spinner,
  ComboboxPopover,
  ComboboxDisclosure,
  ComboboxProvider,
  type ComboboxProviderProps,
} from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { IconOrImage } from '../IconOrImage.js';
import { useTranslate } from '../localization/useTranslate.js';
import { Field } from './Field.js';
import { FieldDescription } from './FieldDescription.js';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';

export type ComboboxBaseProps<TKey, TValue> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue'
> &
  ILayoutSizeProps & {
    propertyName?: string;
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
  propertyName,
  items,
  loading,
  children,
  title,
  className,
  readOnly,
  disabled,
  inline,
  description,
  keySelector = v => v,
  valueSelector = v => v,
  iconSelector,
  titleSelector,
  isDisabled,
  onSelect,
  ...rest
}: ControlledProps<any, any> | ObjectProps<any, any, any>) {
  const layoutProps = getLayoutProps(rest);
  const inputId = useId();
  rest = filterLayoutFakeProps(rest);
  const translate = useTranslate();
  const context = useContext(FormContext);

  let value: string | number | readonly string[] | undefined = controlledValue ?? defaultValue ?? undefined;
  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  const selectedItem = items.find((item, index) => keySelector(item, index) === value);

  const handleSelect: ComboboxProviderProps['setSelectedValue'] = useCallback(
    (selectedValue: string | string[]) => {
      const item = items.find(item => valueSelector(item) === selectedValue);
      if (!item) {
        return;
      }

      const itemIndex = items.indexOf(item);
      const key = keySelector(item, itemIndex);

      if (key === value) {
        return;
      }

      if (state) {
        state[name] = key;
      }
      if (onSelect) {
        onSelect(key, name, value);
      }
      if (context) {
        context.change(key, name);
      }
    },
    [items, keySelector, valueSelector, value, state, name, onSelect, context],
  );

  const icon = selectedItem && iconSelector?.(selectedItem);
  const comboboxDefaultValue = selectedItem ? valueSelector(selectedItem) : defaultValue ? String(defaultValue) : undefined;

  return (
    <Field {...layoutProps} className={className} style={{ display: inline ? 'flex' : 'block', alignItems: inline ? 'center' : undefined }}>
      {children && (
        <FieldLabel
          required={rest.required}
          htmlFor={inputId}
          title={title}
          className={clsx('theme-typography--body1', 'tw:block tw:font-medium!', inline ? 'tw:mr-2' : 'tw:mb-2.5')}
        >
          {children}
        </FieldLabel>
      )}
      <ComboboxProvider defaultValue={comboboxDefaultValue} setSelectedValue={handleSelect}>
        <div className="tw:relative tw:flex tw:flex-1 tw:items-center tw:gap-2">
          <ComboboxInput
            defaultValue={comboboxDefaultValue}
            disabled={disabled || loading || readOnly}
            readOnly={readOnly}
            placeholder={rest.placeholder}
            className={clsx('theme-typography--caption', icon || loading ? 'tw:pl-8!' : '', 'tw:pr-6!')}
            title={title}
            id={inputId}
            {...rest}
          />
          {loading ? (
            <Spinner size="small" className="tw:absolute tw:right-2 tw:top-[50%] tw:-translate-y-1/2" />
          ) : (
            <ComboboxDisclosure
              disabled={disabled || loading || readOnly}
              className="tw:absolute tw:right-2 tw:top-[50%] tw:-translate-y-1/2 tw:*:fill-none! tw:cursor-pointer"
            />
          )}
          {icon && <div className="tw:absolute tw:left-3 tw:w-4 tw:h-4">{typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}</div>}
          <ComboboxPopover className="theme-text-on-surface theme-background-surface theme-typography--caption">
            <ComboboxEmpty>{translate('combobox_no_results_placeholder')}</ComboboxEmpty>
            {items.map((item, index) => {
              const itemKey = String(keySelector(item, index));
              const itemValue = valueSelector(item);
              const itemTitle = titleSelector?.(item);
              const itemIcon = iconSelector?.(item);
              const itemDisabled = isDisabled?.(item);

              return (
                <ComboboxItem
                  key={itemKey}
                  value={itemValue}
                  disabled={itemDisabled}
                  title={itemTitle}
                  className={clsx('tw:flex tw:items-center tw:gap-2 tw:py-2 tw:px-3 tw:leading-none', {
                    'tw:cursor-pointer': !itemDisabled,
                    'tw:cursor-not-allowed': itemDisabled,
                  })}
                >
                  {iconSelector && (
                    <div className="tw:w-4 tw:h-4 tw:shrink-0">
                      {itemIcon && typeof itemIcon === 'string' ? <IconOrImage icon={itemIcon} /> : itemIcon}
                    </div>
                  )}
                  <div>{itemValue}</div>
                </ComboboxItem>
              );
            })}
          </ComboboxPopover>
        </div>
      </ComboboxProvider>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
