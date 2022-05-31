/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, GroupTitle, PlaceholderComponent, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { IConfigurationPlaceholderProps } from '@cloudbeaver/plugin-administration';

export const ResourceManagerSettings: PlaceholderComponent<IConfigurationPlaceholderProps> = observer(
  function ResourceManagerSettings({ state }) {
    const translate = useTranslate();

    return styled(BASE_CONTAINERS_STYLES)(
      <>
        <GroupTitle>{translate('plugin_resource_manager_title')}</GroupTitle>
        <Switch
          name='resourceManagerEnabled'
          state={state.serverConfig}
          description={translate('plugin_resource_manager_administration_settings_enable_description')}
          mod={['primary']}
          small
          autoHide
        >
          {translate('plugin_resource_manager_administration_settings_enable')}
        </Switch>
      </>
    );
  });