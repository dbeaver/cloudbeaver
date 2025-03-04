import { useState } from 'react';
import { SelectField } from '../../../Select/SelectField.js';

export const Field = () => {
  const [value, setValue] = useState('apple');

  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange', disabled: true },
  ];

  return (
    <div className="tw:space-y-8">
      <div>
        <h3>Default</h3>
        <SelectField
          label="Default Select Field"
          options={[
            { value: '1', label: '1' },
            { value: '2', label: 'Item 2' },
          ]}
        />
      </div>
      <div>
        <h3>Select field with label at the end</h3>
        <SelectField
          label="Label here"
          description="end"
          options={[
            { value: '1', label: '1' },
            { value: '2', label: 'Item 2' },
          ]}
        />
      </div>
      <div>
        <h3>Controlled required select with disabled option and set width</h3>
        <SelectField
          label="Choose fruit"
          renderOption={option => (
            <span>
              <span className="codicon codicon-star"></span>
              {option.label}
            </span>
          )}
          options={options}
          value={value}
          onChange={setValue}
          required
          width="300px"
        />
      </div>
      <div>
        <h3>Empty options array</h3>
        <SelectField label="Choose something" options={[]} width="300px" />
      </div>
    </div>
  );
};
