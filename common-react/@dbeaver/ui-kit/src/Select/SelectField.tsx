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
  options: ItemType[];

  /** Current value */
  value?: T;

  /** Value change handler */
  onChange?: (value: T) => void;

  /**
   * Function or property path to extract value from items
   * Examples: 'id', 'user.id', (item) => item.id.toString()
   */
  valueGetter?: PropertyGetter<ItemType, T>;

  /**
   * Function or property path to extract label or render content from items
   * Examples: 'name', 'user.name', (item) => <span className="custom">{item.firstName}</span>
   */
  itemRender?: PropertyGetter<ItemType, React.ReactNode>;

  /**
   * Function or property path to extract disabled state
   * Examples: 'isDisabled', 'permissions.canSelect', (item) => !item.isActive
   */
  disabledGetter?: PropertyGetter<ItemType, boolean>;

  /** Select label */
  label?: React.ReactNode;

  /** Select description */
  description?: React.ReactNode;

  /** Placeholder */
  placeholder?: string;

  /** Makes field disabled */
  disabled?: boolean;

  /** Is field required */
  required?: boolean;

  /** Select's width */
  width?: string | number;

  /** Custom class name */
  className?: string;

  /**
   * Custom renderer for the selected value, overrides itemRenderer for the selected state
   * Only needed for special formatting of the selected value different from list items
   */
  selectedRender?: (value: T | undefined, item: ItemType | undefined) => React.ReactNode;
}

// Utility function to get value by path or using getter function
function getValueByPath<Item, Value>(item: Item, pathOrGetter: PropertyGetter<Item, Value> | undefined, defaultGetter: (item: Item) => Value): Value {
  if (!pathOrGetter) {
    return defaultGetter(item);
  }

  if (typeof pathOrGetter === 'function') {
    return pathOrGetter(item);
  }

  // Handle property path like 'user.address.city'
  const path = pathOrGetter.split('.');
  let value: any = item;

  for (const prop of path) {
    if (value === null || value === undefined) return defaultGetter(item);
    value = value[prop];
  }

  return value !== undefined ? (value as Value) : defaultGetter(item);
}

export function SelectField<T = string, ItemType extends {} = SelectOption<T>>({
  options,
  value,
  onChange,
  valueGetter,
  itemRender,
  disabledGetter,
  label,
  description,
  disabled,
  required,
  width,
  className,
  selectedRender,
  placeholder,
}: SelectFieldProps<T, ItemType>) {
  const getItemValue = (item: ItemType): T =>
    getValueByPath<ItemType, T>(item, valueGetter, i => ('value' in i ? (i as unknown as SelectOption<T>).value : (i as unknown as T)));

  const renderItem = (item: ItemType): React.ReactNode =>
    getValueByPath<ItemType, React.ReactNode>(item, itemRender, i => ('label' in i ? (i as unknown as SelectOption<T>).label : String(i)));

  const isItemDisabled = (item: ItemType): boolean =>
    getValueByPath<ItemType, boolean>(item, disabledGetter, i => ('disabled' in i ? Boolean((i as unknown as SelectOption<T>).disabled) : false));

  const [selectedValue, setSelectedValue] = useState<T | undefined>(value ?? (options.length > 0 ? getItemValue(options[0]!) : undefined));

  const handleChange = (newValue: T) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const selectedItem = options.find(item => getItemValue(item) === selectedValue);

  const displayValue = selectedItem
    ? selectedRender
      ? selectedRender(selectedValue, selectedItem)
      : renderItem(selectedItem)
    : placeholder || label;

  const labelClassName = required ? ' dbv-kit-select__label--required ' : undefined;

  return (
    <div className={`dbv-kit-select-field ${className || ''}`} style={{ width }}>
      <SelectProvider value={selectedValue as any} setValue={val => handleChange(val as T)}>
        {label && <SelectLabel className={labelClassName}>{label}</SelectLabel>}

        <Select disabled={disabled}>
          {displayValue}
          <Select.Arrow />
        </Select>
        {description && <span className="dbv-kit-select__description">{description}</span>}

        <SelectPopover gutter={4} unmountOnHide>
          {options.length === 0 ? (
            <div className="dbv-kit-select__empty">No options</div>
          ) : (
            options.map(item => (
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
