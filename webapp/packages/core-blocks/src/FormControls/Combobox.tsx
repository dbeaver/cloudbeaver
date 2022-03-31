/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useCallback, useState, useRef, useContext, useEffect } from 'react';
import { useMenuState, Menu, MenuItem, MenuButton } from 'reakit/Menu';
import styled, { css, use } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { filterLayoutFakeProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { getComputed } from '../getComputed';
import { Icon } from '../Icon';
import { IconOrImage } from '../IconOrImage';
import { baseFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const styles = css`
    field input {
      margin: 0;
    }
    field-label {
      display: block;
      padding-bottom: 10px;
      composes: theme-typography--body1 from global;
      font-weight: 500;
    }
    input {
      padding-right: 24px !important;
    }
    MenuButton {
      position: absolute;
      right: 0;
      background: transparent;
      outline: none;
      display: flex;
      align-items: center;
      height: 100%;
      padding: 0 8px 0 0;
      cursor: pointer;
      &:hover, &:focus {
        opacity: 0.7;
      }
    }
    MenuItem {
      composes: theme-ripple from global;
    }

    Menu {
      composes: theme-text-on-surface theme-background-surface theme-typography--caption theme-elevation-z3 from global;
      display: flex;
      flex-direction: column;
      max-height: 300px;
      overflow: auto;
      outline: none;
      z-index: 999;
      border-radius: var(--theme-form-element-radius);

      & MenuItem {
        background: transparent;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 8px 12px;
        text-align: left;
        outline: none;
        color: inherit;
        cursor: pointer;
        gap: 8px;

        & item-icon, & item-title {
          position: relative;
        }

        & item-icon {
          width: 16px;
          height: 16px;
          overflow: hidden;
          flex-shrink: 0;

          & IconOrImage {
            width: 100%;
            height: 100%;
          }
        } 
      }
    }
    Icon {
      height: 16px;
      display: block;
    }
    MenuButton Icon[|focus] {
      transform: rotate(180deg);
    }
    input-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;

      & input-icon {
          position: absolute;
          left: 0;
          width: 16px;
          height: 16px;
          margin-left: 12px;
    
          & IconOrImage {
            width: 100%;
            height: 100%;
          }
    
          &:not(:empty) + input {
            padding-left: 34px !important;
          }
      }
    }
  `;

type BaseProps<TKey, TValue> = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue'> & ILayoutSizeProps & {
  propertyName?: string;
  items: TValue[];
  searchable?: boolean;
  defaultValue?: TKey;
  keySelector: (item: TValue, index: number) => TKey;
  valueSelector: (item: TValue) => string;
  titleSelector?: (item: TValue) => string | undefined;
  iconSelector?: (item: TValue) => string | React.ReactElement | undefined;
  isDisabled?: (item: TValue) => boolean;
  onSwitch?: (state: boolean) => void;
};

type ControlledProps<TKey, TValue> = BaseProps<TKey, TValue> & {
  name?: string;
  value?: TKey;
  onSelect?: (value: TKey, name: string | undefined, prev: TKey) => void;
  onChange?: (value: string, name: string | undefined) => any;
  state?: never;
};

type ObjectProps<TValue, TKey extends keyof TState, TState> = BaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?: (value: TState[TKey], name: TKey | undefined, prev: TState[TKey]) => void;
  onChange?: (value: string, name: TKey | undefined) => any;
  value?: never;
};

interface ComboboxType {
  <TKey, TValue>(props: ControlledProps<TKey, TValue>): JSX.Element;
  <TValue, TKey extends keyof TState, TState>(props: ObjectProps<TValue, TKey, TState>): JSX.Element;
}

