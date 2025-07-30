/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';
import clsx from 'clsx';
import { SelectProvider, Select, SelectPopover, SelectItem, SelectLabel, type SelectProviderProps } from './Select.js';
import './SelectField.css';

export interface SelectItem<T> {
  value: T;
  label: string;
  disabled?: boolean;
}

type PropertyGetter<ItemType, ValueType> = (item: ItemType) => ValueType;

export interface SelectFieldProps<T, ItemType = SelectItem<T>> {
  /** Options array - can be SelectOption objects or arbitrary objects */
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
   * Custom renderer for the selected value, overrides itemRenderer for the selected state
   * Only needed for special formatting of the selected value different from list items
   */
  selectedRender?: (value: T | undefined, item: ItemType | undefined) => React.ReactNode;

  /**
   * Custom arrow icon React Node that will be rendered instead default one
   */
  arrowIcon?: React.ReactNode;

  store?: SelectProviderProps['store'];

  autoFocusItemsOnShow?: boolean;

  'aria-labelledby'?: string, 

  'aria-label'?: string

  id?: string;
}

// Utility function to get value by it's key or using getter function
function getValueByPath<Item, Value>(item: Item, getter: PropertyGetter<Item, Value> | undefined, defaultGetter: (item: Item) => Value): Value {
  return getter ? getter(item) : defaultGetter(item);
}

export function SelectField<T, ItemType extends {} = SelectItem<T>>({
  items,
  value,
  onChange,
  itemValue,
  itemRender,
  itemDisabled,
  label,
  noItemsPlaceholder = 'No items',
  description,
  disabled,
  required,
  className,
  selectedRender,
  arrowIcon,
  store,
  autoFocusItemsOnShow,
  name,
  id,
}: SelectFieldProps<T, ItemType>) {
  const getItemValue = (item: ItemType): T =>
    getValueByPath<ItemType, T>(item, itemValue, i => ('value' in i ? (i as unknown as SelectItem<T>).value : (i as unknown as T)));

  const renderItem = (item: ItemType): React.ReactNode =>
    getValueByPath<ItemType, React.ReactNode>(item, itemRender, i => ('label' in i ? (i as unknown as SelectItem<T>).label : String(i)));

  const isItemDisabled = (item: ItemType): boolean =>
    getValueByPath<ItemType, boolean>(item, itemDisabled, i => ('disabled' in i ? Boolean((i as unknown as SelectItem<T>).disabled) : false));

  const [selectedValue, setSelectedValue] = useState<T | undefined>(() => {
    if (value !== undefined) return value;

    const firstEnabledItem = items.find(item => !isItemDisabled(item));
    return firstEnabledItem ? getItemValue(firstEnabledItem) : undefined;
  });

  const handleChange = (newValue: T) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const currentValue = value !== undefined ? value : selectedValue;

  const selectedItem = items.find(item => getItemValue(item) === currentValue);

  const displayValue = selectedRender ? selectedRender(currentValue, selectedItem) : selectedItem ? renderItem(selectedItem) : '';

  return (
    <div className={clsx('dbv-kit-select-field', className)}>
      <SelectProvider value={currentValue as any} setValue={val => handleChange(val as T)} store={store}> 
        {label && <SelectLabel className={clsx(required && 'dbv-kit-select__label--required')}>{label}</SelectLabel>}

        <Select id={id} name={name} disabled={disabled} required={required}>
          {displayValue}
          {arrowIcon ?? <Select.Arrow className='dbv-kit-select__arrow-icon' />}
        </Select>
        {description && <span className="dbv-kit-select__description">{description}</span>}

        <SelectPopover autoFocusOnShow={autoFocusItemsOnShow} gutter={4} unmountOnHide>
          {items.length === 0 ? (
            <div className="dbv-kit-select__empty">{noItemsPlaceholder}</div>
          ) : (
            items.map(item => (
              <SelectItem
                key={String(getItemValue(item))}
                value={getItemValue(item) as any}
                disabled={isItemDisabled(item)}
              >
                {renderItem(item)}
              </SelectItem>
            ))
          )}
        </SelectPopover>
      </SelectProvider>
    </div>
  );
}
