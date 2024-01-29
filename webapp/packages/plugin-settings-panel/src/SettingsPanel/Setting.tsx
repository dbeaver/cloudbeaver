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
import { ESettingsValueType, type ISettingDescriptionWithScope, PluginManagerService } from '@cloudbeaver/core-plugin';
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import { schemaValidationError } from '@cloudbeaver/core-utils';

interface Props {
  source: ISettingsSource;
  setting: ISettingDescriptionWithScope;
}

export const Setting = observer<Props>(function Setting({ source, setting }) {
  const translate = useTranslate();
  const pluginManagerService = useService(PluginManagerService);

  const defaultValue = pluginManagerService.getSettings(setting.scope)?.getDefaultValue(setting.key);

  const key = `${setting.scope}.${setting.key}`;
  const value = source.getValue(key) ?? defaultValue ?? '';
  const name = translate(setting.name);
  const description = translate(setting.description);
  const disabled = false;
  const readOnly = false;
  const customValidation = useCustomInputValidation(value => {
    const result = setting.schema.safeParse(value);

    if (result.success) {
      return null;
    }

    return schemaValidationError(result.error).toString();
  });

  function handleChange(value: any) {
    source.setValue(key, value);
  }

  if (setting.type === ESettingsValueType.Checkbox) {
    return (
      <FieldCheckbox id={key} checked={value} title={description} disabled={disabled} readOnly={readOnly} groupGap onChange={handleChange}>
        {name}
      </FieldCheckbox>
    );
  }

  if (setting.type === ESettingsValueType.Select) {
    const options = setting.options?.map(option => ({ ...option, name: translate(option.name) })) || [];
    return (
      <Combobox
        id={key}
        items={options}
        keySelector={value => value.id}
        valueSelector={value => value.name}
        value={value}
        title={description}
        disabled={disabled}
        readOnly={readOnly}
        tiny
        onSelect={handleChange}
      >
        {name}
      </Combobox>
    );
  }

  if (setting.type === ESettingsValueType.Textarea) {
    return (
      <Textarea id={key} title={value} labelTooltip={description} value={value} disabled={disabled} readOnly={readOnly} onChange={handleChange}>
        {name}
      </Textarea>
    );
  }

  return (
    <InputField
      ref={customValidation}
      id={key}
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
