/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { FormGroup, Switch } from '@cloudbeaver/core-blocks';
import { isSimpleNavigatorView, CONNECTION_NAVIGATOR_VIEW_SETTINGS } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';

import type { IServerConfigurationPageState } from '../IServerConfigurationPageState';

interface Props {
  configs: IServerConfigurationPageState;
}

export const ServerConfigurationNavigatorViewForm: React.FC<Props> = observer(function ServerConfigurationNavigatorViewForm({
  configs,
}) {
  const translate = useTranslate();

  const isSimpleView = isSimpleNavigatorView(configs.navigatorConfig);

  const onNavigatorViewChangeHandler = useCallback((value: boolean) => {
    if (value) {
      configs.navigatorConfig = { ...CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple };
    } else {
      configs.navigatorConfig = { ...CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced };
    }
  }, [configs]);

  return (
    <>
      <FormGroup>
        <Switch
          name='simpleNavigatorViewEnabled'
          description={translate('administration_configuration_wizard_configuration_navigation_tree_view_description')}
          mod={['primary']}
          checked={isSimpleView}
          long
          onChange={onNavigatorViewChangeHandler}
        >
          {translate('administration_configuration_wizard_configuration_navigation_tree_view')}
        </Switch>
      </FormGroup>
    </>
  );
});