export const Combobox: ComboboxType = observer(function Combobox({
  value: controlledValue,
  defaultValue,
  name,
  state,
  propertyName,
  items,
  children,
  title,
  className,
  searchable,
  readOnly,
  disabled,
  keySelector = v => v,
  valueSelector = v => v,
  iconSelector,
  titleSelector,
  isDisabled,
  onChange = () => { },
  onSelect,
  onSwitch,
  ...rest
}: ControlledProps<any, any> | ObjectProps<any, any, any>) {
  rest = filterLayoutFakeProps(rest);
  const translate = useTranslate();
  const context = useContext(FormContext);
  const menuRef = useRef<HTMLDivElement>(null);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);
  const menu = useMenuState({
    placement: 'bottom-end',
    currentId: null,
    gutter: 4,
  });

  if (readOnly) {
    searchable = true;
  }

  const [searchValue, setSearchValue] = useState<string | null>(null);

  const filteredItems = getComputed(() => {
    const result = items.filter(
      item => !searchValue || valueSelector(item).toUpperCase().includes(searchValue.toUpperCase())
    );

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

  function handleClick() {
    if (!searchable) {
      if (menu.visible) {
        menu.hide();
      } else {
        menu.show();
      }
    }
  }

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange(value, name);
    setSearchValue(value);
  }, [name, onChange]);

  const handleSelect = useCallback((id: any) => {
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
  }, [value, state, name, menu, context, onSelect]);

  const matchItems = useCallback((input?: boolean) => {
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
  }, [items, filteredItems, keySelector, handleSelect, searchValue]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      matchItems(true);
    }
  }, [matchItems]);

  useEffect(() => {
    if (inputRef === document.activeElement) {
      if (inputValue === searchValue) {
        menu.show();
      }
    } else {
      if (!menu.visible) {
        matchItems();
      }
    }
  }, [inputValue, searchValue, matchItems, menu]);

  useLayoutEffect(() => {
    onSwitch?.(menu.visible);
  }, [onSwitch, menu.visible]);

  useEffect(() => {
    if (!inputRef) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (menuRef.current) {
        const size = inputRef.getBoundingClientRect();
        menuRef.current.style.width = size.width + 'px';
      }
    });

    resizeObserver.observe(inputRef);

    return () => {
      resizeObserver.disconnect();
    };
  }, [inputRef]);

  const icon = selectedItem && iconSelector?.(selectedItem);
  const focus = menu.visible;
  const select = !searchable;

  return styled(useStyles(baseFormControlStyles, baseValidFormControlStyles, styles))(
    <field className={className}>
      {children && <field-label title={title}>{children}{rest.required && ' *'}</field-label>}
      <input-box>
        {icon && (
          <input-icon>
            {typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
          </input-icon>
        )}
        <input
          ref={setInputRef}
          autoComplete="off"
          name={name}
          title={title}
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly || select}
          data-focus={focus}
          data-select={select}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          {...rest}
          {...use({ select, focus })}
        />
        <MenuButton {...menu} disabled={readOnly || disabled}>
          <Icon name="arrow" viewBox="0 0 16 16" {...use({ focus })} />
        </MenuButton>
        <Menu
          {...menu}
          ref={menuRef}
          aria-label={propertyName}
          // unstable_finalFocusRef={inputRef || undefined}
          // unstable_initialFocusRef={ref}
          modal
        >
          {!filteredItems.length
            ? (
              <MenuItem id='placeholder' disabled {...menu}>
                {translate('combobox_no_results_placeholder')}
              </MenuItem>
            )
            : (filteredItems.map((item, index) => {
              const icon = iconSelector?.(item);
              const title = titleSelector?.(item);
              const disabled = isDisabled?.(item);

              return (
                <MenuItem
                  key={keySelector(item, index)}
                  id={keySelector(item, index)}
                  type='button'
                  title={title}
                  {...menu}
                  disabled={disabled}
                  onClick={event => handleSelect(event.currentTarget.id)}
                >
                  {iconSelector && (
                    <item-icon>
                      {icon && typeof icon === 'string' ? <IconOrImage icon={icon} /> : icon}
                    </item-icon>
                  )}
                  <item-value>{valueSelector(item)}</item-value>
                </MenuItem>
              );
            }))}
        </Menu>
      </input-box>
    </field>
  );
});
