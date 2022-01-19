/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Switch } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CONNECTION_NAVIGATOR_VIEW_SETTINGS, isNavigatorViewSettingsEqual } from '@cloudbeaver/core-root';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IServerConfigurationPageState } from '../IServerConfigurationPageState';

interface Props {
  configs: IServerConfigurationPageState;
}

export const ServerConfigurationNavigatorViewForm = observer<Props>(function ServerConfigurationNavigatorViewForm({
  configs,
}) {
  const translate = useTranslate();

  const isSimpleView = isNavigatorViewSettingsEqual(configs.navigatorConfig, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);

  const onNavigatorViewChangeHandler = useCallback((value: boolean) => {
    if (value) {
      Object.assign(configs.navigatorConfig, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
    } else {
      Object.assign(configs.navigatorConfig, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced);
    }
  }, [configs]);

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <>
      <Switch
        name="simpleNavigatorViewEnabled"
        description={translate('administration_configuration_wizard_configuration_navigation_tree_view_description')}
        mod={['primary']}
        checked={isSimpleView}
        small
        onChange={onNavigatorViewChangeHandler}
      >
        {translate('administration_configuration_wizard_configuration_navigation_tree_view')}
      </Switch>
    </>
  );
});
