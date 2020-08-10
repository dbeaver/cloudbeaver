/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useLayoutEffect, useCallback, useState, useRef
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
      margin: 0 12px;
      position: relative;
      display: flex;
      align-items: center;
    }
  `
);

type Props<T> = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> & {
  value: string | undefined;
  propertyName?: string;
  items: T[];
  mod?: 'surface';
  keySelector(item: T): string;
  valueSelector(item: T): string;
  onChange?(value: string): any;
  onSelect(value: T | null): void;
  onSwitch?(state: boolean): void;
}

export function Combobox<T>({
  value,
  propertyName,
  items,
  children,
  className,
  mod,
  readOnly,
  keySelector = v => v as any,
  valueSelector = v => v as any,
  onChange = () => {},
  onSelect,
  onSwitch,
  ...rest
}: Props<T>) {
  const ref = useRef<HTMLInputElement>(null);
  const menu = useMenuState({
    placement: 'bottom-end',
    currentId: null,
    gutter: 4,
  });
  const [searchValue, setSearchValue] = useState('');

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      onChange(value);
      setSearchValue(value);
    },
    [onChange]
  );

  const handleRemove = useCallback(
    () => {
      menu.hide();
      onSelect(null);
      setSearchValue('');
    },
    [menu, onSelect]
  );

  const handleMenuSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      menu.hide();
      const id = event.currentTarget.id;
      onSelect(items.find(item => keySelector(item) === id)!);
    },
    [menu, items, onSelect]
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
    <field as="div" className={className}>
      <field-label as='label'>{children}</field-label>
      <input-box as="div">
        <input
          ref={ref}
          onChange={handleChange}
          value={selectedItem ? valueSelector(selectedItem) : searchValue}
          readOnly={!!selectedItem || readOnly}
          {...use({ mod })}
          {...rest}
        />
        {(selectedItem && !readOnly) && (
          <IconButton type="button" name="reject" viewBox="0 0 11 11" onClick={handleRemove} />
        )}
        {!readOnly && (
          <>
            <MenuButton {...menu}><Icon name="arrow" viewBox="0 0 16 16" {...use({ focus: menu.visible })} /></MenuButton>
            <Menu {...menu} aria-label={propertyName} unstable_initialFocusRef={ref}>
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
}
