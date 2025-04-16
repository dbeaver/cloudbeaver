/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { s, TextPlaceholder, useOffsetPagination, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, DBObjectParentKey, DBObjectResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { isDefined } from '@dbeaver/js-helpers';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import styles from './ObjectPropertyTable.module.css';
import { TableLoader } from './Table/TableLoader.js';

interface ObjectPropertyTableProps {
  objectId: string;
  parentId?: string;
  className?: string;
}

export const ObjectPropertyTable = observer<ObjectPropertyTableProps>(function ObjectPropertyTable({ objectId, parentId, className }) {
  const translate = useTranslate();
  const navNodeViewService = useService(NavNodeViewService);
  const navTreeResource = useResource(ObjectPropertyTable, NavTreeResource, objectId, { forceSuspense: true });

  const pagination = useOffsetPagination(DBObjectResource, {
    key: DBObjectParentKey(objectId),
    pageSize: navTreeResource.resource.childrenLimit,
  });

  const dbObjectLoader = useResource(ObjectPropertyTable, DBObjectResource, pagination.currentPage);

  const allData = dbObjectLoader.resource.get(pagination.allPages).filter(isDefined);
  const { nodes, duplicates } = navNodeViewService.filterDuplicates(allData.map(node => node?.id) || []);

  const objects = allData.filter(node => nodes.includes(node.id)) as DBObject[];

  useEffect(() => {
    navNodeViewService.logDuplicates(objectId, duplicates);
  });

  return (
    <>
      {nodes.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <div className={s(styles, { box: true }, className)}>
          <TableLoader objects={objects} hasNextPage={pagination.hasNextPage} loadMore={pagination.loadMore} />
        </div>
      )}
    </>
  );
});
