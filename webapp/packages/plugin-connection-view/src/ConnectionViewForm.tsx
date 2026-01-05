/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, useTranslate } from '@cloudbeaver/core-blocks';
import { getConnectionFormOptionsPart, type ConnectionFormContainerProps } from '@cloudbeaver/plugin-connections';

export const ConnectionViewForm = observer<ConnectionFormContainerProps>(function ConnectionViewForm({ formState }) {
  const translate = useTranslate();
  const optionsFormPart = getConnectionFormOptionsPart(formState);

  return (
    <Group form gap>
      <GroupTitle>{translate('plugin_connection_view')}</GroupTitle>
      <Container gap>
        <div>{optionsFormPart.state.connectionId}</div>
      </Container>
    </Group>
  );
});
