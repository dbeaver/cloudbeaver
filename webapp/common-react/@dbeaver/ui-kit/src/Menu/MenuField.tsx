/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import { MenuProvider, Menu, MenuButton, MenuButtonArrow, useMenuStore, useStoreState, type MenuProps } from './Menu.js';
import './MenuField.css';
import { useLayoutEffect } from 'react';

export interface MenuItemData<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

type PropertyGetter<ItemType, ValueType> = (item: ItemType) => ValueType;

export interface MenuFieldProps<T, ItemType = MenuItemData<T>> {
  /** Options array - can be MenuItemData objects or arbitrary objects */
  items: ItemType[];

  /**
   * Function to extract label or render content from items
   * Example: (item) => item.firstName + ' ' + item.lastName
   */
  itemRender: PropertyGetter<ItemType, React.ReactNode>;

  onSwitch?: (open: boolean) => void;

  label?: React.ReactNode;

  description?: React.ReactNode;

  name?: string;

  disabled?: boolean;

  required?: boolean;

  className?: string;

  noItemsPlaceholder?: React.ReactNode;

  /**
   * Custom arrow icon React Node that will be rendered instead default one
   */
  buttonElement?: React.ReactNode;

  getAnchorRect?: MenuProps['getAnchorRect'];

  store?: ReturnType<typeof useMenuStore>;

  'aria-labelledby'?: string;

  'aria-label'?: string;

  id?: string;
}

export function MenuField<T, ItemType extends {} = MenuItemData<T>>({
  items,
  onSwitch,
  itemRender,
  getAnchorRect,
  label,
  noItemsPlaceholder = 'No items',
  description,
  disabled,
  required,
  className,
  buttonElement,
  store,
  id,
}: MenuFieldProps<T, ItemType>): React.ReactElement {
  const storeState = useStoreState(store);

  const isOpen = storeState?.open ?? false;

  useLayoutEffect(() => {
    onSwitch?.(isOpen);
  }, [isOpen, onSwitch]);

  return (
    <div className={clsx('dbv-kit-menu-field', className)}>
      <MenuProvider store={store}>
        {label && <label className={clsx('dbv-kit-menu__label', required && 'dbv-kit-menu__label--required')}>{label}</label>}
        <MenuButton id={id} disabled={disabled}>
          {buttonElement ?? <MenuButtonArrow className="dbv-kit-menu__arrow-icon" />}
        </MenuButton>
        {description && <span className="dbv-kit-menu__description">{description}</span>}
        <Menu getAnchorRect={getAnchorRect}>
          {items.length === 0 ? <div className="dbv-kit-menu__empty">{noItemsPlaceholder}</div> : items.map(itemRender)}
        </Menu>
      </MenuProvider>
    </div>
  );
}
