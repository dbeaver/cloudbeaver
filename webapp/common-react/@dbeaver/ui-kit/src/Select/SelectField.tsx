/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { SelectProvider, Select, SelectPopover, SelectItem, SelectLabel, SelectGroup, type SelectProviderProps } from './Select.js';
import './SelectField.css';

export interface ISelectItem<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

type PropertyGetter<ItemType, ValueType> = (item: ItemType) => ValueType;

export interface ISelectFieldProps<T, ItemType = ISelectItem<T>> {
  /** Options array - can be SelectOption objects or arbitrary objects */
  items: ItemType[];

  /**
   * Function to extract serialized value from items
   * Example: (key) => JSON.stringify(key)
   */
  itemValueSerialized?: PropertyGetter<T, string>;

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

  /**
   * When true for an item, it acts as a group boundary — items are split into
   * SelectGroup chunks separated by a CSS border. Separator items are not rendered.
   */
  isSeparator?: PropertyGetter<ItemType, boolean>;

  value?: T;

  onChange?: (value: T) => void;

  label?: React.ReactNode;

  description?: React.ReactNode;

  name?: string;

  disabled?: boolean;

  required?: boolean;

  className?: string;

  noItemsPlaceholder?: React.ReactNode;

  /**
   * Items pinned above the scrollable list, always visible at the top of the popover.
   * Uses the same item API (itemValue, itemRender, itemDisabled) as the main items list.
   */
  headerItems?: ItemType[];

  /**
   * Items pinned below the scrollable list, always visible at the bottom of the popover.
   * Uses the same item API (itemValue, itemRender, itemDisabled) as the main items list.
   */
  footerItems?: ItemType[];

  /**
   * Custom renderer for the selected value, overrides itemRenderer for the selected state
   * Only needed for special formatting of the selected value different from list items
   */
  selectedRender?: (value: T | undefined, item: ItemType | undefined) => React.ReactNode;

  /**
   * Custom arrow icon React Node that will be rendered instead default one
   */
  arrowIcon?: React.ReactNode;

  store?: SelectProviderProps['store'];

  portal?: boolean;

  autoFocusItemsOnShow?: boolean;

  'aria-labelledby'?: string;

  'aria-label'?: string;

  id?: string;
}

// Utility function to get value by it's key or using getter function
function getValueByPath<Item, Value>(item: Item, getter: PropertyGetter<Item, Value> | undefined, defaultGetter: (item: Item) => Value): Value {
  return getter ? getter(item) : defaultGetter(item);
}

function splitIntoGroups<ItemType>(items: ItemType[], isSeparator: PropertyGetter<ItemType, boolean>): ItemType[][] {
  const groups: ItemType[][] = [[]];
  for (const item of items) {
    if (isSeparator(item)) {
      groups.push([]);
    } else {
      groups[groups.length - 1]!.push(item);
    }
  }
  return groups.filter(g => g.length > 0);
}

export function SelectField<T, ItemType extends {} = ISelectItem<T>>({
  items,
  value,
  onChange,
  itemValue,
  itemValueSerialized,
  itemRender,
  itemDisabled,
  isSeparator,
  label,
  noItemsPlaceholder = 'No items',
  headerItems,
  footerItems,
  description,
  disabled,
  required,
  className,
  portal = false,
  selectedRender,
  arrowIcon,
  store,
  autoFocusItemsOnShow,
  name,
  id,
}: ISelectFieldProps<T, ItemType>) {
  const getItemValue = (item: ItemType): T =>
    getValueByPath<ItemType, T>(item, itemValue, i => ('value' in i ? (i as unknown as ISelectItem<T>).value : (i as unknown as T)));

  const getItemValueSerialized = (item: ItemType): string =>
    getValueByPath<T, string>(getItemValue(item), itemValueSerialized, key => JSON.stringify(key));

  const renderItem = (item: ItemType): React.ReactNode =>
    getValueByPath<ItemType, React.ReactNode>(item, itemRender, i => ('label' in i ? (i as unknown as ISelectItem<T>).label : String(i)));

  const isItemDisabled = (item: ItemType): boolean =>
    getValueByPath<ItemType, boolean>(item, itemDisabled, i => ('disabled' in i ? Boolean((i as unknown as ISelectItem<T>).disabled) : false));

  const [selectedValue, setSelectedValue] = useState<T | undefined>(() => {
    if (value !== undefined) {
      return value;
    }

    const firstEnabledItem = items.find(item => !isItemDisabled(item));
    return firstEnabledItem ? getItemValue(firstEnabledItem) : undefined;
  });

  const handleChange = (newValue: string | readonly string[]) => {
    // TODO: add support for multi-select

    const allItems = [...(headerItems ?? []), ...items, ...(footerItems ?? [])];
    const newItem = allItems.find(item => getItemValueSerialized(item) === newValue);
    if (!newItem) {
      return;
    }
    const newItemValue = getItemValue(newItem);
    setSelectedValue(newItemValue);
    onChange?.(newItemValue);
  };

  const currentValue = value !== undefined ? value : selectedValue;
  let currentValueSerialized = undefined;

  if (currentValue !== undefined) {
    currentValueSerialized = itemValueSerialized ? itemValueSerialized(currentValue) : JSON.stringify(currentValue);
  }

  const selectedItem = currentValue !== undefined ? items.find(item => getItemValueSerialized(item) === currentValueSerialized) : undefined;
  const displayValue = selectedRender ? selectedRender(currentValue, selectedItem) : selectedItem ? renderItem(selectedItem) : '';

  function renderSelectItem(item: ItemType) {
    return (
      <SelectItem key={getItemValueSerialized(item)} value={getItemValueSerialized(item)} disabled={isItemDisabled(item)}>
        {renderItem(item)}
      </SelectItem>
    );
  }

  function renderItems(): React.ReactNode {
    if (items.length === 0) {
      return <div className="dbv-kit-select__empty">{noItemsPlaceholder}</div>;
    }

    if (isSeparator) {
      return splitIntoGroups(items, isSeparator).map(group => (
        <SelectGroup key={getItemValueSerialized(group[0]!)}>{group.map(renderSelectItem)}</SelectGroup>
      ));
    }

    return items.map(renderSelectItem);
  }

  return (
    <div className={clsx('dbv-kit-select-field', className)}>
      <SelectProvider value={currentValueSerialized} setValue={val => handleChange(val)} store={store}>
        {label && <SelectLabel className={clsx(required && 'dbv-kit-select__label--required')}>{label}</SelectLabel>}

        <Select id={id} name={name} disabled={disabled} required={required}>
          <span className="dbv-kit-select__value">{displayValue}</span>
          {arrowIcon ?? <Select.Arrow className="dbv-kit-select__arrow-icon tw:text-sm!" />}
        </Select>
        {description && <span className="dbv-kit-select__description">{description}</span>}

        <SelectPopover autoFocusOnShow={autoFocusItemsOnShow} portal={portal} gutter={4} unmountOnHide>
          {headerItems && headerItems.length > 0 && (
            <SelectGroup className="dbv-kit-select__popover-header">{headerItems.map(renderSelectItem)}</SelectGroup>
          )}
          <div className="dbv-kit-select__popover-items">{renderItems()}</div>
          {footerItems && footerItems.length > 0 && (
            <SelectGroup className="dbv-kit-select__popover-footer">{footerItems.map(renderSelectItem)}</SelectGroup>
          )}
        </SelectPopover>
      </SelectProvider>
    </div>
  );
}
