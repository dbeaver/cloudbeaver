/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, FieldCheckbox, InputField, Textarea } from '@cloudbeaver/core-blocks';
import { FormFieldType } from '@cloudbeaver/core-settings';

export interface SettingsInfoFormFieldProps {
  id: string;
  type: FormFieldType;
  disabled?: boolean;
  value?: any;
  options?: any[];
  description?: string;
  name?: string;
  className?: string;
  readOnly?: boolean;
  onSelect?: (value: any) => void;
  onChange?: (value: any) => void;
}

export const SettingsInfoFormField = observer<SettingsInfoFormFieldProps>(function SettingsInfoFormField({
  id,
  type,
  value,
  description,
  disabled,
  name,
  className,
  readOnly,
  options,
  onSelect,
  onChange,
}) {
  if (type === FormFieldType.Checkbox) {
    return (
      <FieldCheckbox id={id} checked={value} title={description} disabled={disabled || readOnly} className={className} tiny onChange={onChange}>
        {name ?? ''}
      </FieldCheckbox>
    );
  }

  if (type === FormFieldType.Combobox && options !== undefined) {
    return (
      <Combobox
        id={id}
        items={options}
        keySelector={value => value.id}
        valueSelector={value => value.name}
        value={value}
        title={description}
        disabled={disabled}
        readOnly={readOnly}
        className={className}
        tiny
        onSelect={onSelect}
      >
        {name ?? ''}
      </Combobox>
    );
  }

  if (type === FormFieldType.Textarea) {
    return (
      <Textarea
        id={id}
        title={value}
        labelTooltip={description || name}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        mod="surface"
        className={className}
        onChange={onChange}
      >
        {name ?? ''}
      </Textarea>
    );
  }

  return (
    <InputField
      id={id}
      type="text"
      title={value}
      labelTooltip={description || name}
      value={value}
      description={description}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      small
      onChange={onChange}
    >
      {name ?? ''}
    </InputField>
  );
});
