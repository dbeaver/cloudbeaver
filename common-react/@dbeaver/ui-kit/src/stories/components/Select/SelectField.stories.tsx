import { useState } from 'react';
import { SelectField } from '../../../Select/SelectField.js';

export const Field = () => {
  const [value, setValue] = useState('apple');

  const complexData = [
    { id: 1, firstName: 'John', lastName: 'Doe', department: { code: 'HR' }, isActive: true, permissions: { level: 1 } },
    { id: 2, firstName: 'Jane', lastName: 'Doe', department: { code: 'IT' }, isActive: false, permissions: { level: 2 } },
    { id: 3, firstName: 'Alice', lastName: 'Doe', department: { code: 'HR' }, isActive: true, permissions: { level: 3 } },
    { id: 4, firstName: 'Bob', lastName: 'Doe', department: { code: 'IT' }, isActive: false, permissions: { level: 4 } },
    { id: 5, firstName: 'Charlie', lastName: 'Doe', department: { code: 'HR' }, isActive: true, permissions: { level: 3 } },
  ];

  const handleChange = (value: number) => {
    console.log(value);
  };

  const options = [
    { value: 'apple', label: 'Apple', disabled: false },
    { value: 'banana', label: 'Banana', disabled: false },
    { value: 'orange', label: 'Orange', disabled: true },
  ];

  return (
    <div className="tw:space-y-8">
      <h1>Select Field</h1>
      <p>
        This is opinionated Select component that uses props for customization. It also can be customize using general Select css variables and
        classes
      </p>
      <div>
        <h3>Default</h3>
        <SelectField
          label="Default Select Field"
          items={[
            { value: '1', label: '1' },
            { value: '2', label: 'Item 2' },
          ]}
        />
      </div>
      <div>
        <h3>Select field with label at the end</h3>
        <SelectField
          label="Label here"
          description="Some field description here"
          items={[
            { value: '1', label: '1' },
            { value: '2', label: 'Item 2' },
          ]}
        />
      </div>
      <div>
        <h3>Controlled required select with disabled option, set width and custom item render</h3>
        <SelectField
          label="Choose fruit"
          itemRender={option => (
            <span className="tw:flex tw:items-center tw:gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="8" fill="red" />
              </svg>
              {option.label}
            </span>
          )}
          items={options}
          value={value}
          onChange={setValue}
          required
          className="tw:w-[300px]"
        />
      </div>
      <div>
        <h3>
          Complex getters (see sources <kbd>s</kbd>)
        </h3>
        <SelectField
          items={complexData}
          itemValue={item => item.id}
          itemRender={item => `${item.firstName} ${item.lastName} (${item.department.code}) (${item.permissions.level})`}
          itemDisabled={item => !item.isActive || item.permissions.level < 3}
          onChange={handleChange}
        />
      </div>
      <div>
        <h3>Empty options array</h3>
        <SelectField label="Choose something" items={[]} className="tw:w-[300px]" />
      </div>
    </div>
  );
};
