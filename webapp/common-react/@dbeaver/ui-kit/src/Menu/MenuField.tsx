/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import clsx from 'clsx';
import { MenuProvider, Menu, MenuButton, MenuItem, MenuButtonArrow, useMenuStore, useStoreState, type MenuProps } from './Menu.js';
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
   * Function to extract value from items
   * Example: (item) => item.id
   */
  itemValue?: PropertyGetter<ItemType, T>;

  /**
   * Function to extract label or render content from items
   * Example: (item) => item.firstName + ' ' + item.lastName
   */
  itemRender?: PropertyGetter<ItemType, React.ReactNode>;

  /**
   * Function to extract disabled state
   * Example: (item) => !item.isActive
   */
  itemDisabled?: PropertyGetter<ItemType, boolean>;

  onChange?: (value: T) => void;

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

// Utility function to get value by it's key or using getter function
function getValueByPath<Item, Value>(item: Item, getter: PropertyGetter<Item, Value> | undefined, defaultGetter: (item: Item) => Value): Value {
  return getter ? getter(item) : defaultGetter(item);
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function MenuField<T, ItemType extends {} = MenuItemData<T>>({
  items,
  onChange,
  itemValue,
  onSwitch,
  itemRender,
  itemDisabled,
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

  const getItemValue = (item: ItemType): T =>
    getValueByPath<ItemType, T>(item, itemValue, i =>
      isNonNullObject(i) && 'value' in i ? (i as unknown as MenuItemData<T>).value : (i as unknown as T),
    );

  const renderItem = (item: ItemType): React.ReactNode =>
    getValueByPath<ItemType, React.ReactNode>(item, itemRender, i =>
      isNonNullObject(i) && 'label' in i ? (i as unknown as MenuItemData<T>).label : String(i),
    );

  const isItemDisabled = (item: ItemType): boolean =>
    getValueByPath<ItemType, boolean>(item, itemDisabled, i =>
      isNonNullObject(i) && 'disabled' in i ? Boolean((i as unknown as MenuItemData<T>).disabled) : false,
    );

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
          {items.length === 0 ? (
            <div className="dbv-kit-menu__empty">{noItemsPlaceholder}</div>
          ) : (
            items.map(item => (
              <MenuItem key={String(getItemValue(item))} disabled={isItemDisabled(item)} onClick={() => onChange?.(getItemValue(item))}>
                {renderItem(item)}
              </MenuItem>
            ))
          )}
        </Menu>
      </MenuProvider>
    </div>
  );
}
