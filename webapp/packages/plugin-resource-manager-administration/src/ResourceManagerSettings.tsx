/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';
import { type IConfigurationPlaceholderProps, ServerConfigurationFeature } from '@cloudbeaver/plugin-administration';

export const ResourceManagerSettings: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(function ResourceManagerSettings({ state }) {
  const translate = useTranslate();

  if (state.serverConfig.resourceManagerEnabled == null) {
    return null;
  }

  return (
    <ServerConfigurationFeature
      state={state.serverConfig}
      name="resourceManagerEnabled"
      description={translate('plugin_resource_manager_administration_settings_enable_description')}
    >
      {translate('plugin_resource_manager_administration_settings_enable')}
    </ServerConfigurationFeature>
  );
});
