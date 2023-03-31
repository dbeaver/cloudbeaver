/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { TextPlaceholder, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavTreeResource, DBObjectResource, type DBObject, DBObjectParentKey } from '@cloudbeaver/core-navigation-tree';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { TableLoader } from './Table/TableLoader';

const styles = css`
  div {
    flex: auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
`;

interface ObjectPropertyTableProps {
  objectId: string;
  parentId?: string;
}

export const ObjectPropertyTable = observer<ObjectPropertyTableProps>(function ObjectPropertyTable({
  objectId,
  parentId,
}) {
  const translate = useTranslate();
  const navNodeViewService = useService(NavNodeViewService);
  const children = useResource(ObjectPropertyTable, NavTreeResource, parentId ?? null);
  const tree = useResource(ObjectPropertyTable, NavTreeResource, objectId, {
    preload: [children],
  });

  const limited = navNodeViewService.limit(tree.data || []);

  const { nodes, duplicates } = navNodeViewService.filterDuplicates(limited.nodes);

  const dbObject = useResource(ObjectPropertyTable, DBObjectResource, DBObjectParentKey(objectId), {
    preload: [tree],
  });

  useEffect(() => {
    navNodeViewService.logDuplicates(objectId, duplicates);
  });

  const objects = dbObject.data.filter(object => nodes.includes(object?.id ?? '')) as DBObject[];

  return styled(styles)(
    <>
      {nodes.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <div>
          <TableLoader objects={objects} truncated={limited.truncated > 0} />
        </div>
      )}
    </>
  );
});
