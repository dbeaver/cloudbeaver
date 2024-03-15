/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, FieldCheckbox, InputField, Textarea, useCustomInputValidation, useTranslate } from '@cloudbeaver/core-blocks';
import { ESettingsValueType, type ISettingDescriptionWithProvider, type ISettingsSource } from '@cloudbeaver/core-settings';
import { isNotNullDefined, schemaValidationError } from '@cloudbeaver/core-utils';

interface Props {
  source: ISettingsSource;
  setting: ISettingDescriptionWithProvider;
}

export const Setting = observer<Props>(function Setting({ source, setting }) {
  const translate = useTranslate();

  const name = translate(setting.name);
  const description = translate(setting.description);
  const disabled = false;
  const readOnly = setting.provider.isReadOnly(setting.key) ?? false;

  let value = source.getEditedValue(setting.scopedKey);
  if (readOnly) {
    value = setting.provider.getValue(setting.key) ?? '';
  }

  if (!isNotNullDefined(value)) {
    const result = setting.schema.safeParse(undefined);
    value = result.success ? result.data : '';
  }

  const result = setting.schema.safeParse(value);
  value = result.success ? result.data : value;

  const customValidation = useCustomInputValidation(value => {
    const result = setting.schema.safeParse(value);

    if (result.success) {
      return null;
    }

    return schemaValidationError(result.error).toString();
  });

  function handleChange(value: any) {
    source.setValue(setting.scopedKey, value);
  }

  if (setting.type === ESettingsValueType.Checkbox) {
    return (
      <FieldCheckbox
        id={setting.scopedKey}
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
        id={setting.scopedKey}
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
      <Textarea
        id={setting.scopedKey}
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
      id={setting.scopedKey}
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
