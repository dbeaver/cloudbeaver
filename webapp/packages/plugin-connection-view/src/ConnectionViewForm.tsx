/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container, FieldCheckbox, Group, GroupTitle, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { CONNECTION_NAVIGATOR_VIEW_SETTINGS, isNavigatorViewSettingsEqual } from '@cloudbeaver/core-root';
import { getConnectionFormOptionsPart, type ConnectionFormContainerProps } from '@cloudbeaver/plugin-connections';

import { getConnectionViewPart } from './getConnectionViewPart.js';

export const ConnectionViewForm = observer<ConnectionFormContainerProps>(function ConnectionViewForm({ formState }) {
  const translate = useTranslate();
  const optionsFormPart = getConnectionFormOptionsPart(formState);
  const viewFormPart = getConnectionViewPart(formState);

  useAutoLoad(ConnectionViewForm, [optionsFormPart, viewFormPart]);

  const isSimple = isNavigatorViewSettingsEqual(viewFormPart.state, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);

  function changeView() {
    const view = isSimple ? CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced : CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple;
    viewFormPart.state = { ...viewFormPart.state, ...view };
  }

  return (
    <Group form gap>
      <GroupTitle>{translate('plugin_connection_view')}</GroupTitle>
      <Container gap dense>
        <FieldCheckbox id="simple" checked={isSimple} onChange={changeView}>
          {translate('plugin_connection_view_option_simple')}
        </FieldCheckbox>
        <FieldCheckbox name="showSystemObjects" state={viewFormPart.state}>
          {translate('plugin_connection_view_option_show_system_objects')}
        </FieldCheckbox>
      </Container>
    </Group>
  );
});
