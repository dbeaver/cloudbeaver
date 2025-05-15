/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Combobox, FieldCheckbox, InputField, Textarea, useCustomInputValidation, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  ESettingsValueType,
  SettingsProviderService,
  SettingsResolverService,
  type ISettingDescription,
  type ISettingsSource,
} from '@cloudbeaver/core-settings';
import { schemaValidationError } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { observer } from 'mobx-react-lite';

interface Props {
  source: ISettingsSource;
  setting: ISettingDescription;
}

export const SettingField = observer<Props>(function SettingField({ setting, source }) {
  const settingsResolverService = useService(SettingsResolverService);
  const settingsProviderService = useService(SettingsProviderService);
  const translate = useTranslate();

  const name = translate(setting.name);
  const description = translate(setting.description);
  const disabled = false;
  // TODO: need to figure out how to ignore user scope settings during configuring admin settings
  //       probably we can use layers to skip some layers when checking settings
  // const readOnly = settingsResolverService.isReadOnly(setting.key, source) ?? false;
  const readOnly = false;

  let value = source.getEditedValue(setting.key);
  if (readOnly || !isNotNullDefined(value)) {
    value = settingsResolverService.getEditedValue(setting.key);
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

    return schemaValidationError(result.error, { prefix: null }).toString();
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
      readOnly={readOnly || disabled}
      small
      onChange={handleChange}
    >
      {name}
    </InputField>
  );
});
