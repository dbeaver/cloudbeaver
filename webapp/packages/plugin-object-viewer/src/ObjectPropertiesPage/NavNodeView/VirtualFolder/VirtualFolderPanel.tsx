/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { TextPlaceholder, useOffsetPagination, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type DBObject, DBObjectParentKey, DBObjectResource, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { isDefined } from '@dbeaver/js-helpers';
import { type NavNodeTransformViewComponent, NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { TableLoader } from '../../ObjectPropertyTable/Table/TableLoader.js';
import classes from './VirtualFolderPanel.module.css';
import { VirtualFolderUtils } from './VirtualFolderUtils.js';

export const VirtualFolderPanel: NavNodeTransformViewComponent = observer(function VirtualFolderPanel({ folderId, nodeId }) {
  const translate = useTranslate();
  const nodeType = VirtualFolderUtils.getNodeType(folderId);
  const navNodeViewService = useService(NavNodeViewService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const tree = useResource(VirtualFolderPanel, NavTreeResource, nodeId);

  const pagination = useOffsetPagination(DBObjectResource, {
    key: DBObjectParentKey(nodeId),
    pageSize: tree.resource.childrenLimit,
  });

  const dbObjectLoader = useResource(VirtualFolderPanel, DBObjectResource, pagination.currentPage);

  const allData = dbObjectLoader.resource.get(pagination.allPages).filter(isDefined);
  const { nodes, duplicates } = navNodeViewService.filterDuplicates(allData.map(node => node?.id) || []);

  const objects = allData.filter(
    object => object && nodes.includes(object.id) && navNodeInfoResource.get(object.id)?.nodeType === nodeType,
  ) as DBObject[];

  useEffect(() => {
    navNodeViewService.logDuplicates(nodeId, duplicates);
  });

  return (
    <>
      {objects.length === 0 ? (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      ) : (
        <div className={classes['tabWrapper']}>
          <TableLoader objects={objects} hasNextPage={pagination?.hasNextPage ?? false} loadMore={pagination.loadMore} />
        </div>
      )}
    </>
  );
});
