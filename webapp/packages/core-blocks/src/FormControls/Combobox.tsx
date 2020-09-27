/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useLayoutEffect, useCallback, useState, useRef, useContext
} from 'react';
import {
  useMenuState,
  Menu,
  MenuItem,
  MenuButton,
} from 'reakit/Menu';
import styled, { css, use } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { IconButton } from '../IconButton';
import { Icon } from '../Icons/Icon';
import { baseFormControlStyles } from './baseFormControlStyles';
import { FormContext } from './FormContext';

const styles = composes(
  css`
    Menu {
      composes: theme-text-on-surface theme-background-surface from global;
    }
    MenuItem, MenuButton {
      composes: theme-ripple from global;
    }
  `,
  css`
    field  input {
      margin: 0;
    }
    MenuButton {
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
    }

    Menu {
      composes: theme-typography--caption theme-elevation-z3 from global;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-height: 150px;
      overflow: auto;
      outline: none;
      padding: 4px 0;
      z-index: 999;

      & MenuItem {
        background: transparent;
        display: block;
        padding: 4px 36px;
        text-align: left;
        outline: none;
        color: inherit;
        cursor: pointer;
      }
    }
    Icon {
      height: 16px;
      display: block;
    }
    MenuButton Icon {
      transform: rotate(90deg);

      &[|focus] {
        transform: rotate(-90deg);
      }
    }
    input-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
  `
);

type BaseProps<TKey, TValue> = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect' | 'name' | 'value'> & {
  propertyName?: string;
  items: TValue[];
  mod?: 'surface';
  long?: boolean;
  searchable?: boolean;
  keySelector(item: TValue): TKey;
  valueSelector(item: TValue): string;
  onSwitch?(state: boolean): void;
}

type ControlledProps<TKey, TValue> = BaseProps<TKey, TValue> & {
  name?: string;
  value?: string;
  onSelect?(value: TKey, name: string | undefined, prev: TKey): void;
  onChange?(value: string, name: string | undefined): any;

  state?: never;
}

type ObjectProps<TValue, TKey extends keyof TState, TState> = BaseProps<TState[TKey], TValue> & {
  name: TKey;
  state: TState;
  onSelect?(value: TState[TKey], name: TKey | undefined, prev: TState[TKey]): void;
  onChange?(value: string, name: TKey | undefined): any;

  value?: never;
}

type ComboboxType = {
  <TKey, TValue>(props: ControlledProps<TKey, TValue>): JSX.Element;
  <TValue, TKey extends keyof TState, TState>(props: ObjectProps<TValue, TKey, TState>): JSX.Element;
}

export const Combobox: ComboboxType = observer(function Combobox({
  value: controlledValue,
  name,
  state,
  propertyName,
  items,
  children,
  className,
  mod,
  long,
  searchable,
  readOnly,
  keySelector = v => v,
  valueSelector = v => v,
  onChange = () => {},
  onSelect,
  onSwitch,
  ...rest
}: ControlledProps<any, any> | ObjectProps<any, any, any>) {
  const context = useContext(FormContext);
  const ref = useRef<HTMLInputElement>(null);
  const menu = useMenuState({
    placement: 'bottom-end',
    currentId: null,
    gutter: 4,
  });
  const [searchValue, setSearchValue] = useState('');
  const value = state ? state[name] : controlledValue;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(value, name);
      setSearchValue(value);
    },
    [name, onChange]
  );

  const handleRemove = useCallback(
    () => {
      menu.hide();
      if (state) {
        state[name] = null;
      }
      if (onSelect) {
        onSelect(null, name, value);
      }
      if (context) {
        context.onChange(null, name);
      }
      setSearchValue('');
    },
    [value, state, name, menu, context, onSelect]
  );

  const handleMenuSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      menu.hide();
      const id = event.currentTarget.id;
      if (state) {
        state[name] = id;
      }
      if (onSelect) {
        onSelect(id, name, value);
      }
      if (context) {
        context.onChange(id, name);
      }
    },
    [value, state, name, menu, context, onSelect]
  );

  useLayoutEffect(() => onSwitch && onSwitch(menu.visible), [onSwitch, menu.visible]);

  const selectedItem = items.find(item => keySelector(item) === value);
  const filteredItems = items.filter(
    item => selectedItem || !searchValue || valueSelector(item).toUpperCase().includes(searchValue.toUpperCase())
  );

  if (ref.current === document.activeElement && !selectedItem && searchValue) {
    menu.show();
  }

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className} {...use({ long })}>
      <field-label as='label'>{children}</field-label>
      <input-box as="div">
        <input
          ref={ref}
          name={name}
          onChange={handleChange}
          value={selectedItem ? valueSelector(selectedItem) : searchValue}
          readOnly={!!selectedItem || readOnly}
          {...use({ mod })}
          {...rest}
        />
        {(selectedItem && !readOnly && searchable) && (
          <IconButton type="button" name="reject" viewBox="0 0 11 11" onClick={handleRemove} />
        )}
        {!readOnly && (
          <>
            <MenuButton {...menu}><Icon name="arrow" viewBox="0 0 16 16" {...use({ focus: menu.visible })} /></MenuButton>
            <Menu
              {...menu}
              aria-label={propertyName}
              unstable_initialFocusRef={ref}
              unstable_finalFocusRef={ref}
            >
              {filteredItems.map(item => (
                <MenuItem key={keySelector(item)} id={keySelector(item)} type='button' {...menu} onClick={handleMenuSelect}>
                  {valueSelector(item)}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </input-box>
    </field>
  );
});
