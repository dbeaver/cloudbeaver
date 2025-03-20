/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button } from '../../Button/Button.js';
import { Checkbox } from '../../Checkbox/Checkbox.js';
import { Input } from '../../Input/Input.js';
import { Radio } from '../../Radio/index.js';
import { RadioGroup } from '../../Radio/RadioGroup.js';
import { SelectField } from '../../Select/SelectField.js';

export const SimpleForm = () => {
  return (
    <form className="tw:flex tw:flex-col tw:gap-2" onSubmit={e => (e.preventDefault(), console.log('submit'))}>
      <Input placeholder="John" name="first-name" label="First Name" />
      <Input placeholder="Snow" name="last-name" label="Last Name" />
      <SelectField
        label="Country"
        name="Country"
        items={[
          { value: 'USA', label: 'USA' },
          { value: 'Canada', label: 'Canada' },
          { value: 'UK', label: 'UK' },
        ]}
      />

      <RadioGroup vertical label="Marital Status">
        <Radio name="status" value={'single'}>
          Single
        </Radio>
        <Radio name="status" value={'married'}>
          Married
        </Radio>
        <Radio name="status" value={'divorced'}>
          Divorced
        </Radio>
      </RadioGroup>

      <RadioGroup vertical label="Children">
        <Radio value="Yes">Have children</Radio>
        <Radio value="No">No</Radio>
      </RadioGroup>
      <div>
        <Checkbox className="tw:flex-row-reverse">Veteran of the console.war</Checkbox>
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
};
