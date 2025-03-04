import { useState } from 'react';
import { SelectProvider, Select, SelectPopover, SelectItem, SelectLabel } from './Select.js';
import './SelectField.css';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps<T = string> {
  /** Options array */
  options: SelectOption<T>[] /* add getters for keys and values */;

  /** Current value */
  value?: T;

  /** Value change handler */
  onChange?: (value: T) => void;

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

  /** Selected value render function */
  renderValue?: (value: T | undefined, option: SelectOption<T> | undefined) => React.ReactNode;

  /** Option render function */
  renderOption?: (option: SelectOption<T>) => React.ReactNode;
}

export function SelectField<T = string>({
  options,
  value,
  onChange,
  label,
  description,
  disabled,
  required,
  width,
  className,
  renderValue,
  renderOption,
}: SelectFieldProps<T>) {
  const [selectedValue, setSelectedValue] = useState<T | undefined>((value || options[0]?.value) ?? undefined);

  const handleChange = (newValue: T) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const selectedOption = options.find(option => option.value === selectedValue);

  const displayValue = selectedOption ? (renderValue ? renderValue(selectedValue, selectedOption) : selectedOption.label) : label;

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
            options.map(option => (
              <SelectItem key={String(option.value)} value={option.value as any} disabled={option.disabled} className="dbv-kit-select__item">
                {renderOption ? renderOption(option) : option.label}
              </SelectItem>
            ))
          )}
        </SelectPopover>
      </SelectProvider>
    </div>
  );
}
