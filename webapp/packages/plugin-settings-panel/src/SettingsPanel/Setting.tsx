/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Link, useTranslate } from '@cloudbeaver/core-blocks';
import { clsx } from '@dbeaver/ui-kit';
import { type ISettingDescription, type ISettingsSource } from '@cloudbeaver/core-settings';
import { SettingField } from './SettingField.js';

interface Props {
  source: ISettingsSource;
  setting: ISettingDescription;
}

export const Setting = observer<Props>(function Setting({ source, setting }) {
  const translate = useTranslate();
  // DODO: hide this logic until we have more than one scope
  const isOverride = source.has(setting.key) && source.getEditedValue(setting.key) !== null && false;

  function handleRestore() {
    source.setValue(setting.key, null);
  }

  return (
    <div className='tw:flex tw:relative tw:gap-2'>
      <div className="tw:w-1 tw:h-full" hidden>
        {isOverride && (
          <div className={clsx('tw:h-full tw:w-full tw:bg-zinc-100 tw:dark:bg-zinc-700')} title={translate('plugin_settings_panel_setting_set_in_scope')} />
        )}
      </div>
      <div>
        <SettingField setting={setting} source={source} />
        {isOverride && (
          <Link className="theme-typography--caption" title={translate('plugin_settings_panel_setting_reset_tooltip')} onClick={handleRestore}>
            {translate('plugin_settings_panel_setting_reset')}
          </Link>
        )}
      </div>
    </div>
  );
});
