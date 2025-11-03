/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useId, useLayoutEffect } from 'react';
import { useSelectStore, SelectField, clsx } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { IconOrImage } from '../IconOrImage.js';
import { Loader } from '../Loader/Loader.js';
import { useTranslate } from '../localization/useTranslate.js';
import './Select.css';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';
import { FieldDescription } from './FieldDescription.js';
import { Field } from './Field.js';

export type SelectBaseProps<TKey, TValue> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue' | 'children'
> &
  ILayoutSizeProps & {
    items: TValue[];
    defaultValue?: TKey;
    loading?: boolean;
    description?: string;
    placeholder?: string;
    keySelector?: (item: TValue, index: number) => TKey;
    serializedKeySelector?: (key: TKey) => string;
    valueSelector?: (item: TValue) => string;
    titleSelector?: (item: TValue) => string | undefined;
    iconSelector?: (item: TValue) => string | React.ReactElement | undefined;
    isDisabled?: (item: TValue) => boolean;
    onSwitch?: (state: boolean) => void;
    inline?: boolean;
    children?: string;
  };

type ControlledProps<TKey, TValue> = SelectBaseProps<TKey, TValue> & {
  name?: string;
  value?: TKey;
  onSelect?: (value: TKey, name: string | undefined, prev: TKey) => void;
  state?: never;
};

type ObjectProps<TValue, TKey extends keyof TState, TState> = SelectBaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?: (value: TState[TKey], name: TKey | undefined, prev: TState[TKey]) => void;
  value?: never;
};

export interface SelectType {
  <TKey, TValue>(props: ControlledProps<TKey, TValue>): React.JSX.Element;
  <TValue, TKey extends keyof TState, TState>(props: ObjectProps<TValue, TKey, TState>): React.JSX.Element;
}

export const Select: SelectType = observer(function Select({
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
  placeholder,
  id,
  keySelector = v => v,
  valueSelector = v => v,
  serializedKeySelector,
  iconSelector,
  titleSelector,
  isDisabled,
  onSelect,
  onSwitch,
  ...rest
}: ControlledProps<any, any> | ObjectProps<any, any, any>) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const translate = useTranslate();
  const context = useContext(FormContext);
  const menu = useSelectStore();
  const isOpened = menu.getState().open;
  let value: string | number | readonly string[] | undefined = controlledValue ?? defaultValue ?? undefined;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  const generatedId = useId();
  const inputId = id || generatedId;

  const handleSelect = (id: any) => {
    id = id ?? value ?? '';
    const changed = id !== value;

    if (state && changed) {
      state[name] = id;
    }
    if (onSelect && changed) {
      onSelect(id, name, value);
    }
    if (context && changed) {
      context.change(id, name);
    }
  };

  useLayoutEffect(() => {
    onSwitch?.(isOpened);
  }, [onSwitch, isOpened]);

  function renderIcon(item: (typeof items)[number]): React.ReactNode {
    if (!item || !iconSelector || !iconSelector(item)) {
      return null;
    }

    let element: React.ReactElement | string | undefined;

    switch (true) {
      case loading:
        element = <Loader small fullSize />;
        break;
      case typeof iconSelector(item) === 'string':
        element = <IconOrImage icon={iconSelector(item) as string} className="select__icon" />;
        break;
      default:
        element = iconSelector(item);
        break;
    }

    return <div className="select__input-icon">{element}</div>;
  }

  function itemValue(item: (typeof items)[number]): typeof value {
    return keySelector(item, items.indexOf(item));
  }

  function itemRender(item: (typeof items)[number]): React.ReactNode {
    return (
      <div className="select__item tw:truncate" title={item ? titleSelector?.(item) : undefined}>
        {renderIcon(item)}
        {valueSelector(item)}
      </div>
    );
  }

  function itemDisabled(item: (typeof items)[number]): boolean {
    return isDisabled?.(item) ?? false;
  }

  function selectedRender(val: typeof value, item: (typeof items)[number] | undefined): React.ReactNode {
    if (!item) {
      return (
        <div className="select__item select__item--placeholder" title={item ? titleSelector?.(item) : undefined}>
          {placeholder || translate('combobox_select_placeholder')}
        </div>
      );
    }

    return itemRender(item);
  }

  return (
    <Field {...layoutProps} className={clsx(inline && 'select__field--inline', className)}>
      {children && (
        <FieldLabel htmlFor={inputId} required={rest.required} title={title} className="select__field-label">
          {children}
        </FieldLabel>
      )}
      <SelectField
        {...rest}
        items={items}
        value={value}
        id={inputId}
        aria-label={children || title}
        itemValue={itemValue}
        itemValueSerialized={serializedKeySelector}
        itemRender={itemRender}
        itemDisabled={itemDisabled}
        name={name}
        disabled={disabled || readOnly}
        noItemsPlaceholder={translate('combobox_no_results_placeholder')}
        selectedRender={selectedRender}
        store={menu}
        onChange={handleSelect}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
