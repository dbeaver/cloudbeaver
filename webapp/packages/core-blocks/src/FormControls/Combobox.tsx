/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import { Combobox as UIKitCombobox, ComboboxItem, ComboboxEmpty } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { IconOrImage } from '../IconOrImage.js';
import { Loader } from '../Loader/Loader.js';
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

{
  /* TODO rewrite whole component to select attribute instead of input type text so it has an okay form validation */
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
  rest = filterLayoutFakeProps(rest);
  const translate = useTranslate();
  const context = useContext(FormContext);

  let value: string | number | readonly string[] | undefined = controlledValue ?? defaultValue ?? undefined;
  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  const selectedItem = items.find((item, index) => keySelector(item, index) === value);

  const handleSelect = useCallback(
    (selectedValue: string) => {
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

  if (loading && items.length === 0) {
    return (
      <Field {...layoutProps} className={className} style={{ display: inline ? 'flex' : 'block', alignItems: inline ? 'center' : undefined }}>
        {children && (
          <FieldLabel required={rest.required} title={title} style={{ paddingRight: inline ? 8 : 0, paddingBottom: inline ? 0 : 10 }}>
            {children}
          </FieldLabel>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
          <input value={translate('ui_processing_loading')} style={{ flex: 1, paddingRight: 24 }} readOnly disabled />
          <div style={{ position: 'absolute', left: 12, width: 16, height: 16 }}>
            <Loader small fullSize />
          </div>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </Field>
    );
  }

  return (
    <Field {...layoutProps} className={className} style={{ display: inline ? 'flex' : 'block', alignItems: inline ? 'center' : undefined }}>
      {children && (
        <FieldLabel required={rest.required} title={title} style={{ paddingRight: inline ? 8 : 0, paddingBottom: inline ? 0 : 10 }}>
          {children}
        </FieldLabel>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
        {/* Icon display */}
        {(icon || loading) && (
          <div style={{ position: 'absolute', left: 12, width: 16, height: 16, zIndex: 1 }}>
            {loading ? <Loader small fullSize /> : typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
          </div>
        )}

        <UIKitCombobox
          defaultValue={selectedItem ? valueSelector(selectedItem) : defaultValue ? String(defaultValue) : undefined}
          setValue={handleSelect}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={rest.placeholder}
          style={{
            flex: 1,
            paddingLeft: icon || loading ? 34 : undefined,
            paddingRight: 24,
          }}
          title={title}
          {...rest}
        >
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  cursor: itemDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {iconSelector && (
                  <div style={{ width: 16, height: 16, flexShrink: 0 }}>
                    {itemIcon && typeof itemIcon === 'string' ? <IconOrImage icon={itemIcon} /> : itemIcon}
                  </div>
                )}
                <div>{itemValue}</div>
              </ComboboxItem>
            );
          })}
        </UIKitCombobox>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
