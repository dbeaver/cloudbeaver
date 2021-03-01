/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { PropsWithChildren } from 'react';
import styled from 'reshadow';

import { useDatabaseObjectInfo } from '@cloudbeaver/core-app';
import { ColoredContainer, Group, Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { BASE_CONTAINERS_STYLES } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ObjectProperty } from './ObjectProperty';

type ObjectPropertiesProps = PropsWithChildren<{
  objectId: string;
}>;

export const ObjectProperties = observer(function ObjectProperties({
  objectId,
}: ObjectPropertiesProps) {
  const translate = useTranslate();
  const { dbObject, isLoading } = useDatabaseObjectInfo(objectId);
  const styles = useStyles(BASE_CONTAINERS_STYLES);

  if (!dbObject?.properties && isLoading) {
    return <Loader />;
  }

  if (!dbObject?.properties || dbObject.properties.length === 0) {
    return <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>;
  }

  return styled(styles)(
    <ColoredContainer overflow parent>
      <Group>
        {dbObject.properties.map(v => (
          <ObjectProperty key={v.id} objectProperty={v} large />
        ))}
      </Group>
    </ColoredContainer>
  );
});
