/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useSelectStore, SelectField, clsx } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { getComputed } from '../getComputed.js';
import { Icon } from '../Icon.js';
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
  'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue'
> &
  ILayoutSizeProps & {
    items: TValue[];
    defaultValue?: TKey;
    loading?: boolean;
    description?: string;
    placeholder?: string;
    keySelector?: (item: TValue, index: number) => TKey;
    valueSelector?: (item: TValue) => string;
    titleSelector?: (item: TValue) => string | undefined;
    iconSelector?: (item: TValue) => string | React.ReactElement | undefined;
    isDisabled?: (item: TValue) => boolean;
    onSwitch?: (state: boolean) => void;
    inline?: boolean;
  };

type ControlledProps<TKey, TValue> = SelectBaseProps<TKey, TValue> & {
  name?: string;
  value?: TKey;
  onSelect?: (value: TKey, name: string | undefined, prev: TKey) => void;
  onChange?: (value: string, name: string | undefined) => any;
  state?: never;
};

type ObjectProps<TValue, TKey extends keyof TState, TState> = SelectBaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?: (value: TState[TKey], name: TKey | undefined, prev: TState[TKey]) => void;
  onChange?: (value: string, name: TKey | undefined) => any;
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
  keySelector = v => v,
  valueSelector = v => v,
  iconSelector,
  titleSelector,
  isDisabled,
  onChange = () => {},
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

  const [searchValue, setSearchValue] = useState<string | null>(null);

  const filteredItems = getComputed(() => {
    const result = items.filter(item => !searchValue || valueSelector(item).toUpperCase().includes(searchValue.toUpperCase()));

    if (isDisabled) {
      return result.sort((a, b) => Number(isDisabled(a)) - Number(isDisabled(b)));
    }

    return result;
  });

  let value: string | number | readonly string[] | undefined = controlledValue ?? defaultValue ?? undefined;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  const handleSelect = useCallback(
    (id: any) => {
      id = id ?? value ?? '';
      const changed = id !== value;

      menu.hide();
      if (state && changed) {
        state[name] = id;
      }
      if (onSelect && changed) {
        onSelect(id, name, value);
      }
      if (context && changed) {
        context.change(id, name);
      }
      setSearchValue(null);
    },
    [value, state, name, menu, context, onSelect],
  );

  const matchItems = useCallback(
    (input?: boolean) => {
      if (searchValue === null) {
        return;
      }

      if (filteredItems.length === 0) {
        setSearchValue(null);
        return;
      }

      const filteredItemIndex = items.indexOf(filteredItems[0]);

      if (filteredItems.length === 1) {
        handleSelect(keySelector(filteredItems[0], filteredItemIndex));
        return;
      }

      if (filteredItems.length > 0) {
        if (input) {
          handleSelect(keySelector(filteredItems[0], filteredItemIndex));
        } else {
          setSearchValue(null);
        }
      }
    },
    [items, filteredItems, keySelector, handleSelect, searchValue],
  );

  useEffect(() => {
    if (!isOpened) {
      matchItems();
    }
  }, [isOpened, matchItems]);

  useLayoutEffect(() => {
    onSwitch?.(isOpened);
  }, [onSwitch, isOpened]);

  function renderIcon(item: (typeof items)[number]): React.ReactNode {
    if (item && iconSelector && iconSelector(item)) {
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

    return null;
  }

  function itemValue(item: (typeof items)[number]): typeof value {
    return keySelector(item, items.indexOf(item));
  }

  function itemRender(item: (typeof items)[number]): React.ReactNode {
    return (
      <div className="select__item" title={item ? titleSelector?.(item) : undefined}>
        {renderIcon(item)}
        <span>{valueSelector(item)}</span>
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
    <Field {...layoutProps} className={clsx('select__field', inline && 'select__field--inline', className)}>
      {children && (
        <FieldLabel required={rest.required} title={title} className="select__field-label">
          {children}
        </FieldLabel>
      )}
      <SelectField
        items={filteredItems}
        value={value}
        itemValue={itemValue}
        itemRender={itemRender}
        itemDisabled={itemDisabled}
        name={name}
        disabled={disabled || readOnly}
        noItemsPlaceholder={translate('combobox_no_results_placeholder')}
        selectedRender={selectedRender}
        arrowIcon={<Icon name="arrow" viewBox="0 0 16 16" className="select__icon" />}
        store={menu}
        onChange={handleSelect}
        {...rest}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
