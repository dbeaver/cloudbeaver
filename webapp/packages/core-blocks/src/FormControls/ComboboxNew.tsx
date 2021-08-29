/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import {
  useLayoutEffect, useCallback, useState, useRef, useContext, useEffect
} from 'react';
import {
  useMenuState,
  Menu,
  MenuItem,
  MenuButton
} from 'reakit/Menu';
import styled, { css, use } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { filterLayoutFakeProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { baseFormControlStylesNew } from './baseFormControlStylesNew';
import { FormContext } from './FormContext';

const styles = composes(
  css`
    Menu {
      composes: theme-text-on-surface theme-background-surface from global;
    }
    MenuItem {
      composes: theme-ripple from global;
    }
  `,
  css`
    field  input {
      margin: 0;
    }
    field-label {
      display: block;
      padding-bottom: 10px;
      composes: theme-typography--body1 from global;
      font-weight: 500;
    }
    input {
      padding-right: 12px !important;
    }
    MenuButton {
      position: absolute;
      right: 0;
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
      &:hover {
        opacity: 0.7;
      }
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
        padding: 4px 12px;
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
    MenuButton Icon[|focus] {
      transform: rotate(180deg);
    }
    input-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
  `
);

type BaseProps<TKey, TValue> = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect' | 'name' | 'value' | 'defaultValue'> & ILayoutSizeProps & {
  propertyName?: string;
  items: TValue[];
  searchable?: boolean;
  defaultValue?: string;
  keySelector: (item: TValue) => TKey;
  valueSelector: (item: TValue) => string;
  onSwitch?: (state: boolean) => void;
};

type ControlledProps<TKey, TValue> = BaseProps<TKey, TValue> & {
  name?: string;
  value?: string;
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

export const ComboboxNew: ComboboxType = observer(function ComboboxNew({
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
  onChange = () => {},
  onSelect,
  onSwitch,
  ...rest
}: ControlledProps<any, any> | ObjectProps<any, any, any>) {
  rest = filterLayoutFakeProps(rest);
  const context = useContext(FormContext);
  const ref = useRef<HTMLInputElement>(null);
  const menu = useMenuState({
    placement: 'bottom-end',
    currentId: null,
    gutter: 4,
  });
  const [searchValue, setSearchValue] = useState<string | null>(null);
  let value: string | number | readonly string[] | undefined = controlledValue ?? defaultValue ?? undefined;

  if (state && name !== undefined && name in state) {
    value = state[name];
  }

  const selectedItem = items.find(item => keySelector(item) === value);

  let inputValue = (selectedItem ? valueSelector(selectedItem) : searchValue) ?? '';

  if (searchValue !== null && selectedItem && valueSelector(selectedItem) !== searchValue) {
    inputValue = searchValue;
  }

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
        context.change(null, name);
      }
      setSearchValue(null);
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
        context.change(id, name);
      }
      setSearchValue(null);
    },
    [value, state, name, menu, context, onSelect]
  );

  useEffect(() => {
    if (ref.current === document.activeElement && inputValue === searchValue) {
      menu.show();
    }
  });

  useLayoutEffect(() => onSwitch?.(menu.visible), [onSwitch, menu.visible]);

  const filteredItems = items.filter(
    item => !searchValue || valueSelector(item).toUpperCase().includes(searchValue.toUpperCase())
  );

  return styled(useStyles(baseFormControlStylesNew, styles))(
    <field className={className}>
      <field-label title={title} as='label'>{children}</field-label>
      <input-box>
        <input
          ref={ref}
          role='new'
          autoComplete="off"
          name={name}
          title={title}
          value={inputValue}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          {...rest}
        />
        {(selectedItem && !readOnly && searchable) && (
          <IconButton type="button" name="reject" viewBox="0 0 11 11" onClick={handleRemove} />
        )}
        <MenuButton {...menu} disabled={readOnly || disabled}><Icon name="arrow" viewBox="0 0 16 16" {...use({ focus: menu.visible })} /></MenuButton>
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
      </input-box>
    </field>
  );
});
