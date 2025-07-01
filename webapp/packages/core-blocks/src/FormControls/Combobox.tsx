/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { useSelectStore, SelectField } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { getComputed } from '../getComputed.js';
import { Icon } from '../Icon.js';
import { IconOrImage } from '../IconOrImage.js';
import { Loader } from '../Loader/Loader.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import comboboxStyles from './Combobox.module.css';
import { FieldLabel } from './FieldLabel.js';
import { FormContext } from './FormContext.js';
import { FieldDescription } from './FieldDescription.js';
import { Field } from './Field.js';

export type ComboboxBaseProps<TKey, TValue> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue'
> &
  ILayoutSizeProps & {
    propertyName?: string;
    items: TValue[];
    searchable?: boolean;
    defaultValue?: TKey;
    loading?: boolean;
    description?: string;
    keySelector?: (item: TValue, index: number) => TKey;
    valueSelector?: (item: TValue) => string;
    titleSelector?: (item: TValue) => string | undefined;
    iconSelector?: (item: TValue) => string | React.ReactElement | undefined;
    isDisabled?: (item: TValue) => boolean;
    onSwitch?: (state: boolean) => void;
    inline?: boolean;
  };

type ControlledProps<TKey, TValue> = ComboboxBaseProps<TKey, TValue> & {
  name?: string;
  value?: TKey;
  onSelect?: (value: TKey, name: string | undefined, prev: TKey) => void;
  onChange?: (value: string, name: string | undefined) => any;
  state?: never;
};

type ObjectProps<TValue, TKey extends keyof TState, TState> = ComboboxBaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?: (value: TState[TKey], name: TKey | undefined, prev: TState[TKey]) => void;
  onChange?: (value: string, name: TKey | undefined) => any;
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
  searchable,
  readOnly,
  disabled,
  inline,
  description,
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
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const styles = useS(comboboxStyles);
  const menu = useSelectStore();
  const isOpened = menu.getState().open;

  if (readOnly) {
    searchable = true;
  }

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

  const selectedItem = items.find((item, index) => keySelector(item, index) === value);

  let inputValue = (selectedItem ? valueSelector(selectedItem) : searchValue) ?? '';

  if (searchValue !== null && selectedItem && valueSelector(selectedItem) !== searchValue) {
    inputValue = searchValue;
  }

  const hideMenu = items.length === 1 && (!!selectedItem || isDisabled?.(items[0]) === true);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(value, name);
      setSearchValue(value);
    },
    [name, onChange],
  );

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

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        matchItems(true);
      }
    },
    [matchItems],
  );

  useEffect(() => {
    if (inputRef === document.activeElement) {
      if (inputValue === searchValue) {
        menu.show();
      }
    } else {
      if (!isOpened) {
        matchItems();
      }
    }
  }, [inputValue, searchValue, isOpened, matchItems]);

  useLayoutEffect(() => {
    onSwitch?.(isOpened);
  }, [onSwitch, isOpened]);

  const focus = isOpened;
  const select = !searchable;

  if (loading && items.length === 0) {
    inputValue = translate('ui_processing_loading');
  }

  const renderIcon = (item: any) => {
    if (item && iconSelector && iconSelector(item)) {
      return (
        <div className={s(styles, { inputIcon: true })}>
          {loading ? (
            <Loader small fullSize />
          ) : typeof iconSelector(item) === 'string' ? (
            <IconOrImage icon={iconSelector(item) as string} className={s(styles, { iconOrImage: true })} />
          ) : (
            iconSelector(item)
          )}
        </div>
      );
    }

    return null;
  };
  const itemValue = (item: any) => keySelector(item, items.indexOf(item));
  const itemRender = (item: any) => (
    <div className={s(styles, { item: true })} title={titleSelector?.(item)}>
      {renderIcon(item)}
      <span>{valueSelector(item)}</span>
    </div>
  );

  const itemDisabled = (item: any) => isDisabled?.(item) ?? false;

  const selectedRender = (val: any, item: any) => {
    if (searchable) {
      return (
        <div className={s(styles, { itemSearch: true })} title={title}>
          {renderIcon(item)}
          <input
            {...rest}
            ref={setInputRef}
            required={rest.required}
            autoComplete="off"
            name={name}
            title={title}
            value={inputValue}
            disabled={disabled || hideMenu}
            readOnly={readOnly || select}
            data-focus={focus}
            data-select={select}
            className={s(styles, { input: true, select, focus })}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
        </div>
      );
    }

    if (!item) {
      return '';
    }

    return (
      <>
        {/* TODO check validation form select field */}
        {/* <input className={s(styles, { validationInput: true })} value={inputValue} required={rest.required} readOnly /> */}
        {itemRender(item)}
      </>
    );
  };

  return (
    <Field {...layoutProps} className={s(styles, { field: true, inline }, className)}>
      {children && (
        <FieldLabel required={rest.required} title={title} className={s(styles, { fieldLabel: true })}>
          {children}
        </FieldLabel>
      )}
      <div className={s(styles, { inputBox: true })}>
        {/* TODO check validation in the form and remove it */}
        {/* <input className={s(styles, { validationInput: true })} value={inputValue} required={rest.required} readOnly /> */}
        <SelectField
          items={filteredItems}
          value={value}
          itemValue={itemValue}
          itemRender={itemRender}
          itemDisabled={itemDisabled}
          name={name}
          disabled={disabled || readOnly}
          required={rest.required}
          className={s(styles, { field: true, inline }, className, styles['selectField'])}
          noItemsPlaceholder={translate('combobox_no_results_placeholder')}
          selectedRender={selectedRender}
          arrowIcon={<Icon name="arrow" viewBox="0 0 16 16" className={styles['icon']} />}
          store={menu}
          popoverProps={{
            autoFocusOnShow: !searchable,
          }}
          onChange={handleSelect}
          {...rest}
        />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
