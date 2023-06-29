/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { FormFieldType } from '@cloudbeaver/core-settings';

import { SettingsInfoFormField } from './SettingsInfoFormField';

interface SettingsProps {
  key: string;
  type: FormFieldType;
  disabled?: boolean;
  value?: any;
  options?: any[];
  description?: string;
  name?: string;
}

interface SettingsInfoFormProps {
  fields: SettingsProps[];
  className?: string;
  readOnly?: boolean;
  onSelect?: (value: any) => void;
  onChange?: (value: any) => void;
}

export const SettingsInfoForm = observer<SettingsInfoFormProps>(function SettingsInfoForm({ fields, className, readOnly, onChange, onSelect }) {
  const translate = useTranslate();

  if (fields.length === 0) {
    return <TextPlaceholder>{translate('settings_panel_empty_fields')}</TextPlaceholder>;
  }

  return (
    <>
      {fields.map(field => (
        <SettingsInfoFormField
          key={field.key}
          id={field.key}
          type={field.type}
          value={field.value}
          options={field.options}
          description={field.description}
          name={field.name}
          disabled={field.disabled}
          readOnly={readOnly}
          className={className}
          onChange={onChange}
          onSelect={onSelect}
        />
      ))}
    </>
  );
});
