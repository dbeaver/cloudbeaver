import { useState } from 'react';
import { SelectProvider, Select, SelectPopover, SelectItem, SelectLabel } from './Select.js';
import './SelectField.css';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

type PropertyPath = string;
type PropertyGetter<ItemType, ValueType> = PropertyPath | ((item: ItemType) => ValueType);

export interface SelectFieldProps<T = string, ItemType = SelectOption<T>> {
  /** Options array - can be SelectOption objects or arbitrary objects */
  items: ItemType[];

  /**
   * Function or object's key to extract value from items
   * Examples: 'id', (item) => item.id.toString()
   */
  itemValue?: PropertyGetter<ItemType, T>;

  /**
   * Function or object's key to extract label or render content from items
   * Examples: 'name', (item) => <span className="custom">{item.firstName}</span>
   */
  itemRender?: PropertyGetter<ItemType, React.ReactNode>;

  /**
   * Function or object's key to extract disabled state
   * Examples: 'isDisabled', (item) => !item.isActive
   */
  itemDisabled?: PropertyGetter<ItemType, boolean>;

  value?: T;

  onChange?: (value: T) => void;

  label?: React.ReactNode;

  description?: React.ReactNode;

  disabled?: boolean;

  required?: boolean;

  className?: string;

  /**
   * Custom renderer for the selected value, overrides itemRenderer for the selected state
   * Only needed for special formatting of the selected value different from list items
   */
  selectedRender?: (value: T | undefined, item: ItemType | undefined) => React.ReactNode;
}

// Utility function to get value by it's key or using getter function
function getValueByPath<Item, Value>(item: Item, keyOrGetter: PropertyGetter<Item, Value> | undefined, defaultGetter: (item: Item) => Value): Value {
  if (!keyOrGetter) {
    return defaultGetter(item);
  }

  if (typeof keyOrGetter === 'function') {
    return keyOrGetter(item);
  }

  return item[keyOrGetter as keyof Item] as Value;
}

export function SelectField<T = string, ItemType extends {} = SelectOption<T>>({
  items,
  value,
  onChange,
  itemValue,
  itemRender,
  itemDisabled,
  label,
  description,
  disabled,
  required,
  className,
  selectedRender,
}: SelectFieldProps<T, ItemType>) {
  const getItemValue = (item: ItemType): T =>
    getValueByPath<ItemType, T>(item, itemValue, i => ('value' in i ? (i as unknown as SelectOption<T>).value : (i as unknown as T)));

  const renderItem = (item: ItemType): React.ReactNode =>
    getValueByPath<ItemType, React.ReactNode>(item, itemRender, i => ('label' in i ? (i as unknown as SelectOption<T>).label : String(i)));

  const isItemDisabled = (item: ItemType): boolean =>
    getValueByPath<ItemType, boolean>(item, itemDisabled, i => ('disabled' in i ? Boolean((i as unknown as SelectOption<T>).disabled) : false));

  const [selectedValue, setSelectedValue] = useState<T | undefined>(() => {
    if (value !== undefined) return value;

    const firstEnabledOption = items.find(item => !isItemDisabled(item));
    return firstEnabledOption ? getItemValue(firstEnabledOption) : undefined;
  });

  const handleChange = (newValue: T) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const currentValue = value !== undefined ? value : selectedValue;

  const selectedItem = items.find(item => getItemValue(item) === currentValue);

  const displayValue = selectedItem ? (selectedRender ? selectedRender(currentValue, selectedItem) : renderItem(selectedItem)) : '';

  const labelClassName = required ? ' dbv-kit-select__label--required ' : undefined;

  return (
    <div className={`dbv-kit-select-field ${className || ''}`}>
      <SelectProvider value={currentValue as any} setValue={val => handleChange(val as T)}>
        {label && <SelectLabel className={labelClassName}>{label}</SelectLabel>}

        <Select disabled={disabled}>
          {displayValue}
          <Select.Arrow />
        </Select>
        {description && <span className="dbv-kit-select__description">{description}</span>}

        <SelectPopover gutter={4} unmountOnHide>
          {items.length === 0 ? (
            <div className="dbv-kit-select__empty">No options</div>
          ) : (
            items.map(item => (
              <SelectItem
                key={String(getItemValue(item))}
                value={getItemValue(item) as any}
                disabled={isItemDisabled(item)}
                className="dbv-kit-select__item"
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
