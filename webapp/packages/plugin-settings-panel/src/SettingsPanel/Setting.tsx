/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, FieldCheckbox, InputField, Textarea, useCustomInputValidation, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  ESettingsValueType,
  type ISettingDescription,
  type ISettingsSource,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { isNotNullDefined, schemaValidationError } from '@cloudbeaver/core-utils';

interface Props {
  source: ISettingsSource;
  setting: ISettingDescription;
}

export const Setting = observer<Props>(function Setting({ source, setting }) {
  const settingsResolverService = useService(SettingsResolverService);
  const settingsProviderService = useService(SettingsProviderService);
  const translate = useTranslate();

  const name = translate(setting.name);
  const description = translate(setting.description);
  const disabled = false;
  const readOnly = settingsResolverService.isReadOnly(setting.key) ?? false;

  let value = source.getEditedValue(setting.key);
  if (readOnly) {
    value = settingsResolverService.getValue(setting.key);
  }

  if (setting.key in settingsProviderService.schema.shape) {
    const schema = settingsProviderService.schema.shape[setting.key];
    if (!isNotNullDefined(value)) {
      const result = schema.safeParse(undefined);
      value = result.success ? result.data : '';
    }

    const result = schema.safeParse(value);
    value = result.success ? result.data : value;
  }

  value = value ?? '';

  const customValidation = useCustomInputValidation(value => {
    if (!(setting.key in settingsProviderService.schema.shape)) {
      return null;
    }
    const result = settingsProviderService.schema.shape[setting.key].safeParse(value);

    if (result.success) {
      return null;
    }

    return schemaValidationError(result.error).toString();
  });

  function handleChange(value: any) {
    source.setValue(setting.key, value);
  }

  if (setting.type === ESettingsValueType.Checkbox) {
    return (
      <FieldCheckbox
        id={String(setting.key)}
        checked={value}
        label={name}
        title={name}
        caption={description}
        disabled={disabled}
        readOnly={readOnly}
        groupGap
        onChange={handleChange}
      />
    );
  }

  if (setting.type === ESettingsValueType.Select) {
    const options = setting.options?.map(option => ({ ...option, name: translate(option.name) })) || [];
    return (
      <Combobox
        id={String(setting.key)}
        items={options}
        keySelector={value => value.value}
        valueSelector={value => value.name}
        value={value}
        title={name}
        disabled={disabled}
        readOnly={readOnly}
        description={description}
        small
        onSelect={handleChange}
      >
        {name}
      </Combobox>
    );
  }

  if (setting.type === ESettingsValueType.Textarea) {
    return (
      <Textarea
        id={String(setting.key)}
        title={value}
        labelTooltip={description}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
      >
        {name}
      </Textarea>
    );
  }

  return (
    <InputField
      ref={customValidation}
      id={String(setting.key)}
      type="text"
      title={value}
      labelTooltip={description}
      value={value}
      description={description}
      disabled={disabled}
      readOnly={readOnly}
      small
      onChange={handleChange}
    >
      {name}
    </InputField>
  );
});
