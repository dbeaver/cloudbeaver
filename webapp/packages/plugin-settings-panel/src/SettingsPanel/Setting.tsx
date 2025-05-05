/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Combobox, FieldCheckbox, InputField, Link, Textarea, useCustomInputValidation, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { clsx } from '@dbeaver/ui-kit';
import {
  ESettingsValueType,
  type ISettingDescription,
  type ISettingsSource,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schemaValidationError } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

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
  // TODO: need to figure out how to ignore user scope settings during configuring admin settings
  //       probably we can use layers to skip some layers when checking settings
  // const readOnly = settingsResolverService.isReadOnly(setting.key, source) ?? false;
  const readOnly = false;
  const isSet = source.isSet(setting.key);

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

  function handleRestore() {
    source.setValue(setting.key, null);
  }

  const settingBorderClass = clsx('tw:flex tw:relative tw:gap-2');

  const borderTooltip = (
    <div className="tw:w-1 tw:h-full">
      {isSet && (
        <div
          className={clsx('tw:h-full tw:w-full', isSet ? 'tw:bg-[var(--theme-primary)]' : 'tw:bg-transparent')}
          title={translate('plugin_settings_panel_setting_set_in_scope')}
        />
      )}
    </div>
  );

  const restore = isSet && (
    <Link className="theme-typography--caption" title={translate('plugin_settings_panel_setting_reset_tooltip')} onClick={handleRestore}>
      {translate('plugin_settings_panel_setting_reset')}
    </Link>
  );

  if (setting.type === ESettingsValueType.Checkbox) {
    return (
      <div className={settingBorderClass}>
        {borderTooltip}
        <div>
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
          {restore}
        </div>
      </div>
    );
  }

  if (setting.type === ESettingsValueType.Select) {
    const options = setting.options?.map(option => ({ ...option, name: translate(option.name) })) || [];
    return (
      <div className={settingBorderClass}>
        {borderTooltip}
        <div>
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
          {restore}
        </div>
      </div>
    );
  }

  if (setting.type === ESettingsValueType.Textarea) {
    return (
      <div className={settingBorderClass}>
        {borderTooltip}
        <div>
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
          {restore}
        </div>
      </div>
    );
  }

  return (
    <div className={settingBorderClass}>
      {borderTooltip}
      <div>
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
        {restore}
      </div>
    </div>
  );
});
