/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container, Group, GroupTitle, Select, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { useService } from '@cloudbeaver/core-di';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { ColorIndicator } from '@dbeaver/ui-kit';
import { ConnectionTypeResource, ConnectionTypeService } from '@cloudbeaver/core-connections';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

interface Props {
  config: ConnectionConfig;
}

export const ConnectionTypeForm = observer<Props>(function ConnectionTypeForm({ config }) {
  const translate = useTranslate();
  const connectionTypeService = useService(ConnectionTypeService);

  const connectionTypeResource = useResource(ConnectionTypeForm, ConnectionTypeResource, CachedMapAllKey);
  const types = connectionTypeResource.data.filter(isNotNullDefined);

  return (
    <Group form gap>
      <GroupTitle>{translate('plugin_connections_connection_type_label')}</GroupTitle>
      <Container gap dense>
        <Select
          items={types}
          name="connectionType"
          state={config}
          keySelector={t => t.id}
          valueSelector={t => t.name}
          iconSelector={t => {
            const color = connectionTypeService.getTypeColor(t.id);
            return color ? <ColorIndicator className="tw:w-3.5! tw:h-3.5!" color={color} /> : undefined;
          }}
        />
      </Container>
    </Group>
  );
});
